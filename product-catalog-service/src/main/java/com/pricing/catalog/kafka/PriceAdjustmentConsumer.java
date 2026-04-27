package com.pricing.catalog.kafka;

import com.pricing.catalog.dto.PriceAdjustmentEvent;
import com.pricing.catalog.exception.ProductNotFoundException;
import com.pricing.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "pricing.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class PriceAdjustmentConsumer {

    private final ProductService productService;

    /**
     * Consumes price-adjustment-events and applies them to MongoDB.
     *
     * AckMode.MANUAL: the offset is committed only AFTER a successful DB write,
     * guaranteeing at-least-once delivery with idempotency protection in ProductService.
     */
    @KafkaListener(
            topics      = "${pricing.kafka.topics.price-adjustment-events}",
            groupId     = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onPriceAdjustmentEvent(
            @Payload PriceAdjustmentEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {

        log.info("Received price adjustment event [partition={}, offset={}]: eventId={}, productId={}, multiplier={}",
                partition, offset, event.adjustmentEventId(), event.productId(), event.priceMultiplier());

        try {
            productService.applyPriceAdjustment(event);
            acknowledgment.acknowledge();
        } catch (ProductNotFoundException ex) {
            // Unknown product — log and commit offset to avoid infinite retry on bad data
            log.error("Product not found for event {}: {}", event.adjustmentEventId(), ex.getMessage());
            acknowledgment.acknowledge();
        } catch (OptimisticLockingFailureException ex) {
            // Exhausted retries — do NOT acknowledge; Kafka will redeliver the message
            log.error("Optimistic lock exhausted for event {}, will redeliver", event.adjustmentEventId());
        } catch (Exception ex) {
            log.error("Unexpected error processing event {}: {}", event.adjustmentEventId(), ex.getMessage(), ex);
            acknowledgment.acknowledge();
        }
    }
}
