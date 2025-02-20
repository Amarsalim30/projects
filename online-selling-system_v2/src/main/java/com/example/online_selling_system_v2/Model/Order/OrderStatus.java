package com.example.online_selling_system_v2.Model.Order;

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

    public String getDescription() {
        return description;
    }
}
