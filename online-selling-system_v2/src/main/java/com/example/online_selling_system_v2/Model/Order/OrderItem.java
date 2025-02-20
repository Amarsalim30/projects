package com.example.online_selling_system_v2.Model.Order;

import com.example.online_selling_system_v2.Model.Product;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Positive(message = "Quantity must be positive")
    private int quantity;

    private double itemPrice;
    
    public double getSubtotal() {
        return itemPrice * quantity;
    }
}
