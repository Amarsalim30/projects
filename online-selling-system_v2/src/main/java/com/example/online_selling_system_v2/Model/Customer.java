package com.example.online_selling_system_v2.Model;

import java.util.ArrayList;
import java.util.List;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "customers") // Matches the table name in your MySQL database
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "name")
    @NotBlank(message = "name must not be blank")
    private String name;

    @Column(name="number", unique = true)
    @Pattern(regexp = "^\\+254[17][0-9]{8}$", message = "Phone number must be in format: +254XXXXXXXXX")
    private String number;

    @OneToMany(mappedBy = "customer")
    private List<Order> orders = new ArrayList<>();

    public int getOrderCount() {
        return orders == null ? 0 : orders.size();
    }

    @PrePersist
    @PreUpdate
    private void cleanPhoneNumber() {
        if (number != null) {
            // Remove any spaces and ensure single country code
            number = number.replaceAll("\\s+", "")
                         .replaceAll("^\\+?254254", "+254")
                         .replaceAll("^254", "+254")
                         .replaceAll("^0", "+254");
        }
    }

}
