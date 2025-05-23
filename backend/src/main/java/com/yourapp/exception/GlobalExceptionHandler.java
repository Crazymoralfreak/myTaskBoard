package com.yourapp.exception;

import com.yourapp.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
        logger.warn("Сущность не найдена: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .code("ENTITY_NOT_FOUND")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        logger.warn("Ресурс не найден: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .code("RESOURCE_NOT_FOUND")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        logger.warn("Доступ запрещен: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .code("ACCESS_DENIED")
                .message("У вас нет прав для выполнения этой операции")
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(ValidationException ex) {
        logger.warn("Ошибка валидации: {}", ex.getErrors());
        
        String details = ex.getErrors().entrySet().stream()
                .map(e -> e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining(", "));
        
        ErrorResponse error = ErrorResponse.builder()
                .code("VALIDATION_ERROR")
                .message("Ошибка валидации данных")
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        logger.warn("Ошибка валидации аргументов: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage()));
        
        String details = errors.entrySet().stream()
                .map(e -> e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining(", "));
        
        ErrorResponse error = ErrorResponse.builder()
                .code("VALIDATION_ERROR")
                .message("Ошибка валидации данных")
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(InvalidInviteLinkException.class)
    public ResponseEntity<ErrorResponse> handleInvalidInviteLinkException(InvalidInviteLinkException ex) {
        logger.warn("Неверная ссылка-приглашение: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .code("INVALID_INVITE_LINK")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(BoardMemberExistsException.class)
    public ResponseEntity<ErrorResponse> handleBoardMemberExistsException(BoardMemberExistsException ex) {
        logger.warn("Пользователь уже является участником: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .code("BOARD_MEMBER_EXISTS")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException ex) {
        logger.error("Неподдерживаемый тип данных: {}", ex.getMessage());
        
        // Детальное логирование для отладки
        logger.debug("Поддерживаемые типы: {}", ex.getSupportedMediaTypes());
        logger.debug("Тип контента: {}", ex.getContentType());
        
        ErrorResponse error = ErrorResponse.builder()
                .code("UNSUPPORTED_MEDIA_TYPE")
                .message("Неподдерживаемый тип данных")
                .details("Поддерживаемые типы: " + ex.getSupportedMediaTypes())
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }
    
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        logger.error("Ошибка чтения запроса: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .code("BAD_REQUEST")
                .message("Ошибка чтения запроса")
                .details("Проверьте корректность формата JSON")
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        logger.error("Внутренняя ошибка сервера: {} {} {}", request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);
        
        // Специальная обработка для ошибок пароля
        if (ex.getMessage() != null && ex.getMessage().contains("Invalid password")) {
            logger.error("Ошибка проверки пароля: {}", ex.getMessage());
            
            ErrorResponse error = ErrorResponse.builder()
                    .code("AUTH_ERROR")
                    .message("Ошибка аутентификации")
                    .details("Неверный пароль.")
                    .timestamp(LocalDateTime.now())
                    .build();
            
            return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
        }
        
        ErrorResponse error = ErrorResponse.builder()
                .code("SERVER_ERROR")
                .message("Произошла внутренняя ошибка сервера")
                .details(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
} 