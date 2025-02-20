package com.example.online_selling_system_v2.Model.Order;

public enum PaymentStatus {
    UNPAID("No payment received"),
    PARTIAL("Partial payment received"),
    PAID("Fully paid");

    private final String description;

    PaymentStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
