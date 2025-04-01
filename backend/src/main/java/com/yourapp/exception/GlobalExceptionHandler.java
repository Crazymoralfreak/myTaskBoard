package com.yourapp.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleHttpMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException ex) {
        logger.error("Неподдерживаемый тип данных: {}", ex.getMessage());
        
        // Детальное логирование для отладки
        logger.debug("Поддерживаемые типы: {}", ex.getSupportedMediaTypes());
        logger.debug("Тип контента: {}", ex.getContentType());
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "Неподдерживаемый тип данных");
        response.put("message", ex.getMessage());
        response.put("supportedTypes", ex.getSupportedMediaTypes().toString());
        
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(response);
    }
    
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        logger.error("Ошибка чтения запроса: {}", ex.getMessage());
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "Ошибка чтения запроса");
        response.put("message", "Проверьте корректность формата JSON");
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        logger.error("Внутренняя ошибка сервера: {}", ex.getMessage(), ex);
        
        Map<String, String> response = new HashMap<>();
        response.put("error", "Внутренняя ошибка сервера");
        response.put("message", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
} 