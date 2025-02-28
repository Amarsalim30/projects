package com.example.online_selling_system_v2.Config;

import java.math.BigDecimal;

public final class OrderConstants {
    private OrderConstants() {} // Prevent instantiation
    
    public static final int MAX_QUANTITY = 1000;
    public static final BigDecimal MAX_ITEM_TOTAL = BigDecimal.valueOf(1000000);
    public static final String[] VALID_STATUSES = {"PENDING", "COMPLETED", "CANCELLED"};
}
