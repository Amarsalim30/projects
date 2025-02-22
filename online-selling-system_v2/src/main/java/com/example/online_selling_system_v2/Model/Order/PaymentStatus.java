package com.example.online_selling_system_v2.Model.Order;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

public enum PaymentStatus {
    UNPAID("No payment received"),
    PARTIAL("Partial payment received"),
    PAID("Fully paid");

    private final String description;

    PaymentStatus(String description) {
        this.description = description;
    }

    @JsonValue
    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static PaymentStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment status cannot be null or empty");
        }

        try {
            return PaymentStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            String validValues = Arrays.toString(PaymentStatus.values());
            throw new IllegalArgumentException(
                "Invalid payment status: " + value + ". Valid values are: " + validValues);
        }
    }

    public static boolean isValidTransition(PaymentStatus currentStatus, PaymentStatus newStatus) {
        if (currentStatus == null || newStatus == null) {
            return false;
        }

        switch (currentStatus) {
            case UNPAID:
                return newStatus == PARTIAL || newStatus == PAID;
            case PARTIAL:
                return newStatus == PAID;
            case PAID:
                return false;
            default:
                return false;
        }
    }

    @Override
    public String toString() {
        return this.name() + " (" + description + ")";
    }
}
