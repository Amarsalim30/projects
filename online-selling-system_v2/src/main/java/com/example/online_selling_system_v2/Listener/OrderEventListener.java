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
        if (event == null) {
            logger.warn("Received null order event");
            return;
        }
        logger.info("Received order event: {} for order: {}", event.getEventType(), event.getOrder());
        // Handle the event (e.g., send notifications, update status, etc.)
    }
}
