package com.example.online_selling_system_v2.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.online_selling_system_v2.Model.Product;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<List<Product>> findByName(String name);

    List<Product> findByNameContainingIgnoreCase(String searchTerm);
}
