package com.example.online_selling_system_v2.Service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.online_selling_system_v2.Model.Customer;
import com.example.online_selling_system_v2.Repository.CustomerRepository;
import com.example.online_selling_system_v2.DTO.CustomerDTO;
import com.example.online_selling_system_v2.Mapper.CustomerMapper;

import java.util.List;

@Service
public class CustomerService {
    
    private final CustomerRepository customerRepository;
    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);
    
    public CustomerService(CustomerRepository customerRepository){
        this.customerRepository = customerRepository;
    }

    //CRUD operations which are built-in
    
    public List<Customer> getAllCustomers() {
        logger.info("Fetching all customers");
        return customerRepository.findAll();
    }

    public Customer save(Customer newCustomer){ //2
        logger.info("Saving new customer: {}", newCustomer);
        return customerRepository.save(newCustomer);
    }

    public CustomerDTO save(CustomerDTO newCustomerDTO) {
        logger.info("Saving new customer: {}", newCustomerDTO);
        Customer customer = CustomerMapper.toCustomer(newCustomerDTO);
        Customer savedCustomer = customerRepository.save(customer);
        return CustomerMapper.toCustomerDTO(savedCustomer);
    }

    public Optional<Customer> getCustomerById(Long id){ //3
        logger.info("Fetching customer by ID: {}", id);
        return customerRepository.findById(id);
    }

    public void deleteCustomer(Long id){     //4
        logger.info("Deleting customer by ID: {}", id);
        customerRepository.deleteById(id);
    }

    public boolean existsById(Long id){ //5
        logger.info("Checking if customer exists by ID: {}", id);
        return customerRepository.existsById(id);
    }

    public Optional<Customer> getCustomerByName(String name){
        logger.info("Fetching customer by name: {}", name);
        return customerRepository.findByName(name);
    }

    public Optional<Customer> getCustomerByNumber(String number){
        logger.info("Fetching customer by number: {}", number);
        return customerRepository.findByNumber(number);
    }

    //search
    public List<Customer> searchCustomersByName(String name) {
        logger.info("Searching customers by name: {}", name);
        return customerRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Customer> searchCustomersByNumber(String number) {
        logger.info("Searching customers by number: {}", number);
        return customerRepository.findByNumberContaining(number);
    }

    public Customer updateCustomer(Long id, Customer updatedCustomer) {
        logger.info("Updating customer with ID: {}", id);
        return customerRepository.findById(id)
            .map(customer -> {
                customer.setName(updatedCustomer.getName());
                customer.setNumber(updatedCustomer.getNumber());
                // ...update other fields as necessary...
                return customerRepository.save(customer);
            })
            .orElseGet(() -> {
                updatedCustomer.setId(id);
                return customerRepository.save(updatedCustomer);
            });
    }

    public CustomerDTO updateCustomer(Long id, CustomerDTO updatedCustomerDTO) {
        logger.info("Updating customer with ID: {}", id);
        Customer updatedCustomer = CustomerMapper.toCustomer(updatedCustomerDTO);
        return customerRepository.findById(id)
            .map(customer -> {
                customer.setName(updatedCustomer.getName());
                customer.setNumber(updatedCustomer.getNumber());
                // ...update other fields as necessary...
                Customer savedCustomer = customerRepository.save(customer);
                return CustomerMapper.toCustomerDTO(savedCustomer);
            })
            .orElseGet(() -> {
                updatedCustomer.setId(id);
                Customer savedCustomer = customerRepository.save(updatedCustomer);
                return CustomerMapper.toCustomerDTO(savedCustomer);
            });
    }

    public boolean existsByNumber(String number) {
        logger.info("Checking if customer exists by number: {}", number);
        // Normalize the number by removing any formatting
        String normalizedNumber = number.replaceAll("[^0-9]", "");
        
        // If it starts with 254, that's fine, otherwise prepend it
        if (!normalizedNumber.startsWith("254")) {
            normalizedNumber = "254" + normalizedNumber;
        }
        
        // Check both formatted and unformatted versions
        return customerRepository.existsByNumber(normalizedNumber) ||
               customerRepository.existsByNumber("+" + normalizedNumber);
    }
}
