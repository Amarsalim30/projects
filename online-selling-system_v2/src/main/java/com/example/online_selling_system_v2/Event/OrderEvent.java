package com.example.online_selling_system_v2.Event;

import com.example.online_selling_system_v2.Model.Order.Order;

import lombok.Getter;

@Getter
public class OrderEvent {
    public enum EventType {
        CREATED,
        UPDATED,
        STATUS_CHANGED,
        PAYMENT_UPDATED,
        CANCELLED
    }

    private final Order order;
    private final EventType eventType;

    public OrderEvent(Order order, EventType eventType) {
        this.order = order;
        this.eventType = eventType;
    }
}
