package com.example.online_selling_system_v2.DTO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import com.example.online_selling_system_v2.config.OrderConstants;

@Data
public class OrderItemDTO {
    
    @NotNull(message = "Product ID is required")
    private Long productId;

    private Long orderId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = OrderConstants.MAX_QUANTITY, message = "Quantity cannot exceed " + OrderConstants.MAX_QUANTITY)
    private Integer quantity;

    @NotNull(message = "Item price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    private BigDecimal itemPrice;

    @Size(max = 255, message = "Product name cannot exceed 255 characters")
    private String productName;

    public OrderItemDTO() {
        this.quantity = 1;
        this.itemPrice = BigDecimal.ZERO;
    }

    public OrderItemDTO(Long productId, Integer quantity, BigDecimal itemPrice) {
        this.productId = productId;
        this.quantity = quantity != null ? quantity : 1;
        this.itemPrice = itemPrice != null ? itemPrice.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }


    public BigDecimal getSubtotal() {
        if (itemPrice == null || quantity == null || 
            itemPrice.compareTo(BigDecimal.ZERO) < 0 || quantity <= 0) {
            return BigDecimal.ZERO;
        }
        
        try {
            BigDecimal subtotal = itemPrice.multiply(BigDecimal.valueOf(quantity))
                                         .setScale(2, RoundingMode.HALF_UP);
                                         
            if (subtotal.compareTo(OrderConstants.MAX_ITEM_TOTAL) > 0) {
                throw new IllegalStateException("Total amount exceeds maximum allowed value");
            }
            
            return subtotal;
        } catch (ArithmeticException e) {
            throw new IllegalStateException("Error calculating subtotal: possible overflow", e);
        }
    }

    public List<String> validate() {
        List<String> errors = new ArrayList<>();
        
        if (productId == null) {
            errors.add("Product selection is required");
        }
        
        if (quantity == null || quantity < 1) {
            errors.add("Quantity must be at least 1");
        } else if (quantity > OrderConstants.MAX_QUANTITY) {
            errors.add("Quantity cannot exceed " + OrderConstants.MAX_QUANTITY);
        }
        
        if (itemPrice == null) {
            errors.add("Price is required");
        } else if (itemPrice.compareTo(BigDecimal.ZERO) < 0) {
            errors.add("Price cannot be negative");
        }
        
        try {
            BigDecimal subtotal = getSubtotal();
            if (subtotal.compareTo(OrderConstants.MAX_ITEM_TOTAL) > 0) {
                errors.add("Total amount exceeds maximum allowed value");
            }
        } catch (Exception e) {
            errors.add("Error calculating total: " + e.getMessage());
        }
        
        return errors;
    }

    @Override
    public String toString() {
        return String.format("OrderItemDTO{productId=%d, quantity=%d, itemPrice=%s, productName='%s'}",
            productId, quantity, itemPrice, productName);
    }
}
