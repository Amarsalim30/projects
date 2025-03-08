package com.example.online_selling_system_v2.Repository;

import com.example.online_selling_system_v2.Model.PaymentDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentDetailsRepository extends JpaRepository<PaymentDetails, Long> {
    Optional<PaymentDetails> findByReferenceNumber(String referenceNumber);
    List<PaymentDetails> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    boolean existsByReferenceNumber(String referenceNumber);
}
