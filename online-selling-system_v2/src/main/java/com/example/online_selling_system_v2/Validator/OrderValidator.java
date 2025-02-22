package com.example.online_selling_system_v2.Validator;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Objects;
import com.example.online_selling_system_v2.Service.CustomerService;
import com.example.online_selling_system_v2.Service.ProductService;
import com.example.online_selling_system_v2.DTO.OrderDTO;
import com.example.online_selling_system_v2.DTO.OrderItemDTO;
import com.example.online_selling_system_v2.config.OrderConstants;

@Component
public class OrderValidator {
    private final CustomerService customerService;
    private final ProductService productService;

    public OrderValidator(CustomerService customerService, ProductService productService) {
        this.customerService = customerService;
        this.productService = productService;
    }

    public ValidationResult validate(OrderDTO orderDTO) {
        ValidationResult result = new ValidationResult();
        
        if (orderDTO == null) {
            result.addError("Order cannot be null");
            return result;
        }
        
        // Add status validation
        if (orderDTO.getStatus() != null && !isValidOrderStatus(orderDTO.getStatus().name())) {
            result.addError("Invalid order status");
        }
        
        // Validate customer exists
        if (orderDTO.getCustomerId() == null) {
            result.addError("Customer ID is required");
        } else {
            try {
                if (!customerService.existsById(orderDTO.getCustomerId())) {
                    result.addError("Customer not found");
                }
            } catch (Exception e) {
                result.addError("Error validating customer: " + e.getMessage());
            }
        }
        
        // Modify date validation to allow same-day events
        if (orderDTO.getDateOfEvent() == null) {
            result.addError("Event date is required");
        } else if (orderDTO.getDateOfEvent().isBefore(LocalDate.now())) {
            result.addError("Event date cannot be in the past");
        }
        
        // Validate order items
        if (orderDTO.getOrderItems() == null || orderDTO.getOrderItems().isEmpty()) {
            result.addError("Order must contain at least one item");
        } else {
            orderDTO.getOrderItems().stream()
                .filter(Objects::nonNull)
                .forEach(item -> validateOrderItem(item, result));
        }
        
        return result;
    }

    private void validateOrderItem(OrderItemDTO item, ValidationResult result) {
        try {
            if (item.getProductId() == null) {
                result.addError("Product ID is required");
                return;
            }

            try {
                if (!productService.existsById(item.getProductId())) {
                    result.addError("Product not found: " + item.getProductId());
                    return;
                }
            } catch (Exception e) {
                result.addError("Error validating product: " + e.getMessage());
                return;
            }

            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                result.addError("Quantity must be greater than 0");
                return;
            }

            if (item.getQuantity() > OrderConstants.MAX_QUANTITY) {
                result.addError("Quantity exceeds maximum limit of " + OrderConstants.MAX_QUANTITY);
            }

            BigDecimal subtotal = item.getSubtotal();
            if (subtotal == null) {
                result.addError("Unable to calculate item total");
            } else if (subtotal.compareTo(OrderConstants.MAX_ITEM_TOTAL) > 0) {
                result.addError("Item total exceeds maximum limit");
            }
            
            // Add price validation
            if (item.getItemPrice() == null) {
                result.addError("Item price is required");
                return;
            }
            
            if (item.getItemPrice().compareTo(BigDecimal.ZERO) < 0) {
                result.addError("Item price cannot be negative");
                return;
            }
        } catch (Exception e) {
            result.addError("Error validating order item: " + e.getMessage());
        }
    }
    
    public boolean isValidOrderStatus(String status) {
        if (status == null) {
            return false;
        }
        try {
            return Arrays.asList(OrderConstants.VALID_STATUSES)
                .contains(status.trim().toUpperCase());
        } catch (Exception e) {
            return false;
        }
    }
}
