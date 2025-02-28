package com.example.online_selling_system_v2.Model.Order;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import org.hibernate.annotations.Check;

import com.example.online_selling_system_v2.config.OrderConstants;

import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Check(constraints = "item_price >= 0 AND quantity > 0")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_item_order"))
    @NotNull(message = "Order is required")
    private Order order;

    @NotNull(message = "Product ID is required")
    @Column(name = "product_id", nullable = false)
    @JoinColumn(foreignKey = @ForeignKey(name = "fk_order_item_product"))
    private Long productId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = OrderConstants.MAX_QUANTITY, message = "Quantity cannot exceed " + OrderConstants.MAX_QUANTITY)
    @Column(nullable = false)
    private Integer quantity;

    @NotNull(message = "Item price is required")
    @Column(name = "item_price", nullable = false, precision = 10, scale = 2)
    @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    private BigDecimal itemPrice;

    @NotNull(message = "Product name is required")
    @Size(min = 1, max = 255, message = "Product name must be between 1 and 255 characters")
    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    public BigDecimal getSubtotal() {
        if (itemPrice == null || quantity == null) {
            throw new IllegalStateException("Item price and quantity must not be null");
        }
        
        if (itemPrice.compareTo(BigDecimal.ZERO) < 0 || quantity <= 0) {
            throw new IllegalStateException("Item price must be non-negative and quantity must be positive");
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

    @Override
    public String toString() {
        return String.format("OrderItem{id=%d, productId=%d, quantity=%d, itemPrice=%s, productName='%s'}",
            id != null ? id : 0,
            productId != null ? productId : 0,
            quantity != null ? quantity : 0,
            itemPrice != null ? itemPrice.toString() : "0.00",
            productName != null ? productName : "");
    }

    @PrePersist
    @PreUpdate
    protected void validateFields() {
        if (productName == null || productName.trim().isEmpty()) {
            throw new IllegalStateException("Product name is required");
        }
        if (itemPrice == null || itemPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Valid item price is required");
        }
        if (quantity == null || quantity < 1) {
            throw new IllegalStateException("Valid quantity is required");
        }
        
        // Ensure proper decimal scaling
        itemPrice = itemPrice.setScale(2, RoundingMode.HALF_UP);
    }
}
