package com.example.online_selling_system_v2.Model;

import java.util.ArrayList;
import java.util.List;

import com.example.online_selling_system_v2.Model.Order.Order;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;

    private double price;

    private int stock;
    
    @Enumerated(EnumType.STRING)
    private Type type;

    public enum Type {
        ELECTRONICS,
        FURNITURE,
        CLOTHING,
        FOOD,
    }

    @ManyToMany
    @JoinTable(
        name = "order_products",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "order_id")
    )
    private List<Order> orders = new ArrayList<>();
}
