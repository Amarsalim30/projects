package com.example.online_selling_system_v2.Model.Order;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

public enum OrderStatus {
    PENDING("Waiting to start"),
    IN_PROGRESS("Production started"),
    COMPLETED("Production complete"), 
    DELIVERED("Delivered to client"),
    CANCELLED("Order cancelled");

    private final String description;

    OrderStatus(String description) {
        this.description = description;
    }

    @JsonValue
    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static OrderStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Status value cannot be null or empty");
        }

        try {
            return OrderStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            String validValues = Arrays.toString(OrderStatus.values());
            throw new IllegalArgumentException(
                "Invalid status: " + value + ". Valid values are: " + validValues);
        }
    }

    public boolean canTransitionTo(OrderStatus nextStatus) {
        switch (this) {
            case PENDING:
                return nextStatus == IN_PROGRESS || nextStatus == CANCELLED;
            case IN_PROGRESS:
                return nextStatus == COMPLETED || nextStatus == CANCELLED;
            case COMPLETED:
                return nextStatus == DELIVERED;
            case DELIVERED:
                return false;
            case CANCELLED:
                return false;
            default:
                return false;
        }
    }

    public static boolean isValidTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        return currentStatus != null && newStatus != null && currentStatus.canTransitionTo(newStatus);
    }

    @Override
    public String toString() {
        return this.name() + " (" + description + ")";
    }
}
