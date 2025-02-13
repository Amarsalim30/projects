package com.example.online_selling_system_v2.DTO;

import java.time.LocalDate;
import com.example.online_selling_system_v2.Model.Customer;
import lombok.Data;

@Data
public class OrderDTO {
    private Customer customer;
    private LocalDate date;
    private String status;
    private double totalAmount;
    private double paidAmount;
    private double remainingAmount;
    // Add products field if needed
}
