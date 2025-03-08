package com.example.online_selling_system_v2.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.online_selling_system_v2.Model.Order.Order;

@Entity
@Table(name = "sms_transactions")
@Data
public class SmsTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String transactionId; // e.g., ABCDE12345

    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_number", nullable = false)
    private String customerNumber;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(name = "mpesa_balance")
    private BigDecimal mpesaBalance;

    @Column(name = "raw_message")
    private String rawMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.PENDING;

    public enum TransactionStatus {
        PENDING,
        MATCHED,
        UNMATCHED
    }
}