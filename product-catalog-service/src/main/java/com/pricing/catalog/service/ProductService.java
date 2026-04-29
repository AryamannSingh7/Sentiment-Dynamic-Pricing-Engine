package com.pricing.catalog.service;

import com.pricing.catalog.dto.CreateProductRequest;
import com.pricing.catalog.dto.PriceAdjustmentEvent;
import com.pricing.catalog.dto.UpdateProductRequest;
import com.pricing.catalog.exception.ProductNotFoundException;
import com.pricing.catalog.model.PriceAuditLog;
import com.pricing.catalog.model.Product;
import com.pricing.catalog.model.ProductStatus;
import com.pricing.catalog.repository.AuditLogRepository;
import com.pricing.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private static final BigDecimal MULTIPLIER_MIN   = new BigDecimal("0.50");
    private static final BigDecimal MULTIPLIER_MAX   = new BigDecimal("2.00");
    private static final BigDecimal MAX_DELTA_PER_EVENT = new BigDecimal("0.25");
    private static final int MAX_LOCK_RETRIES = 3;

    private static final Map<String, double[]> EVENT_TYPE_CONFIG = Map.of(
        "COMPETITOR_PRICE_DROP",   new double[]{-0.12, -0.70},
        "COMPETITOR_PRICE_SURGE",  new double[]{ 0.10,  0.60},
        "SOCIAL_TREND_POSITIVE",   new double[]{ 0.08,  0.75},
        "SOCIAL_TREND_NEGATIVE",   new double[]{-0.08, -0.60},
        "REVIEW_SURGE_POSITIVE",   new double[]{ 0.12,  0.85},
        "REVIEW_SURGE_NEGATIVE",   new double[]{-0.10, -0.70},
        "NEWS_POSITIVE",           new double[]{ 0.15,  0.80},
        "NEWS_NEGATIVE",           new double[]{-0.15, -0.75}
    );
    private static final Map<String, String> EVENT_TYPE_REASON = Map.of(
        "COMPETITOR_PRICE_DROP",   "Competitor slashed price by 15%",
        "COMPETITOR_PRICE_SURGE",  "Competitor raised price — demand shifts to us",
        "SOCIAL_TREND_POSITIVE",   "Product trending positively on social media",
        "SOCIAL_TREND_NEGATIVE",   "Negative social media sentiment detected",
        "REVIEW_SURGE_POSITIVE",   "Surge in 5-star reviews detected",
        "REVIEW_SURGE_NEGATIVE",   "Surge in 1-star reviews detected",
        "NEWS_POSITIVE",           "Positive press coverage driving demand",
        "NEWS_NEGATIVE",           "Negative news cycle suppressing demand"
    );

    private final ProductRepository    productRepository;
    private final AuditLogRepository   auditLogRepository;

    @Value("${pricing.cooldown-seconds:30}")
    private long cooldownSeconds;

    // ── CRUD ────────────────────────────────────────────────────────────────

    public Product createProduct(CreateProductRequest req) {
        Product product = Product.builder()
                .productId(UUID.randomUUID().toString())
                .name(req.name())
                .description(req.description())
                .category(req.category())
                .basePrice(req.basePrice())
                .currentPrice(req.basePrice())   // currentPrice starts equal to basePrice
                .priceMultiplier(BigDecimal.ONE)
                .sentimentScore(BigDecimal.ZERO)
                .inventory(req.inventory())
                .status(ProductStatus.ACTIVE)
                .tags(req.tags())
                .build();
        return productRepository.save(product);
    }

    public List<Product> getProducts(String category) {
        if (category != null && !category.isBlank()) {
            return productRepository.findByCategoryAndStatus(category, ProductStatus.ACTIVE);
        }
        return productRepository.findByStatus(ProductStatus.ACTIVE);
    }

    public Product getProductById(String productId) {
        return productRepository.findByProductId(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
    }

    public Product updateProduct(String productId, UpdateProductRequest req) {
        Product product = getProductById(productId);
        Optional.ofNullable(req.name()).ifPresent(product::setName);
        Optional.ofNullable(req.description()).ifPresent(product::setDescription);
        Optional.ofNullable(req.category()).ifPresent(product::setCategory);
        Optional.ofNullable(req.inventory()).ifPresent(product::setInventory);
        Optional.ofNullable(req.status()).ifPresent(product::setStatus);
        Optional.ofNullable(req.tags()).ifPresent(product::setTags);
        return productRepository.save(product);
    }

    public void deleteProduct(String productId) {
        Product product = getProductById(productId);
        product.setStatus(ProductStatus.DISCONTINUED);
        productRepository.save(product);
    }

    public List<PriceAuditLog> getAuditLog(String productId) {
        if (!productRepository.existsByProductId(productId)) {
            throw new ProductNotFoundException(productId);
        }
        return auditLogRepository.findByProductIdOrderByAppliedAtDesc(productId);
    }

    public Product triggerDemoAdjustment(String productId, String eventType) {
        if (!EVENT_TYPE_CONFIG.containsKey(eventType)) {
            throw new IllegalArgumentException("Unknown eventType: " + eventType +
                ". Valid: " + EVENT_TYPE_CONFIG.keySet());
        }
        // Pre-fetch to compute absolute target — applyPriceAdjustment expects an absolute multiplier,
        // not a delta (see delta-cap logic at line 132).
        Product current = getProductById(productId);
        double[] cfg = EVENT_TYPE_CONFIG.get(eventType);
        BigDecimal targetMultiplier = current.getPriceMultiplier()
                .add(BigDecimal.valueOf(cfg[0]))
                .setScale(4, RoundingMode.HALF_UP);

        PriceAdjustmentEvent syntheticEvent = new PriceAdjustmentEvent(
            UUID.randomUUID().toString(),
            "demo-" + UUID.randomUUID(),
            productId,
            targetMultiplier,
            BigDecimal.valueOf(cfg[1]).setScale(2, RoundingMode.HALF_UP),
            EVENT_TYPE_REASON.get(eventType),
            0.85,
            Instant.now().toString(),
            null
        );
        applyPriceAdjustment(syntheticEvent);
        return getProductById(productId);
    }

    // ── Pricing Pipeline ────────────────────────────────────────────────────

    /**
     * Applies a price adjustment event from the AI pipeline.
     *
     * Safety layers (in order):
     *   1. Idempotency  — skip if adjustmentEventId already applied
     *   2. Cooldown     — skip if product price was updated within the cooldown window
     *   3. Delta cap    — move at most MAX_DELTA_PER_EVENT per event
     *   4. Bounds guard — clamp multiplier to [MULTIPLIER_MIN, MULTIPLIER_MAX]
     *   5. Optimistic lock — retry up to MAX_LOCK_RETRIES times on version conflict
     */
    public void applyPriceAdjustment(PriceAdjustmentEvent event) {
        // 1. Idempotency: skip events already written to the audit log
        if (auditLogRepository.existsByAdjustmentEventId(event.adjustmentEventId())) {
            log.info("Duplicate event {} for product {}, skipping", event.adjustmentEventId(), event.productId());
            return;
        }

        int attempts = 0;
        while (true) {
            try {
                Product product = productRepository.findByProductId(event.productId())
                        .orElseThrow(() -> new ProductNotFoundException(event.productId()));

                // 2. Cooldown check
                if (isInCooldown(product)) {
                    log.info("Product {} in cooldown (last update: {}), skipping event {}",
                            event.productId(), product.getLastPriceUpdate(), event.adjustmentEventId());
                    return;
                }

                // 3. Delta cap: limit how much the multiplier can move in a single event
                BigDecimal currentMultiplier = product.getPriceMultiplier();
                BigDecimal targetMultiplier  = event.priceMultiplier();
                BigDecimal delta             = targetMultiplier.subtract(currentMultiplier);

                if (delta.abs().compareTo(MAX_DELTA_PER_EVENT) > 0) {
                    delta = delta.signum() > 0 ? MAX_DELTA_PER_EVENT : MAX_DELTA_PER_EVENT.negate();
                    targetMultiplier = currentMultiplier.add(delta);
                }

                // 4. Bounds guard
                targetMultiplier = targetMultiplier
                        .max(MULTIPLIER_MIN)
                        .min(MULTIPLIER_MAX);

                BigDecimal newPrice = product.getBasePrice()
                        .multiply(targetMultiplier)
                        .setScale(2, RoundingMode.HALF_UP);

                BigDecimal prevPrice      = product.getCurrentPrice();
                BigDecimal prevMultiplier = product.getPriceMultiplier();

                product.setCurrentPrice(newPrice);
                product.setPriceMultiplier(targetMultiplier);
                product.setSentimentScore(event.sentimentScore());
                product.setLastPriceUpdate(Instant.now());

                // 5. Save with optimistic lock (@Version field checked automatically)
                productRepository.save(product);

                // Write immutable audit record only after successful save
                writeAuditLog(event, product.getProductId(), prevPrice, newPrice, prevMultiplier, targetMultiplier);

                log.info("Price updated for product {}: {} -> {} (multiplier: {} -> {}, reason: {})",
                        event.productId(), prevPrice, newPrice, prevMultiplier, targetMultiplier,
                        event.adjustmentReason());
                return;

            } catch (OptimisticLockingFailureException ex) {
                attempts++;
                if (attempts >= MAX_LOCK_RETRIES) {
                    log.error("Optimistic lock failed {} times for product {}, giving up on event {}",
                            attempts, event.productId(), event.adjustmentEventId());
                    throw ex;
                }
                log.warn("Version conflict on product {}, retry {}/{}", event.productId(), attempts, MAX_LOCK_RETRIES);
            }
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private boolean isInCooldown(Product product) {
        return product.getLastPriceUpdate() != null &&
                product.getLastPriceUpdate().isAfter(Instant.now().minus(cooldownSeconds, ChronoUnit.SECONDS));
    }

    private void writeAuditLog(PriceAdjustmentEvent event, String productId,
                               BigDecimal prevPrice, BigDecimal newPrice,
                               BigDecimal prevMultiplier, BigDecimal newMultiplier) {
        PriceAuditLog audit = PriceAuditLog.builder()
                .auditId(UUID.randomUUID().toString())
                .productId(productId)
                .previousPrice(prevPrice)
                .newPrice(newPrice)
                .previousMultiplier(prevMultiplier)
                .newMultiplier(newMultiplier)
                .sentimentScore(event.sentimentScore())
                .adjustmentReason(event.adjustmentReason())
                .confidence(event.confidence())
                .sourceEventId(event.sourceEventId())
                .adjustmentEventId(event.adjustmentEventId())
                .appliedAt(Instant.now())
                .build();
        auditLogRepository.save(audit);
    }
}
