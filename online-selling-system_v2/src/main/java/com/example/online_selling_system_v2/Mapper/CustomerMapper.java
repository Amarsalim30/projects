package com.example.online_selling_system_v2.Mapper;

import com.example.online_selling_system_v2.DTO.CustomerDTO;
import com.example.online_selling_system_v2.Model.Customer;

public class CustomerMapper {
    public static CustomerDTO toCustomerDTO(Customer customer) {
        return new CustomerDTO(
            customer.getId(),
            customer.getName(),
            customer.getNumber(),
            customer.getOrderCount()
        );
    }
    public static Customer toCustomer(CustomerDTO customerDTO) {
        Customer customer = new Customer();
        customer.setName(customerDTO.getName());
        customer.setNumber(customerDTO.getNumber());
        return customer;
    }
}
