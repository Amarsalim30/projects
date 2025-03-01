package com.example.online_selling_system_v2.Model.Order;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;

import com.example.online_selling_system_v2.Model.Customer;
import com.example.online_selling_system_v2.Model.Product;
import com.example.online_selling_system_v2.Config.OrderConstants;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "orders")
@NoArgsConstructor
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @NotNull(message = "Customer is required")
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Order status is required")
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "order_date", nullable = false)
    @NotNull(message = "Order date is required")
    private LocalDate date = LocalDate.now();

    @NotNull(message = "Total amount is required")
    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @NotNull(message = "Paid amount is required")
    @Column(precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @NotNull(message = "Remaining amount is required")
    @Column(precision = 10, scale = 2)
    private BigDecimal remainingAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Production status is required")
    private OrderStatus productionStatus = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Payment status is required")
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Version
    private Long version;

    @PrePersist
    public void prePersist() {
        if (status == null) status = OrderStatus.PENDING;
        if (productionStatus == null) productionStatus = OrderStatus.PENDING;
        if (paymentStatus == null) paymentStatus = PaymentStatus.UNPAID;
        if (date == null) date = LocalDate.now();
        updateTotals();
    }

    public void addProduct(Product product, int quantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        if (quantity > OrderConstants.MAX_QUANTITY) {
            throw new IllegalArgumentException("Quantity cannot exceed " + OrderConstants.MAX_QUANTITY);
        }

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(this);
        orderItem.setProductId(product.getId());
        orderItem.setQuantity(quantity);
        orderItem.setItemPrice(BigDecimal.valueOf(product.getPrice()).setScale(2, RoundingMode.HALF_UP));
        orderItem.setProductName(product.getName());
        
        orderItems.add(orderItem);
        updateTotals();
    }

    public void addOrderItem(OrderItem item) {
        if (item == null) {
            throw new IllegalArgumentException("Order item cannot be null");
        }
        
        orderItems.add(item);
        item.setOrder(this);
        updateTotals();
    }

    public void removeOrderItem(OrderItem item) {
        if (item == null) {
            throw new IllegalArgumentException("Order item cannot be null");
        }
        
        orderItems.remove(item);
        item.setOrder(null);
        updateTotals();
    }

    public synchronized void updateTotals() {
        this.totalAmount = orderItems.stream()
            .map(OrderItem::getSubtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
            
        if (paidAmount.compareTo(totalAmount) > 0) {
            paidAmount = totalAmount;
        }
        
        this.remainingAmount = this.totalAmount.subtract(this.paidAmount)
            .setScale(2, RoundingMode.HALF_UP);
            
        updatePaymentStatus();
    }

    private void updatePaymentStatus() {
        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            this.paymentStatus = PaymentStatus.UNPAID;
            return;
        }
        
        if (paidAmount.compareTo(totalAmount) >= 0) {
            this.paymentStatus = PaymentStatus.PAID;
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.paymentStatus = PaymentStatus.PARTIAL;
        } else {
            this.paymentStatus = PaymentStatus.UNPAID;
        }
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
