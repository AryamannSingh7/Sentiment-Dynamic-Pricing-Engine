package com.pricing.catalog.dto;

import com.pricing.catalog.model.ProductStatus;
import jakarta.validation.constraints.Positive;

import java.util.List;

/** basePrice is intentionally excluded — it is immutable. Price changes flow through the AI pipeline only. */
public record UpdateProductRequest(
        String name,
        String description,
        String category,
        @Positive(message = "inventory must be positive") Integer inventory,
        ProductStatus status,
        List<String> tags
) {}
