package com.yourapp.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Исключение, выбрасываемое когда пользователь уже является участником доски
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BoardMemberExistsException extends RuntimeException {
    public BoardMemberExistsException(String message) {
        super(message);
    }
    
    public BoardMemberExistsException(Long userId, String boardId) {
        super(String.format("Пользователь с ID %d уже является участником доски %s", userId, boardId));
    }
} 