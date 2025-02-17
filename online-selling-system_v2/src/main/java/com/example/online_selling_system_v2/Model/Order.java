package com.example.online_selling_system_v2.Model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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

    @ManyToMany
    @JoinTable(
        name = "order_products",
        joinColumns = @JoinColumn(name = "order_id"),
        inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    private String status;

    @Column(name = "order_date", nullable = false)
    private LocalDate date;

    @PositiveOrZero(message = "Total amount cannot be negative")
    private double totalAmount = 0;

    @PositiveOrZero(message = "Paid amount cannot be negative")
    private double paidAmount = 0;

    @PositiveOrZero(message = "Remaining amount cannot be negative")
    private double remainingAmount = 0;

    public void addProduct(Product addProduct,int quantity) {
        if (addProduct != null) {
            this.products.add(addProduct);
            this.totalAmount += addProduct.getPrice();
            this.remainingAmount = this.totalAmount - this.paidAmount;
        }
    }
}
