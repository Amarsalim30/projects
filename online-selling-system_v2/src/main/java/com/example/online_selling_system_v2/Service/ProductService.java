package com.example.online_selling_system_v2.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.online_selling_system_v2.Model.Product;
import com.example.online_selling_system_v2.Repository.ProductRepository;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository){
        this.productRepository=productRepository;
    }
    
    public List<Product> getAllProducts(){
        return productRepository.findAll();
    }

    public Optional<List<Product>> getProductByName(String name){
        return productRepository.findByName(name);
    }

    public Product save(Product newProduct){
        return productRepository.save(newProduct);
    }

    public void deleteProductById(Long id) {
        productRepository.deleteById(id);
    }

    public List<Product> searchProducts(String searchTerm) {
        return productRepository.findByNameContainingIgnoreCase(searchTerm);
    }
}
