package com.example.online_selling_system_v2.Listener;

import com.example.online_selling_system_v2.Event.OrderEvent;
import com.example.online_selling_system_v2.Model.Order.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrderEventListener {
    private static final Logger logger = LoggerFactory.getLogger(OrderEventListener.class);

    @EventListener
    @Transactional
    public void handleOrderEvent(OrderEvent event) {
        try {
            if (event == null || event.getOrder() == null) {
                logger.warn("Received invalid order event");
                return;
            }
            
            Order order = event.getOrder();
            logger.info("Processing {} event for order ID: {}", 
                event.getEventType(), 
                order.getId());
                
            switch (event.getEventType()) {
                case CREATED:
                    handleOrderCreation(order);
                    break;
                case STATUS_CHANGED:
                    handleStatusChange(order);
                    break;
                case PAYMENT_UPDATED:
                    handlePaymentUpdate(order);
                    break;
                case CANCELLED:
                    handleOrderCancellation(order);
                    break;
                default:
                    logger.warn("Unhandled event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            logger.error("Error handling order event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process order event", e);
        }
    }

    private void handleOrderCreation(Order order) {
        logger.info("Order created: {}", order.getId());
        // Add creation specific logic here
    }

    private void handleStatusChange(Order order) {
        logger.info("Order status changed to {}: {}", order.getStatus(), order.getId());
        // Add status change specific logic here
    }

    private void handlePaymentUpdate(Order order) {
        logger.info("Payment updated for order {}: {} / {}", 
            order.getId(), 
            order.getPaidAmount(),
            order.getTotalAmount());
        // Add payment update specific logic here
    }

    private void handleOrderCancellation(Order order) {
        logger.info("Order cancelled: {}", order.getId());
        // Add cancellation specific logic here
    }
}
