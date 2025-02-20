package com.example.online_selling_system_v2.Exception;

import org.springframework.http.HttpStatus;

public class OrderValidationException extends BaseException {
    public OrderValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
