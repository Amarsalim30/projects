package com.example.online_selling_system_v2.Exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class BaseException extends RuntimeException {
    private final HttpStatus status;
    private final String message;

    public BaseException(String message, HttpStatus status) {
        super(message);
        this.message = message;
        this.status = status;
    }
}
