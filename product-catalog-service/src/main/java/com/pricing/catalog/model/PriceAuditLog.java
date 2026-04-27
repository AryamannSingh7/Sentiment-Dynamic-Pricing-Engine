package com.pricing.catalog.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/** Immutable audit record. Only inserted, never updated or deleted. */
@Document(collection = "price_audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceAuditLog {

    @Id
    private String id;

    @Indexed(unique = true)
    private String auditId;

    @Indexed
    private String productId;

    private BigDecimal previousPrice;
    private BigDecimal newPrice;
    private BigDecimal previousMultiplier;
    private BigDecimal newMultiplier;
    private BigDecimal sentimentScore;
    private String adjustmentReason;
    private Double confidence;

    /** Traces back to the raw-sentiment-events eventId. */
    private String sourceEventId;

    /** Traces back to the price-adjustment-events eventId. Used for idempotency. */
    @Indexed(unique = true)
    private String adjustmentEventId;

    private Instant appliedAt;
}
