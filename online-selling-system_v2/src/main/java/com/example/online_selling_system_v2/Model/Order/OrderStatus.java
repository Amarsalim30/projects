package com.example.online_selling_system_v2.Model.Order;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

public enum OrderStatus {
    PENDING("Waiting to start"),
    IN_PROGRESS("Production started"),
    COMPLETED("Production complete"), 
    DELIVERED("Delivered to client"),
    CANCELLED("Order cancelled"),
    PRODUCTION_STARTED("Production started"),
    PRODUCTION_COMPLETE("Production complete");

    private final String description;

    OrderStatus(String description) {
        this.description = description;
    }

    @JsonValue
    public String getDescription() {
        // Return the enum name instead of description for consistent status handling
        return this.name();
    }

    @JsonCreator
    public static OrderStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Status value cannot be null or empty");
        }

        // Normalize the input string
        String normalized = value.trim()
                               .toUpperCase()
                               .replace(" ", "_");

        try {
            return OrderStatus.valueOf(normalized);
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
            case PRODUCTION_STARTED:
                return nextStatus == PRODUCTION_COMPLETE;
            case PRODUCTION_COMPLETE:
                return nextStatus == DELIVERED;
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
