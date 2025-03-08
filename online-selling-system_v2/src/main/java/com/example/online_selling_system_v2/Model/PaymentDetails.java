package com.example.online_selling_system_v2.Model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "payment_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_number", nullable = false)
    private String paymentNumber;

    @Column(name = "mpesa_name")
    private String mpesaName;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // Constructor for initial creation with just phone number
    public PaymentDetails(String paymentNumber, Customer customer) {
        this.paymentNumber = paymentNumber;
        this.customer = customer;
    }

    // Method to update mpesaName from SMS transaction
    public void updateMpesaName(String mpesaName) {
        this.mpesaName = mpesaName;
    }
}
