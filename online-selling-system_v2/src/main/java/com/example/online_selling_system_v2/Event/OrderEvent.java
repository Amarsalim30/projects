package com.example.online_selling_system_v2.Event;

import com.example.online_selling_system_v2.Model.Order;
import org.springframework.context.ApplicationEvent;

public class OrderEvent extends ApplicationEvent {
    private final Order order;
    private final String eventType;

    public OrderEvent(Object source, Order order, String eventType) {
        super(source);
        this.order = order;
        this.eventType = eventType;
    }

    public Order getOrder() {
        return order;
    }

    public String getEventType() {
        return eventType;
    }
}
