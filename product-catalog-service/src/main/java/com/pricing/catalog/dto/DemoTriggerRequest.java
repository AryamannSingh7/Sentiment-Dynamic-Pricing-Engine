package com.pricing.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record DemoTriggerRequest(
    @NotBlank(message = "eventType is required") String eventType
) {}
