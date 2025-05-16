package com.yourapp.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Исключение, выбрасываемое когда сущность не найдена в базе данных
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }
    
    public EntityNotFoundException(Class<?> entityClass, Object id) {
        super(String.format("Сущность %s с ID %s не найдена", entityClass.getSimpleName(), id.toString()));
    }
} 