package com.pricing.catalog.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private String id;

    @Indexed(unique = true)
    private String productId;

    private String name;
    private String description;

    @Indexed
    private String category;

    /** Immutable anchor price set at creation. Never modified after creation. */
    private BigDecimal basePrice;

    /** Derived: basePrice * priceMultiplier. Updated by the pricing pipeline. */
    private BigDecimal currentPrice;

    /** Absolute multiplier applied to basePrice. Bounds: [0.50, 2.00]. Default: 1.0 */
    @Builder.Default
    private BigDecimal priceMultiplier = BigDecimal.ONE;

    /** Rolling sentiment score, updated with each pricing event. Range: [-1.0, 1.0]. */
    @Builder.Default
    private BigDecimal sentimentScore = BigDecimal.ZERO;

    private Integer inventory;

    @Indexed
    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    private Instant lastPriceUpdate;

    /** Incremented on every price update. Used for optimistic locking in the Kafka consumer. */
    @Version
    private Long version;

    private List<String> tags;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
