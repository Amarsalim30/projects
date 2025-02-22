package com.example.online_selling_system_v2.Validator;

import java.util.ArrayList;
import java.util.List;

public class ValidationResult {
    private final List<String> errors = new ArrayList<>();

    public void addError(String error) {
        errors.add(error);
    }

    public List<String> getErrors() {
        return errors;
    }

    public boolean isValid() {
        return errors.isEmpty();
    }
}
