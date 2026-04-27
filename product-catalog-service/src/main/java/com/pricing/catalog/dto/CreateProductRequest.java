package com.pricing.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record CreateProductRequest(
        @NotBlank(message = "name is required") String name,
        String description,
        @NotBlank(message = "category is required") String category,
        @NotNull @Positive(message = "basePrice must be positive") BigDecimal basePrice,
        @NotNull @Positive(message = "inventory must be positive") Integer inventory,
        List<String> tags
) {}
