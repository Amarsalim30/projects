package com.example.online_selling_system_v2.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.online_selling_system_v2.Model.Order.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o WHERE LOWER(o.customer.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Optional<List<Order>> findByCustomerNameContainingIgnoreCase(@Param("name") String name);

    Optional<List<Order>> findByCustomer_Name(String customerName);
    Optional<List<Order>> findByDate(LocalDate date);
    // Optional<Order> findById(Long id);
    
}
