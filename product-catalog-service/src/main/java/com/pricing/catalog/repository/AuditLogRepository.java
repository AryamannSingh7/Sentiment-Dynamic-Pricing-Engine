package com.pricing.catalog.repository;

import com.pricing.catalog.model.PriceAuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<PriceAuditLog, String> {
    List<PriceAuditLog> findByProductIdOrderByAppliedAtDesc(String productId);
    boolean existsByAdjustmentEventId(String adjustmentEventId);
}
