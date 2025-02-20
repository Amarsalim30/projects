package com.example.online_selling_system_v2.Mapper;

import com.example.online_selling_system_v2.Model.*;
import com.example.online_selling_system_v2.Model.Order.Order;
import com.example.online_selling_system_v2.Model.Order.OrderStatus;
import com.example.online_selling_system_v2.Model.Order.PaymentStatus;
import com.example.online_selling_system_v2.Service.OrderService;
import com.example.online_selling_system_v2.Service.CustomerService;
import com.example.online_selling_system_v2.DTO.OrderDTO;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Objects;
import java.util.Optional;
import java.time.LocalDate;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class OrderMapper {
    private static CustomerService customerService;

    @Autowired
    public OrderMapper(CustomerService customerService) {
        OrderMapper.customerService = customerService;
    }

    public static Order toOrder(OrderDTO dto) {
        if (dto == null) return null;
        
        Order order = new Order();
        order.setId(dto.getId());
        
        // Convert customer_id to Customer object
        if (dto.getCustomer_id() != null) {
            Optional<Customer> customerOpt = customerService.getCustomerById(dto.getCustomer_id());
            customerOpt.ifPresent(order::setCustomer);
        }
        
        order.setDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());
        order.setStatus(dto.getStatus() != null ? dto.getStatus() : OrderStatus.PENDING);
        order.setOrderItems(dto.getOrderItems() != null ? dto.getOrderItems() : new ArrayList<>());
        order.setTotalAmount(dto.getTotalAmount());
        order.setPaidAmount(dto.getPaidAmount());
        order.setRemainingAmount(dto.getRemainingAmount());
        order.setProductionStatus(dto.getProductionStatus() != null ? dto.getProductionStatus() : OrderStatus.PENDING);
        order.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : PaymentStatus.UNPAID);
        
        return order;
    }

    public static OrderDTO toOrderDTO(Order order) {
        if (order == null) return null;
        
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setCustomer_id(order.getCustomer() != null ? order.getCustomer().getId() : null);
        dto.setOrderItems(order.getOrderItems());
        dto.setDate(order.getDate());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaidAmount(order.getPaidAmount());
        dto.setRemainingAmount(order.getRemainingAmount());
        dto.setProductionStatus(order.getProductionStatus());
        dto.setPaymentStatus(order.getPaymentStatus());
        return dto;
    }

    public static List<OrderDTO> toOrderDTOList(List<Order> orders) {
        if (orders == null) return Collections.emptyList();
        return orders.stream()
            .filter(Objects::nonNull)
            .map(OrderMapper::toOrderDTO)
            .collect(Collectors.toList());
    }

    public static List<Order> toOrderList(List<OrderDTO> orderDTOs) {
        return orderDTOs.stream().map(OrderMapper::toOrder).collect(Collectors.toList());
    }
}
