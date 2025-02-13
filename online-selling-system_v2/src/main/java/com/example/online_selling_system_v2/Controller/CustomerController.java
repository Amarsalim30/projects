package com.example.online_selling_system_v2.Controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.online_selling_system_v2.DTO.CustomerDTO;
import com.example.online_selling_system_v2.Mapper.CustomerMapper;
import com.example.online_selling_system_v2.Service.CustomerService;

import org.springframework.web.bind.annotation.PostMapping;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // GET all customers without pagination
    @GetMapping
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        List<CustomerDTO> customerDTOs = customerService.getAllCustomers().stream()
            .map(CustomerMapper::toCustomerDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(customerDTOs);
    }

    // Create a new customer with validation and error handling
    @PostMapping("/new")
    public ResponseEntity<?> createNewCustomer(@Valid @RequestBody CustomerDTO newCustomerDTO) {
        try {
            logger.info("Creating new customer: {}", newCustomerDTO);
            CustomerDTO savedCustomerDTO = customerService.save(newCustomerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCustomerDTO);
        } catch (Exception e) {
            logger.error("Error creating customer: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // Update an existing customer
    @PostMapping("/update/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerDTO updatedCustomerDTO) {
        try {
            logger.info("Updating customer with ID: {}", id);
            CustomerDTO updatedCustomer = customerService.updateCustomer(id, updatedCustomerDTO);
            return ResponseEntity.ok(updatedCustomer);
        } catch (Exception e) {
            logger.error("Error updating customer: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // Get customer by ID
    @GetMapping("/id/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        return customerService.getCustomerById(id)
            .map(CustomerMapper::toCustomerDTO)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Get customer by number
    @GetMapping("/number/{number}")
    public ResponseEntity<CustomerDTO> getCustomerByNumber(@PathVariable String number) {
        return customerService.getCustomerByNumber(number)
            .map(CustomerMapper::toCustomerDTO)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Delete customer by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        if (customerService.existsById(id)) {
            customerService.deleteCustomer(id);
            logger.info("Deleted customer with id: {}", id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<CustomerDTO>> searchCustomers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String number) {

        List<CustomerDTO> customers = new ArrayList<>();

        if (name != null && !name.isBlank()) {
            customers = customerService.searchCustomersByName(name).stream()
                    .map(CustomerMapper::toCustomerDTO)
                    .collect(Collectors.toList());
        } else if (number != null && !number.isBlank()) {
            customers = customerService.searchCustomersByNumber(number).stream()
                    .map(CustomerMapper::toCustomerDTO)
                    .collect(Collectors.toList());
        } else {
            customers = customerService.getAllCustomers().stream()
                    .map(CustomerMapper::toCustomerDTO)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(customers);
    }
}
