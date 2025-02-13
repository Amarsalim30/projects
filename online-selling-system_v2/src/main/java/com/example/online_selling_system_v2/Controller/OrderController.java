package com.example.online_selling_system_v2.Controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.online_selling_system_v2.DTO.OrderDTO;
import com.example.online_selling_system_v2.Mapper.OrderMapper;
import com.example.online_selling_system_v2.Service.OrderService;

import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    public OrderController(OrderService orderService){
        this.orderService=orderService;
    }

    //search Order by name
    @GetMapping("/name/{name}")
    public Optional<List<OrderDTO>> getOrderByCustomerName(@PathVariable("name") String customer_Name) {
        return orderService.getOrderByCustomerName(customer_Name).map(OrderMapper::toOrderDTOList);
    }
    //search Order by date
    @GetMapping("/date/{date}")
    public Optional<List<OrderDTO>> getOrderByDate(@PathVariable LocalDate date) {
        logger.info("Searching order(s) by date: {}", date);
        Optional<List<OrderDTO>> orders = orderService.getOrderByDate(date).map(OrderMapper::toOrderDTOList);
        logger.info("Searched orders: {}", orders);
        return orders;
    }

    @PostMapping("/new")
    public ResponseEntity<OrderDTO> addOrder(@Valid @RequestBody OrderDTO orderDTO) {
        logger.info("Creating new order: {}", orderDTO);
        OrderDTO savedOrderDTO = orderService.addOrder(orderDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedOrderDTO);
    }
    
    @GetMapping("")
    public List<OrderDTO> getAllOrders() {
        logger.info("Fetching all orders");
        return OrderMapper.toOrderDTOList(orderService.getAllOrders());
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(@PathVariable Long orderId, @RequestBody String newStatus) {
        logger.info("Updating status of order with ID {}: {}", orderId, newStatus);
        if (newStatus == null || newStatus.trim().isEmpty()) {
            logger.error("Invalid status update request: status is null or empty");
            return ResponseEntity.badRequest().build();
        }
        try {
            OrderDTO updatedOrderDTO = orderService.updateOrderStatus(orderId, newStatus);
            return ResponseEntity.ok(updatedOrderDTO);
        } catch (Exception e) {
            logger.error("Error updating order status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
