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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository productRepository;
    @Mock AuditLogRepository auditLogRepository;
    @InjectMocks ProductService productService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(productService, "cooldownSeconds", 0L);
    }

    @Test
    void createProduct_persistsWithBaseAndCurrentPriceEqual() {
        var req = new CreateProductRequest("Widget", "A widget", "Electronics",
                new BigDecimal("100.00"), 50, List.of("gadget"));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product saved = productService.createProduct(req);

        assertThat(saved.getBasePrice()).isEqualByComparingTo("100.00");
        assertThat(saved.getCurrentPrice()).isEqualByComparingTo("100.00");
        assertThat(saved.getPriceMultiplier()).isEqualByComparingTo("1");
        assertThat(saved.getStatus()).isEqualTo(ProductStatus.ACTIVE);
    }

    @Test
    void getProductById_throwsWhenNotFound() {
        when(productRepository.findByProductId("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> productService.getProductById("missing"))
                .isInstanceOf(ProductNotFoundException.class);
    }

    @Test
    void updateProduct_softDeleteSetsDiscontinued() {
        Product product = buildProduct("100.00", "1.0");
        when(productRepository.findByProductId("p1")).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        productService.deleteProduct("p1");

        assertThat(product.getStatus()).isEqualTo(ProductStatus.DISCONTINUED);
    }

    @Test
    void applyPriceAdjustment_updatesCurrentPriceCorrectly() {
        Product product = buildProduct("100.00", "1.0");
        when(productRepository.findByProductId("p1")).thenReturn(Optional.of(product));
        when(auditLogRepository.existsByAdjustmentEventId(any())).thenReturn(false);
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var event = new PriceAdjustmentEvent(
                "evt-1", "src-1", "p1",
                new BigDecimal("1.15"), new BigDecimal("0.15"),
                "Trending positive", 0.90, "2024-01-01T00:00:00Z", null);

        productService.applyPriceAdjustment(event);

        assertThat(product.getCurrentPrice()).isEqualByComparingTo("115.00");
        assertThat(product.getPriceMultiplier()).isEqualByComparingTo("1.15");
        verify(auditLogRepository).save(any(PriceAuditLog.class));
    }

    @Test
    void applyPriceAdjustment_capsMultiplierAtUpperBound() {
        Product product = buildProduct("100.00", "1.90");
        when(productRepository.findByProductId("p1")).thenReturn(Optional.of(product));
        when(auditLogRepository.existsByAdjustmentEventId(any())).thenReturn(false);
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Event requests 2.50 — beyond the 2.00 cap AND beyond the 0.25 delta cap from 1.90
        var event = new PriceAdjustmentEvent(
                "evt-2", "src-2", "p1",
                new BigDecimal("2.50"), new BigDecimal("0.15"),
                "Viral surge", 0.95, "2024-01-01T00:00:00Z", null);

        productService.applyPriceAdjustment(event);

        // Delta cap: 1.90 + 0.25 = 2.15, then bounds cap → 2.00
        assertThat(product.getPriceMultiplier()).isEqualByComparingTo("2.00");
        assertThat(product.getCurrentPrice()).isEqualByComparingTo("200.00");
    }

    @Test
    void applyPriceAdjustment_skipsOnDuplicateEventId() {
        when(auditLogRepository.existsByAdjustmentEventId("evt-dup")).thenReturn(true);

        var event = new PriceAdjustmentEvent(
                "evt-dup", "src-1", "p1",
                new BigDecimal("1.10"), new BigDecimal("0.10"),
                "Duplicate", 0.80, "2024-01-01T00:00:00Z", null);

        productService.applyPriceAdjustment(event);

        verify(productRepository, never()).findByProductId(any());
        verify(productRepository, never()).save(any());
    }

    @Test
    void applyPriceAdjustment_updateProductName() {
        Product product = buildProduct("100.00", "1.0");
        when(productRepository.findByProductId("p1")).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new UpdateProductRequest("New Name", null, null, null, null, null);
        productService.updateProduct("p1", req);

        assertThat(product.getName()).isEqualTo("New Name");
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Product buildProduct(String basePrice, String multiplier) {
        BigDecimal base = new BigDecimal(basePrice);
        BigDecimal mult = new BigDecimal(multiplier);
        return Product.builder()
                .productId("p1")
                .name("Test Product")
                .category("Electronics")
                .basePrice(base)
                .currentPrice(base.multiply(mult))
                .priceMultiplier(mult)
                .sentimentScore(BigDecimal.ZERO)
                .inventory(100)
                .status(ProductStatus.ACTIVE)
                .build();
    }
}
