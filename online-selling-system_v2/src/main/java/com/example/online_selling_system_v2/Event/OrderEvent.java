package com.example.online_selling_system_v2.Event;

import com.example.online_selling_system_v2.Model.Order.Order;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.Objects;

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
    private final LocalDateTime timestamp;

    public OrderEvent(Order order, EventType eventType) {
        this.order = Objects.requireNonNull(order, "Order cannot be null");
        this.eventType = Objects.requireNonNull(eventType, "Event type cannot be null");
        this.timestamp = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return String.format("OrderEvent{orderId=%d, type=%s, timestamp=%s}",
            order.getId(), eventType, timestamp);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderEvent that = (OrderEvent) o;
        return Objects.equals(order.getId(), that.order.getId()) &&
               eventType == that.eventType &&
               Objects.equals(timestamp, that.timestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(order.getId(), eventType, timestamp);
    }
}
