package com.example.online_selling_system_v2.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import com.example.online_selling_system_v2.Event.OrderEvent;
import com.example.online_selling_system_v2.Exception.OrderValidationException;
import com.example.online_selling_system_v2.Exception.ResourceNotFoundException;
import com.example.online_selling_system_v2.DTO.OrderDTO;
import com.example.online_selling_system_v2.Mapper.OrderMapper;
import com.example.online_selling_system_v2.Model.Order.Order;
import com.example.online_selling_system_v2.Model.Order.OrderStatus;
import com.example.online_selling_system_v2.Repository.OrderRepository;

@Service
@Transactional
public class OrderService {
    private static final int MAX_RETRIES = 3;
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final OrderMapper orderMapper;

    public OrderService(OrderRepository orderRepository, ApplicationEventPublisher eventPublisher, OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
        this.orderMapper = orderMapper;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<List<Order>> getOrderByCustomerName(String customerName) {
        return orderRepository.findByCustomerNameContainingIgnoreCase(customerName);
    }

    @Transactional(readOnly = true)
    public Optional<List<Order>> getOrderByDate(LocalDate date) {
        return orderRepository.findByDate(date);
    }
    @Transactional(readOnly = true)
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Order> findUnmatchedOrdersByCustomerNumber(String customerNumber) {
        return orderRepository.findUnmatchedOrdersByCustomerNumber(customerNumber);
    }

    @Transactional
    public OrderDTO addOrder(OrderDTO orderDTO) {
        try {
            Order order = orderMapper.toOrder(orderDTO);
            Order savedOrder = orderRepository.save(order);
            eventPublisher.publishEvent(new OrderEvent(savedOrder, OrderEvent.EventType.CREATED));
            return orderMapper.toOrderDTO(savedOrder);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create order: " + e.getMessage());
        }
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String newStatus) {
        try {
            return orderRepository.findById(orderId)
                .map(order -> {
                    OrderStatus currentStatus = order.getStatus();
                    OrderStatus nextStatus = OrderStatus.fromString(newStatus);
                    if (!OrderStatus.isValidTransition(currentStatus, nextStatus)) {
                        throw new OrderValidationException("Invalid status transition from " + currentStatus + " to " + nextStatus);
                    }
                    order.setStatus(nextStatus);
                    Order updatedOrder = orderRepository.save(order);
                    eventPublisher.publishEvent(new OrderEvent(updatedOrder, OrderEvent.EventType.STATUS_CHANGED));
                    return orderMapper.toOrderDTO(updatedOrder);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        } catch (IllegalArgumentException e) {
            throw new OrderValidationException("Invalid order status: " + newStatus);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update order status: " + e.getMessage());
        }
    }

    @Transactional
    public OrderDTO updatePaidAmount(Long orderId, BigDecimal additionalPayment) {
        int attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                return orderRepository.findById(orderId)
                    .map(order -> {
                        // Calculate new total paid amount
                        BigDecimal newPaidAmount = order.getPaidAmount().add(additionalPayment);
                        
                        // Validate the new total doesn't exceed order total
                        if (newPaidAmount.compareTo(order.getTotalAmount()) > 0) {
                            throw new OrderValidationException("Total paid amount cannot exceed order total amount");
                        }
                        
                        order.setPaidAmount(newPaidAmount);
                        order.updateTotals(); // This will update remaining amount and payment status
                        Order updatedOrder = orderRepository.save(order);
                        eventPublisher.publishEvent(new OrderEvent(updatedOrder, OrderEvent.EventType.PAYMENT_UPDATED));
                        return orderMapper.toOrderDTO(updatedOrder);
                    })
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
            } catch (ObjectOptimisticLockingFailureException e) {
                attempts++;
                if (attempts == MAX_RETRIES) {
                    throw new RuntimeException("Failed to update payment after " + MAX_RETRIES + " attempts");
                }
                // Small delay before retry
                try {
                    Thread.sleep(100);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Payment update was interrupted");
                }
            } catch (OrderValidationException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException("Failed to update paid amount: " + e.getMessage());
            }
        }
        throw new RuntimeException("Failed to update payment due to concurrent modifications");
    }
}
