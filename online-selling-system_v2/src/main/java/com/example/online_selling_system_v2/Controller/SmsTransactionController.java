package com.example.online_selling_system_v2.Controller;

import com.example.online_selling_system_v2.Exception.ResourceNotFoundException;
import com.example.online_selling_system_v2.Model.SmsTransaction;
import com.example.online_selling_system_v2.Service.SmsTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsTransactionController {
    private final SmsTransactionService smsTransactionService;
    private static final Logger logger = LoggerFactory.getLogger(SmsTransactionController.class);

    @GetMapping
    public ResponseEntity<List<SmsTransaction>> findAll() {
        try {
            List<SmsTransaction> transactions = smsTransactionService.getAllTransactions();
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            logger.error("Error fetching all SMS transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SmsTransaction> find(@PathVariable Long id) {
        try {
            return smsTransactionService.getTransactionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching SMS transaction with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/unmatched")
    public ResponseEntity<List<SmsTransaction>> findUnmatched() {
        try {
            List<SmsTransaction> unmatched = smsTransactionService.getUnmatchedTransactions();
            return ResponseEntity.ok(unmatched);
        } catch (Exception e) {
            logger.error("Error fetching unmatched transactions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleSmsWebhook(@RequestBody SmsWebhookRequest request) {
        try {
            if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Message cannot be empty"));
            }

            logger.info("Received SMS webhook with message length: {}", request.getMessage().length());
            SmsTransaction transaction = smsTransactionService.processSmsTransaction(request.getMessage());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "status", "success",
                    "transaction", transaction,
                    "matched", transaction.getStatus() == SmsTransaction.TransactionStatus.MATCHED,
                    "orderId", transaction.getOrder() != null ? transaction.getOrder().getId() : null
                ));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid SMS format: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid message format: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error processing SMS webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to process message: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/match")
    public ResponseEntity<?> matchWithOrder(
            @PathVariable Long id,
            @RequestParam Long orderId) {
        try {
            SmsTransaction updated = smsTransactionService.matchTransactionWithOrder(id, orderId);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error matching transaction {} with order {}", id, orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            smsTransactionService.deleteTransaction(id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error deleting SMS transaction with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete transaction"));
        }
    }

    // Request DTO
    private static class SmsWebhookRequest {
        private String message;
        
        public String getMessage() { 
            return message; 
        }
        
        public void setMessage(String message) { 
            this.message = message; 
        }
    }
}
