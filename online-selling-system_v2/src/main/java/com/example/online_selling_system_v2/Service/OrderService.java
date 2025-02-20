package com.example.online_selling_system_v2.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.example.online_selling_system_v2.Event.OrderEvent;
import com.example.online_selling_system_v2.DTO.OrderDTO;
import com.example.online_selling_system_v2.Mapper.OrderMapper;
import com.example.online_selling_system_v2.Model.Order.Order;
import com.example.online_selling_system_v2.Model.Order.OrderStatus;
import com.example.online_selling_system_v2.Repository.OrderRepository;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(OrderRepository orderRepository, ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<List<Order>> getOrderByCustomerName(String customer_Name) {
        return orderRepository.findByCustomer_Name(customer_Name);
    }

    public Optional<List<Order>> getOrderByDate(LocalDate date) {
        return orderRepository.findByDate(date);
    }

    public OrderDTO addOrder(OrderDTO orderDTO) {
        Order order = OrderMapper.toOrder(orderDTO);
        Order savedOrder = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderEvent(savedOrder, OrderEvent.EventType.CREATED));
        return OrderMapper.toOrderDTO(savedOrder);
    }

    public OrderDTO updateOrderStatus(Long orderId, String newStatus) {
        return orderRepository.findById(orderId)
            .map(order -> {
                order.setStatus(OrderStatus.valueOf(newStatus.toUpperCase()));
                Order updatedOrder = orderRepository.save(order);
                eventPublisher.publishEvent(new OrderEvent(updatedOrder, OrderEvent.EventType.STATUS_CHANGED));
                return OrderMapper.toOrderDTO(updatedOrder);
            })
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }
}
