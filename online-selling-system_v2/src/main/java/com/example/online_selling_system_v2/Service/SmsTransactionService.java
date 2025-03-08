package com.example.online_selling_system_v2.Service;

import com.example.online_selling_system_v2.Model.Order.Order;
import com.example.online_selling_system_v2.Model.Customer;
import com.example.online_selling_system_v2.Model.PaymentDetails;
import com.example.online_selling_system_v2.Model.SmsTransaction;
import com.example.online_selling_system_v2.Model.SmsTransaction.TransactionStatus;
import com.example.online_selling_system_v2.Repository.PaymentDetailsRepository;
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
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class SmsTransactionService {
    private static final Logger logger = LoggerFactory.getLogger(SmsTransactionService.class);

    private final SmsTransactionRepository smsTransactionRepository;
    private final OrderService orderService;
    private final PaymentDetailsRepository paymentDetailsRepository;

    private static final Pattern MPESA_PATTERN = Pattern.compile(
        "([A-Z0-9]+)\\s+Confirmed\\.\\s+Ksh([\\d,]+\\.?\\d*)\\s+sent\\s+to\\s+([A-Z\\s]+)\\s+(\\d+)\\s+on\\s+(\\d{1,2}/\\d{1,2}/\\d{2})\\s+at\\s+(\\d{1,2}:\\d{2}\\s+[AP]M)"
    );

    public SmsTransactionService(SmsTransactionRepository smsTransactionRepository, 
                                 OrderService orderService,
                                 PaymentDetailsRepository paymentDetailsRepository) {
        this.smsTransactionRepository = smsTransactionRepository;
        this.orderService = orderService;
        this.paymentDetailsRepository = paymentDetailsRepository;
    }

    @Transactional
    public SmsTransaction processSmsTransaction(String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        logger.debug("Processing SMS message: {}", message);

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
            SmsTransaction transaction = buildTransactionFromMatcher(matcher, message);
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

    private SmsTransaction buildTransactionFromMatcher(Matcher matcher, String message) {
        SmsTransaction transaction = new SmsTransaction();
        transaction.setTransactionId(matcher.group(1));
        transaction.setAmount(parseMoney(matcher.group(2)));
        transaction.setCustomerName(matcher.group(3).trim());
        transaction.setCustomerNumber(normalizePhoneNumber(matcher.group(4)));
        transaction.setTransactionDate(parseDateTime(matcher.group(5), matcher.group(6)));
        transaction.setRawMessage(message);
        transaction.setStatus(TransactionStatus.PENDING);
        return transaction;
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
            // First check if this is a globally registered payment number
            boolean isGloballyRegistered = isValidGlobalPaymentNumber(transaction);
            logger.debug("Payment number {} is globally registered: {}", 
                transaction.getCustomerNumber(), isGloballyRegistered);

            // Get unmatched orders for this number
            List<Order> unmatchedOrders = orderService.findUnmatchedOrdersByCustomerNumber(
                transaction.getCustomerNumber()
            );
            
            // Handle case where no unmatched orders exist
            if (unmatchedOrders.isEmpty()) {
                handleNoUnmatchedOrders(transaction, isGloballyRegistered);
                return;
            }

            // Group orders by customer to handle multiple customers
            Map<Customer, List<Order>> ordersByCustomer = unmatchedOrders.stream()
                .collect(Collectors.groupingBy(Order::getCustomer));

            if (ordersByCustomer.size() > 1) {
                handleMultipleCustomersCase(transaction, ordersByCustomer);
                return;
            }

            // Process single customer case
            Customer customer = ordersByCustomer.keySet().iterator().next();
            List<Order> customerOrders = ordersByCustomer.get(customer);

            // Check if payment number is valid for this customer
            if (!isValidPaymentNumber(customer, transaction)) {
                if (isGloballyRegistered) {
                    addPaymentNumberToCustomerIfValid(customer, transaction);
                } else {
                    handleInvalidPaymentNumber(transaction);
                    return;
                }
            }

            // Update customer payment details and attempt order match
            updateCustomerPaymentDetails(customer, transaction);
            attemptOrderMatch(transaction, customerOrders, customer);

        } catch (Exception e) {
            logger.error("Error matching transaction with order: {}", 
                        transaction.getTransactionId(), e);
            throw new TransactionMatchingException(
                "Failed to match transaction with order: " + e.getMessage(), e);
        }
    }

    private void handleMultipleCustomersCase(SmsTransaction transaction, 
                                           Map<Customer, List<Order>> ordersByCustomer) {
        logger.warn("Multiple customers found with phone number {}: {}", 
            transaction.getCustomerNumber(),
            ordersByCustomer.keySet().stream()
                .map(c -> c.getName())
                .collect(Collectors.joining(", "))
        );
        
        // Try to match by customer name
        Optional<Customer> matchingCustomer = ordersByCustomer.keySet().stream()
            .filter(c -> c.getName().equalsIgnoreCase(transaction.getCustomerName()))
            .findFirst();

        if (matchingCustomer.isPresent()) {
            Customer customer = matchingCustomer.get();
            List<Order> customerOrders = ordersByCustomer.get(customer);
            updateCustomerPaymentDetails(customer, transaction);
            attemptOrderMatch(transaction, customerOrders, customer);
        } else {
            transaction.setStatus(TransactionStatus.UNMATCHED);
            logger.warn("Cannot determine correct customer for transaction {}", 
                       transaction.getTransactionId());
        }
    }

    private void addPaymentNumberToCustomerIfValid(Customer customer, SmsTransaction transaction) {
        // Check if number is already registered to another customer
        if (!paymentDetailsRepository.existsByPaymentNumberAndCustomerNot(
                transaction.getCustomerNumber(), customer)) {
            addPaymentNumberToCustomer(customer, transaction);
        } else {
            logger.warn("Payment number {} already registered to another customer", 
                       transaction.getCustomerNumber());
        }
    }

    private void handleInvalidPaymentNumber(SmsTransaction transaction) {
        transaction.setStatus(TransactionStatus.UNMATCHED);
        logger.warn("Payment number {} not registered globally or for any customer", 
                   transaction.getCustomerNumber());
    }

    private void handleNoUnmatchedOrders(SmsTransaction transaction, boolean isGloballyRegistered) {
        transaction.setStatus(TransactionStatus.UNMATCHED);
        String reason = isGloballyRegistered ? 
            "Registered number but no unmatched orders" : "Unregistered number and no orders";
        logger.warn("Transaction {} unmatched. Reason: {}", transaction.getTransactionId(), reason);
    }

    private boolean isValidPaymentNumber(Customer customer, SmsTransaction transaction) {
        return customer.getPaymentdetails().stream()
            .anyMatch(payment -> payment.getPaymentNumber()
            .equals(transaction.getCustomerNumber()));
    }

    private boolean isValidGlobalPaymentNumber(SmsTransaction transaction) {
        boolean exists = paymentDetailsRepository.existsByPaymentNumber(transaction.getCustomerNumber());
        if (exists) {
            logger.debug("Found globally registered payment number: {}", 
                        transaction.getCustomerNumber());
        }
        return exists;
    }

    private void addPaymentNumberToCustomer(Customer customer, SmsTransaction transaction) {
        // Check if the number is already linked to another customer
        boolean isNumberUsedElsewhere = paymentDetailsRepository.existsByPaymentNumberAndCustomerNot(
            transaction.getCustomerNumber(), customer
        );
        
        if (!isNumberUsedElsewhere) {
            PaymentDetails payment = PaymentDetails.builder()
                .paymentNumber(transaction.getCustomerNumber())
                .mpesaName(transaction.getCustomerName())
                .customer(customer)
                .build();
            customer.getPaymentdetails().add(payment);
        } else {
            logger.warn("Payment number {} is registered to another customer", transaction.getCustomerNumber());
        }
    }

    private void updateCustomerPaymentDetails(Customer customer, SmsTransaction transaction) {
        customer.getPaymentdetails().stream()
            .filter(payment -> payment.getPaymentNumber().equals(transaction.getCustomerNumber())
                    && (payment.getMpesaName() == null || payment.getMpesaName().isEmpty()))
            .findFirst()
            .ifPresent(payment -> payment.setMpesaName(transaction.getCustomerName()));
    }

    private void attemptOrderMatch(SmsTransaction transaction, List<Order> unmatchedOrders, Customer customer) {
        // Sort orders by date (oldest first)
        unmatchedOrders.sort(Comparator.comparing(Order::getDate));

        BigDecimal remainingPayment = transaction.getAmount();
        for (Order order : unmatchedOrders) {
            if (remainingPayment.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal orderRemaining = order.getRemainingAmount();
            if (orderRemaining.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal paymentAmount = remainingPayment.min(orderRemaining);
                matchTransactionWithOrder(transaction, order, customer, paymentAmount);
                remainingPayment = remainingPayment.subtract(paymentAmount);
            }
        }

        if (remainingPayment.compareTo(BigDecimal.ZERO) > 0) {
            logger.info("Excess payment of {} not matched for transaction {}", 
                        remainingPayment, transaction.getTransactionId());
            transaction.setStatus(TransactionStatus.PARTIALLY_MATCHED); // New status
        } else {
            transaction.setStatus(TransactionStatus.MATCHED);
        }
    }

    private void matchTransactionWithOrder(SmsTransaction transaction, Order order, Customer customer, BigDecimal amount) {
        transaction.setOrder(order); // Track primary order (optional: use a list for multiple)
        orderService.updatePaidAmount(order.getId(), amount);
        logger.info("Applied {} to order {} (remaining: {})", 
                   amount, order.getId(), order.getRemainingAmount());
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
