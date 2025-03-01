package com.example.online_selling_system_v2.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.online_selling_system_v2.Model.Order.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<List<Order>> findByCustomer_Name(String customerName);
    Optional<List<Order>> findByDate(LocalDate date);
    Optional<Order> findById(Long id);
    
}
