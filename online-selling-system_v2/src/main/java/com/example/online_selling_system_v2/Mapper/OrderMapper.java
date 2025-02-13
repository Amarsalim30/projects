package com.example.online_selling_system_v2.Mapper;

import com.example.online_selling_system_v2.Model.Order;
import com.example.online_selling_system_v2.DTO.OrderDTO;

import java.util.List;
import java.util.stream.Collectors;

public class OrderMapper {

    public static Order toOrder(OrderDTO orderDTO) {
        Order order = new Order();
        order.setCustomer(orderDTO.getCustomer());
        order.setDate(orderDTO.getDate());
        order.setStatus(orderDTO.getStatus());
        order.setTotalAmount(orderDTO.getTotalAmount());
        order.setPaidAmount(orderDTO.getPaidAmount());
        order.setRemainingAmount(orderDTO.getRemainingAmount());
        // Add products mapping if needed
        return order;
    }

    public static OrderDTO toOrderDTO(Order order) {
        OrderDTO orderDTO = new OrderDTO();
        orderDTO.setCustomer(order.getCustomer());
        orderDTO.setDate(order.getDate());
        orderDTO.setStatus(order.getStatus());
        orderDTO.setTotalAmount(order.getTotalAmount());
        orderDTO.setPaidAmount(order.getPaidAmount());
        orderDTO.setRemainingAmount(order.getRemainingAmount());
        // Add products mapping if needed
        return orderDTO;
    }

    public static List<OrderDTO> toOrderDTOList(List<Order> orders) {
        return orders.stream().map(OrderMapper::toOrderDTO).collect(Collectors.toList());
    }

    public static List<Order> toOrderList(List<OrderDTO> orderDTOs) {
        return orderDTOs.stream().map(OrderMapper::toOrder).collect(Collectors.toList());
    }
}
