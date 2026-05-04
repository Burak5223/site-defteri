package com.sitedefteri.dto.cargo;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * DTO for validation results with field-level errors
 */
@Data
@NoArgsConstructor
public class ValidationResult {
    private boolean valid = true;
    private Map<String, String> fieldErrors = new HashMap<>();

    public void addError(String field, String message) {
        this.valid = false;
        this.fieldErrors.put(field, message);
    }

    public boolean hasErrors() {
        return !valid;
    }
}
