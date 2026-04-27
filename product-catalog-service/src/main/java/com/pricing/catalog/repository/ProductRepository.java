package com.pricing.catalog.repository;

import com.pricing.catalog.model.Product;
import com.pricing.catalog.model.ProductStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findByProductId(String productId);
    List<Product> findByCategory(String category);
    List<Product> findByStatus(ProductStatus status);
    List<Product> findByCategoryAndStatus(String category, ProductStatus status);
    boolean existsByProductId(String productId);
}
