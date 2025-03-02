package com.example.online_selling_system_v2.Service;

import com.example.online_selling_system_v2.Model.Order.Order;
import com.example.online_selling_system_v2.Model.SmsTransaction;
import com.example.online_selling_system_v2.Model.SmsTransaction.TransactionStatus;
import com.example.online_selling_system_v2.Repository.SmsTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class SmsTransactionService {
    private static final Logger logger = LoggerFactory.getLogger(SmsTransactionService.class);
    
    private final SmsTransactionRepository smsTransactionRepository;
    private final OrderService orderService;
    @SuppressWarnings("unused")
    private final CustomerService customerService;

    private static final Pattern MPESA_PATTERN = Pattern.compile(
        "([A-Z0-9]+)\\s+Confirmed\\.\\s+Ksh([\\d,]+\\.?\\d*)\\s+sent\\s+to\\s+([A-Z\\s]+)\\s+(\\d+)\\s+on\\s+(\\d{1,2}/\\d{1,2}/\\d{2})\\s+at\\s+(\\d{1,2}:\\d{2}\\s+[AP]M)"
    );

    public SmsTransactionService(
            SmsTransactionRepository smsTransactionRepository, 
            OrderService orderService,
            CustomerService customerService) {
        this.smsTransactionRepository = smsTransactionRepository;
        this.orderService = orderService;
        this.customerService = customerService;
    }

    @Transactional
    public SmsTransaction processSmsTransaction(String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        logger.debug("Processing SMS message: {}", message);

        // Check for duplicate transaction
        Matcher matcher = MPESA_PATTERN.matcher(message);
        if (!matcher.find()) {
            logger.warn("Invalid M-PESA message format: {}", message);
            throw new IllegalArgumentException("Invalid M-PESA message format");
        }

        String transactionId = matcher.group(1);
        if (smsTransactionRepository.existsByTransactionId(transactionId)) {
            logger.warn("Duplicate transaction detected: {}", transactionId);
            throw new DuplicateTransactionException("Transaction already processed: " + transactionId);
        }

        try {
            SmsTransaction transaction = new SmsTransaction();
            transaction.setTransactionId(transactionId);
            transaction.setAmount(parseMoney(matcher.group(2)));
            transaction.setCustomerName(matcher.group(3).trim());
            transaction.setCustomerNumber(normalizePhoneNumber(matcher.group(4)));
            transaction.setTransactionDate(parseDateTime(matcher.group(5), matcher.group(6)));
            transaction.setRawMessage(message);
            transaction.setStatus(TransactionStatus.PENDING);

            validateTransaction(transaction);
            matchWithOrder(transaction);

            SmsTransaction savedTransaction = smsTransactionRepository.save(transaction);
            logger.info("Successfully processed transaction: {} with status: {}", 
                       transactionId, savedTransaction.getStatus());
            
            return savedTransaction;

        } catch (Exception e) {
            logger.error("Error processing transaction: {}", transactionId, e);
            throw new TransactionProcessingException("Failed to process transaction: " + e.getMessage(), e);
        }
    }

    private void validateTransaction(SmsTransaction transaction) {
        if (transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transaction amount must be positive");
        }
        
        if (!isValidPhoneNumber(transaction.getCustomerNumber())) {
            throw new IllegalArgumentException("Invalid phone number format");
        }

        if (transaction.getTransactionDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Transaction date cannot be in the future");
        }
    }

    @Transactional
    public void matchWithOrder(SmsTransaction transaction) {
        try {
            List<Order> unmatchedOrders = orderService.findUnmatchedOrdersByCustomerNumber(
                transaction.getCustomerNumber()
            );

            logger.debug("Found {} unmatched orders for customer: {}", 
                        unmatchedOrders.size(), transaction.getCustomerNumber());

            //phase 1:the transaction can be processed as
            // a full (or partial) payment without exceeding the remaining balance.
            for (Order order : unmatchedOrders) {
                if (order.getRemainingAmount().compareTo(transaction.getAmount()) >= 0) {
                    transaction.setOrder(order);
                    transaction.setStatus(TransactionStatus.MATCHED);
                    orderService.updatePaidAmount(order.getId(), transaction.getAmount());
                    logger.info("Matched transaction {} with order {}", 
                              transaction.getTransactionId(), order.getId());
                    return;
                }
            }

            transaction.setStatus(TransactionStatus.UNMATCHED);
            logger.info("No matching order found for transaction: {}", 
                       transaction.getTransactionId());

        } catch (Exception e) {
            logger.error("Error matching transaction with order: {}", 
                        transaction.getTransactionId(), e);
            throw new TransactionMatchingException(
                "Failed to match transaction with order: " + e.getMessage(), e);
        }
    }

    private String normalizePhoneNumber(String number) {
        String cleaned = number.replaceAll("\\D", "");
        if (cleaned.startsWith("0")) {
            cleaned = "254" + cleaned.substring(1);
        }
        return "+" + cleaned;
    }

    private boolean isValidPhoneNumber(String number) {
        return number.matches("\\+254\\d{9}");
    }

    private LocalDateTime parseDateTime(String date, String time) {
        try {
            String dateTimeStr = date + " " + time;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d/M/yy h:mm a");
            return LocalDateTime.parse(dateTimeStr, formatter);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date/time format", e);
        }
    }

    private BigDecimal parseMoney(String amount) {
        try {
            return new BigDecimal(amount.replaceAll("[^\\d.]", ""))
                .setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid amount format", e);
        }
    }

    @Transactional(readOnly = true)
    public List<SmsTransaction> getAllTransactions() {
        return smsTransactionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<SmsTransaction> getTransactionById(Long id) {
        return smsTransactionRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<SmsTransaction> getUnmatchedTransactions() {
        return smsTransactionRepository.findByStatus(TransactionStatus.UNMATCHED);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        if (!smsTransactionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Transaction not found with id: " + id);
        }
        smsTransactionRepository.deleteById(id);
    }

    @Transactional
    public SmsTransaction matchTransactionWithOrder(Long transactionId, Long orderId) {
        SmsTransaction transaction = smsTransactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + transactionId));

        Order order = orderService.getOrderById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        transaction.setOrder(order);
        transaction.setStatus(TransactionStatus.MATCHED);
        orderService.updatePaidAmount(orderId, transaction.getAmount());

        return smsTransactionRepository.save(transaction);
    }

    // Custom exceptions
    public static class TransactionProcessingException extends RuntimeException {
        public TransactionProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class TransactionMatchingException extends RuntimeException {
        public TransactionMatchingException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class DuplicateTransactionException extends RuntimeException {
        public DuplicateTransactionException(String message) {
            super(message);
        }
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
}
