package com.example.online_selling_system_v2.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.online_selling_system_v2.Model.Customer;
import java.util.Optional;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByName(String name);
    Optional<Customer> findByNumber(String number);
    List<Customer> findByNameContainingIgnoreCase(String name);
    List<Customer> findByNumberContaining(String number);
    boolean existsByNumber(String number);
}
