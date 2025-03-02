package com.example.online_selling_system_v2.Repository;

import com.example.online_selling_system_v2.Model.SmsTransaction;
import com.example.online_selling_system_v2.Model.SmsTransaction.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SmsTransactionRepository extends JpaRepository<SmsTransaction, Long> {
    
    // Check for duplicate transactions
    boolean existsByTransactionId(String transactionId);
    
    // Find transaction by M-PESA transaction ID
    Optional<SmsTransaction> findByTransactionId(String transactionId);
    
    // Find all unmatched transactions
    List<SmsTransaction> findByStatus(TransactionStatus status);
    
    // Find transactions by customer phone number
    List<SmsTransaction> findByCustomerNumberOrderByTransactionDateDesc(String customerNumber);
    
    // Find transactions by customer name (case insensitive)
    @Query("SELECT t FROM SmsTransaction t WHERE LOWER(t.customerName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<SmsTransaction> findByCustomerNameContainingIgnoreCase(@Param("name") String name);
    
    // Find transactions without associated orders
    List<SmsTransaction> findByOrderIsNull();
    
    // Find transactions for a specific order
    List<SmsTransaction> findByOrderId(Long orderId);
    
    // Find transactions within a date range
    @Query("SELECT t FROM SmsTransaction t WHERE DATE(t.transactionDate) BETWEEN :startDate AND :endDate")
    List<SmsTransaction> findTransactionsInDateRange(
        @Param("startDate") java.time.LocalDate startDate, 
        @Param("endDate") java.time.LocalDate endDate
    );
    
    // Find latest transaction for a customer
    Optional<SmsTransaction> findFirstByCustomerNumberOrderByTransactionDateDesc(String customerNumber);
    
    // Count transactions by status
    long countByStatus(TransactionStatus status);
    
    // Delete transactions older than a certain date
    @Query("DELETE FROM SmsTransaction t WHERE t.transactionDate < :date")
    void deleteTransactionsOlderThan(@Param("date") java.time.LocalDateTime date);
    
    // Find duplicate transactions (same amount and customer within 5 minutes)
    @Query("""
        SELECT t FROM SmsTransaction t 
        WHERE t.customerNumber = :customerNumber 
        AND t.amount = :amount 
        AND t.transactionDate BETWEEN :startDate AND :endDate
    """)
    List<SmsTransaction> findPotentialDuplicates(
        @Param("customerNumber") String customerNumber,
        @Param("amount") java.math.BigDecimal amount,
        @Param("startDate") java.time.LocalDateTime startDate,
        @Param("endDate") java.time.LocalDateTime endDate
    );
}
