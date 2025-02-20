package com.example.online_selling_system_v2.Model.Order;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.example.online_selling_system_v2.Model.Customer;
import com.example.online_selling_system_v2.Model.Product;

import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
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

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Column(name = "order_date", nullable = false)
    private LocalDate date;

    @PositiveOrZero(message = "Total amount cannot be negative")
    private double totalAmount = 0;

    @PositiveOrZero(message = "Paid amount cannot be negative")
    private double paidAmount = 0;

    @PositiveOrZero(message = "Remaining amount cannot be negative")
    private double remainingAmount = 0;

    @Enumerated(EnumType.STRING)
    private OrderStatus productionStatus = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    public void addProduct(Product product, int quantity) {
        if (product == null || quantity <= 0) {
            throw new IllegalArgumentException("Invalid product or quantity");
        }

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(this);
        orderItem.setProduct(product);
        orderItem.setQuantity(quantity);
        orderItem.setItemPrice(product.getPrice());
        
        orderItems.add(orderItem);
        updateTotals();
    }

    public void addOrderItem(OrderItem item) {
        orderItems.add(item);
        item.setOrder(this);
        updateTotals();
    }

    public void removeOrderItem(OrderItem item) {
        orderItems.remove(item);
        item.setOrder(null);
        updateTotals();
    }

    private void updateTotals() {
        this.totalAmount = orderItems.stream()
            .mapToDouble(OrderItem::getSubtotal)
            .sum();
        this.remainingAmount = this.totalAmount - this.paidAmount;
        updatePaymentStatus();
    }

    private void updatePaymentStatus() {
        if (paidAmount >= totalAmount) {
            this.paymentStatus = PaymentStatus.PAID;
        } else if (paidAmount > 0) {
            this.paymentStatus = PaymentStatus.PARTIAL;
        } else {
            this.paymentStatus = PaymentStatus.UNPAID;
        }
    }
}
