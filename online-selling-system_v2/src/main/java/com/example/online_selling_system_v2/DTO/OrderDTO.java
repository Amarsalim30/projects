package com.example.online_selling_system_v2.DTO;

import java.time.LocalDate;
import java.util.List;

import com.example.online_selling_system_v2.Model.Order.OrderItem;
import com.example.online_selling_system_v2.Model.Order.OrderStatus;
import com.example.online_selling_system_v2.Model.Order.PaymentStatus;

import lombok.Data;

@Data
public class OrderDTO {
    private Long id;
    private Long customer_id;
    private LocalDate date;
    private OrderStatus status;
    private List<OrderItem> orderItems;
    private double totalAmount;
    private double paidAmount;
    private double remainingAmount;
    private OrderStatus productionStatus;
    private PaymentStatus paymentStatus;
}
