package com.example.online_selling_system_v2.Listener;

import com.example.online_selling_system_v2.Event.OrderEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {
    private static final Logger logger = LoggerFactory.getLogger(OrderEventListener.class);

    @EventListener
    public void handleOrderEvent(OrderEvent event) {
        if (event == null || event.getOrder() == null) {
            logger.warn("Received invalid order event");
            return;
        }
        
        logger.info("Processing {} event for order ID: {}", 
            event.getEventType(), 
            event.getOrder().getId());
            
        switch (event.getEventType()) {
            case CREATED:
                // Handle order creation
                break;
            case STATUS_CHANGED:
                // Handle status change
                break;
            case PAYMENT_UPDATED:
                // Handle payment update
                break;
            case CANCELLED:
                // Handle cancellation
                break;
            default:
                logger.warn("Unhandled event type: {}", event.getEventType());
        }
    }
}
