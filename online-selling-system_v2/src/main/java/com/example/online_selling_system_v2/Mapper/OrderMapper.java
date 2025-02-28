package com.example.online_selling_system_v2.Mapper;

import com.example.online_selling_system_v2.Model.Customer;
import com.example.online_selling_system_v2.Model.Order.Order;
import com.example.online_selling_system_v2.Model.Order.OrderItem;
import com.example.online_selling_system_v2.Model.Order.OrderStatus;
import com.example.online_selling_system_v2.Model.Order.PaymentStatus;
import com.example.online_selling_system_v2.Service.CustomerService;
import com.example.online_selling_system_v2.DTO.OrderDTO;
import com.example.online_selling_system_v2.DTO.OrderItemDTO;
import com.example.online_selling_system_v2.Exception.OrderValidationException;
import com.example.online_selling_system_v2.Exception.ResourceNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections;
import java.util.Objects;
import java.util.Optional;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {
    private final CustomerService customerService;
    private static final Logger logger = LoggerFactory.getLogger(OrderMapper.class);

    public OrderMapper(CustomerService customerService) {
        this.customerService = customerService;
    }

    public Order toOrder(OrderDTO dto) {
        if (dto == null) {
            logger.warn("Received null OrderDTO");
            return null;
        }
        
        try {
            Order order = new Order();
            
            // Validate and set customer
            if (dto.getCustomerId() != null) {
                Optional<Customer> customerOpt = customerService.getCustomerById(dto.getCustomerId());
                if (!customerOpt.isPresent()) {
                    throw new ResourceNotFoundException("Customer not found with ID: " + dto.getCustomerId());
                }
                order.setCustomer(customerOpt.get());
            } else {
                throw new IllegalArgumentException("Customer ID is required");
            }
            
            // Validate and set date
            order.setDate(dto.getDateOfEvent() != null ? dto.getDateOfEvent() : LocalDate.now());
            
            // Validate and set status
            order.setStatus(dto.getStatus() != null ? dto.getStatus() : OrderStatus.PENDING);
            
            // Validate and set order items
            List<OrderItem> orderItems = OrderItemMapper.toOrderItemList(dto.getOrderItems());
            if (orderItems == null || orderItems.isEmpty()) {
                throw new IllegalArgumentException("Order must contain at least one item");
            }

            for(OrderItem item : orderItems){
            order.addOrderItem(item);
            }
            
            // Validate and set monetary amounts
            if (dto.getTotalAmount() == null || dto.getTotalAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Total amount must be non-negative");
            }
            order.setTotalAmount(dto.getTotalAmount().setScale(2, RoundingMode.HALF_UP));
            
            if (dto.getPaidAmount() == null || dto.getPaidAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Paid amount must be non-negative");
            }
            order.setPaidAmount(dto.getPaidAmount().setScale(2, RoundingMode.HALF_UP));
            
            if (dto.getRemainingAmount() == null || dto.getRemainingAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Remaining amount must be non-negative");
            }
            order.setRemainingAmount(dto.getRemainingAmount().setScale(2, RoundingMode.HALF_UP));
            
            // Set statuses with defaults if null
            order.setProductionStatus(dto.getProductionStatus() != null ? dto.getProductionStatus() : OrderStatus.PENDING);
            order.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : PaymentStatus.UNPAID);
            
            return order;
        } catch (Exception e) {
            logger.error("Error mapping OrderDTO to Order: {}", e.getMessage());
            throw new OrderValidationException("Error creating order: " + e.getMessage());
        }
    }

    public OrderDTO toOrderDTO(Order order) {
        if (order == null) return null;
        
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        
        List<OrderItemDTO> orderItemDTOs = OrderItemMapper.toOrderItemDTOList(order.getOrderItems());
        dto.setOrderItems(orderItemDTOs);
        
        dto.setDateOfEvent(order.getDate());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaidAmount(order.getPaidAmount());
        dto.setRemainingAmount(order.getRemainingAmount());
        dto.setProductionStatus(order.getProductionStatus());
        dto.setPaymentStatus(order.getPaymentStatus());
        
        if (order.getCustomer() != null) {
            dto.setCustomerId(order.getCustomer().getId());
            dto.setCustomerName(order.getCustomer().getName());
            dto.setCustomerNumber(order.getCustomer().getNumber());
        }
        
        return dto;
    }

    public List<OrderDTO> toOrderDTOList(List<Order> orders) {
        if (orders == null) return Collections.emptyList();
        return orders.stream()
            .filter(Objects::nonNull)
            .map(this::toOrderDTO)
            .collect(Collectors.toList());
    }

    public List<Order> toOrderList(List<OrderDTO> orderDTOs) {
        return orderDTOs.stream().map(this::toOrder).collect(Collectors.toList());
    }
}
