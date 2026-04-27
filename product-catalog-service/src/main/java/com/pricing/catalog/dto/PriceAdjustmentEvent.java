package com.pricing.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/** Deserialized from the price-adjustment-events Kafka topic. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PriceAdjustmentEvent(
        String adjustmentEventId,
        String sourceEventId,
        String productId,
        /** Absolute target multiplier (e.g. 1.15 = 15% above basePrice). */
        BigDecimal priceMultiplier,
        /** Delta to apply to the rolling sentimentScore. */
        BigDecimal sentimentScore,
        String adjustmentReason,
        Double confidence,
        String timestamp,
        String expiresAt
) {}
