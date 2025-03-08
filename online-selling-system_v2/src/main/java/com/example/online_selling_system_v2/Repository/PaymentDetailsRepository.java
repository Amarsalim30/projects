package com.example.online_selling_system_v2.Repository;

import com.example.online_selling_system_v2.Model.Customer;
import com.example.online_selling_system_v2.Model.PaymentDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentDetailsRepository extends JpaRepository<PaymentDetails, Long> {
    Optional<PaymentDetails> findByPaymentNumber(String paymentNumber);
    List<PaymentDetails> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    boolean existsByPaymentNumber(String paymentNumber);
boolean existsByPaymentNumberAndCustomerNot(String paymentNumber, Customer customer);
}
