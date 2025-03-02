package com.example.online_selling_system_v2.Mapper;

import com.example.online_selling_system_v2.DTO.OrderItemDTO;
import com.example.online_selling_system_v2.Model.Product;
import com.example.online_selling_system_v2.Model.Order.OrderItem;
import com.example.online_selling_system_v2.Service.ProductService;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class OrderItemMapper {
    private static final Logger logger = LoggerFactory.getLogger(OrderItemMapper.class);
    private static ProductService productService;
    public OrderItemMapper(ProductService productService) {
        OrderItemMapper.productService = productService;
    }

    public static OrderItem toOrderItem(OrderItemDTO dto) {
        if (dto == null) {
            logger.warn("Received null OrderItemDTO");
            return null;
        }

        OrderItem orderItem = new OrderItem();
        try {
            Product product = productService.getProductById(dto.getProductId());
            if (product == null) {
                throw new IllegalArgumentException("Product not found with ID: " + dto.getProductId());
            }
            
            // Validate quantity
            if (dto.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be positive");
            }            
            orderItem.setProductId(dto.getProductId());
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(dto.getQuantity());
            
            // Validate and set price with proper scaling
            BigDecimal price = dto.getItemPrice().setScale(2, RoundingMode.HALF_UP);
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Price cannot be negative");
            }
            orderItem.setItemPrice(price);



        } catch (RuntimeException e) {
            logger.error("Error mapping OrderItemDTO to OrderItem: {}", e.getMessage());
            throw new IllegalStateException("Failed to map order item: " + e.getMessage());
        }

        return orderItem;
    }

    public static OrderItemDTO toOrderItemDTO(OrderItem orderItem) {
        if (orderItem == null) {
            logger.warn("Received null OrderItem");
            return null;
        }

        OrderItemDTO dto = new OrderItemDTO();
        dto.setProductId(orderItem.getProductId());
        // Order Forder =orderItem.getOrder();
        // dto.setOrderId(Forder.getId());
        dto.setQuantity(orderItem.getQuantity());
        dto.setItemPrice(orderItem.getItemPrice().setScale(2, RoundingMode.HALF_UP));
        dto.setProductName(orderItem.getProductName());

        return dto;
    }

    //Combines to list after mapping
    public static List<OrderItem> toOrderItemList(List<OrderItemDTO> dtos) {
        if (dtos == null) {
            logger.warn("Received null OrderItemDTO list");
            return Collections.emptyList();
        }
        
        return dtos.stream()
            .filter(Objects::nonNull)
            .map(OrderItemMapper::toOrderItem)
            .collect(Collectors.toList());
    }

    public static List<OrderItemDTO> toOrderItemDTOList(List<OrderItem> orderItems) {
        if (orderItems == null) {
            logger.warn("Received null OrderItem list");
            return Collections.emptyList();
        }
        
        return orderItems.stream()
            .filter(Objects::nonNull)
            .map(OrderItemMapper::toOrderItemDTO)
            .collect(Collectors.toList());
    }
}
