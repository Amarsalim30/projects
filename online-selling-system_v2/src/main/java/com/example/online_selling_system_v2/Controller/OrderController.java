package com.example.online_selling_system_v2.Controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.online_selling_system_v2.DTO.OrderDTO;
import com.example.online_selling_system_v2.DTO.OrderItemDTO;
import com.example.online_selling_system_v2.Exception.ResourceNotFoundException;
import com.example.online_selling_system_v2.Mapper.OrderMapper;
import com.example.online_selling_system_v2.Model.Order.OrderStatus;
import com.example.online_selling_system_v2.Model.Order.PaymentStatus;
import com.example.online_selling_system_v2.Service.OrderService;
import com.example.online_selling_system_v2.Validator.OrderValidator;
import com.example.online_selling_system_v2.Validator.ValidationResult;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Collections;
import com.example.online_selling_system_v2.Config.OrderConstants;

@RestController
@RequestMapping(value = "/api/orders", produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class OrderController {
    private final OrderService orderService;
    private final OrderValidator orderValidator;
    private final OrderMapper orderMapper;

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    public OrderController(OrderService orderService, OrderValidator orderValidator, OrderMapper orderMapper) {
        this.orderService = orderService;
        this.orderValidator = orderValidator;
        this.orderMapper = orderMapper;
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<List<OrderDTO>> getOrderByCustomerName(@PathVariable("name") String customerName) {
        try {
            return ResponseEntity.ok(orderService.getOrderByCustomerName(customerName)
                .map(orderMapper::toOrderDTOList)
                .orElse(Collections.emptyList()));
        } catch (Exception e) {
            logger.error("Error fetching orders by customer name: {}", customerName, e);
            throw new RuntimeException("Failed to fetch orders");
        }
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<OrderDTO>> getOrderByDate(@PathVariable LocalDate date) {
        try {
            return ResponseEntity.ok(orderService.getOrderByDate(date)
                .map(orderMapper::toOrderDTOList)
                .orElse(Collections.emptyList()));
        } catch (Exception e) {
            logger.error("Error fetching orders by date: {}", date, e);
            throw new RuntimeException("Failed to fetch orders");
        }
    }

    @PostMapping("/new")
    public ResponseEntity<?> addOrder(@Valid @RequestBody OrderDTO orderDTO) {
        try {
            // Validate DTO
            List<String> dtoErrors = orderDTO.validate();
            if (!dtoErrors.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("errors", dtoErrors));
            }
            
            // Validate business rules
            ValidationResult validationResult = orderValidator.validate(orderDTO);
            if (!validationResult.isValid()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("errors", validationResult.getErrors()));
            }
            
            // Validate total amount
            BigDecimal calculatedTotal = orderDTO.getOrderItems().stream()
                .map(OrderItemDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
            
            if (calculatedTotal.compareTo(orderDTO.getTotalAmount()) != 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Total amount mismatch"));
            }
            
            // Set initial status
            orderDTO.setStatus(OrderStatus.IN_PROGRESS);
            orderDTO.setProductionStatus(OrderStatus.PENDING);
            orderDTO.setPaymentStatus(PaymentStatus.UNPAID);
            orderDTO.setPaidAmount(BigDecimal.ZERO);
            orderDTO.setRemainingAmount(calculatedTotal);
            
            OrderDTO savedOrderDTO = orderService.addOrder(orderDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedOrderDTO);
        } catch (Exception e) {
            logger.error("Error creating order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create order: " + e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        try {
            logger.info("Fetching all orders");
            return ResponseEntity.ok(orderMapper.toOrderDTOList(orderService.getAllOrders()));
        } catch (Exception e) {
            logger.error("Error fetching all orders", e);
            throw new RuntimeException("Failed to fetch orders");
        }
    }

    @PutMapping(value = {"/{orderId}/status", "/{orderId}/status/{newStatus}"})
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @PathVariable(required = false) String newStatus,
            @RequestParam(value = "newStatus", required = false) String newStatusParam) {
        try {
            // Remove redundant null check since @PathVariable ensures non-null
            String statusToUpdate = newStatus != null ? newStatus : newStatusParam;
            
            // Clean up the status string
            String trimmedStatus = statusToUpdate != null ? 
                statusToUpdate.trim().replace("\"", "") : "";
                
            if (!orderValidator.isValidOrderStatus(trimmedStatus)) {
                String validStatuses = String.join(", ", OrderConstants.VALID_STATUSES);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid status. Must be one of: " + validStatuses));
            }
            
            OrderDTO updatedOrderDTO = orderService.updateOrderStatus(orderId, trimmedStatus);
            return ResponseEntity.ok(updatedOrderDTO);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating order status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update order status: " + e.getMessage()));
        }
    }

    @PutMapping("{orderId}/paid")
    public ResponseEntity<?> updatePaidAmount(
            @PathVariable Long orderId,
            @RequestParam(name = "paidAmount") BigDecimal paidAmount) {
        try {
            // Remove redundant null check since @PathVariable ensures non-null
            if (paidAmount == null || paidAmount.compareTo(BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Paid amount must be a positive number"));
            }
            
            OrderDTO updatedOrderDTO = orderService.updatePaidAmount(orderId, paidAmount);
            return ResponseEntity.ok(updatedOrderDTO);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating paid amount", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update paid amount: " + e.getMessage()));
        }
    }
}
