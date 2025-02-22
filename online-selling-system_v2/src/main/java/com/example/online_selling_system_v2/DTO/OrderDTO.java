package com.example.online_selling_system_v2.DTO;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import com.example.online_selling_system_v2.Model.Order.OrderStatus;
import com.example.online_selling_system_v2.Model.Order.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import java.util.ArrayList;

public class OrderDTO {
    private Long id;
    
    @NotNull(message = "Customer ID is required")
    private Long customerId;
    
    private String customerName;
    private String customerNumber;
    
    @NotNull(message = "Event date is required")
    private LocalDate dateOfEvent;
    
    @NotNull(message = "Order status is required")
    private OrderStatus status = OrderStatus.PENDING;
    
    @NotNull(message = "Order items cannot be null")
    @Size(min = 1, message = "Order must contain at least one item")
    @Valid
    private List<OrderItemDTO> orderItems = new ArrayList<>();
    
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Total amount must be zero or positive")
    private BigDecimal totalAmount = BigDecimal.ZERO;
    
    @NotNull(message = "Paid amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Paid amount must be zero or positive")
    private BigDecimal paidAmount = BigDecimal.ZERO;
    
    @NotNull(message = "Remaining amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Remaining amount must be zero or positive")
    private BigDecimal remainingAmount = BigDecimal.ZERO;
    
    @NotNull(message = "Production status is required")
    private OrderStatus productionStatus = OrderStatus.PENDING;
    
    @NotNull(message = "Payment status is required")
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }
    
    public LocalDate getDateOfEvent() { return dateOfEvent; }
    public void setDateOfEvent(LocalDate dateOfEvent) { this.dateOfEvent = dateOfEvent; }
    
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    
    public List<OrderItemDTO> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItemDTO> orderItems) { this.orderItems = orderItems; }
    
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    
    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }
    
    public OrderStatus getProductionStatus() { return productionStatus; }
    public void setProductionStatus(OrderStatus productionStatus) { this.productionStatus = productionStatus; }
    
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    // Add validation method
    public List<String> validate() {
        List<String> errors = new ArrayList<>();
        
        if (dateOfEvent != null && dateOfEvent.isBefore(LocalDate.now())) {
            errors.add("Event date cannot be in the past");
        }
        
        if (totalAmount != null && totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            errors.add("Total amount cannot be negative");
        }
        
        if (paidAmount != null && paidAmount.compareTo(BigDecimal.ZERO) < 0) {
            errors.add("Paid amount cannot be negative");
        }
        
        if (paidAmount != null && totalAmount != null && paidAmount.compareTo(totalAmount) > 0) {
            errors.add("Paid amount cannot exceed total amount");
        }
        
        if (orderItems == null || orderItems.isEmpty()) {
            errors.add("Order must contain at least one item");
        }
        
        if (remainingAmount != null && totalAmount != null && paidAmount != null) {
            BigDecimal calculatedRemaining = totalAmount.subtract(paidAmount);
            if (remainingAmount.compareTo(calculatedRemaining) != 0) {
                errors.add("Remaining amount does not match total minus paid amount");
            }
        }
        
        return errors;
    }
}
