package com.yourapp.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Исключение, выбрасываемое при использовании неверной ссылки-приглашения
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidInviteLinkException extends RuntimeException {
    public InvalidInviteLinkException(String message) {
        super(message);
    }
    
    /**
     * Создает исключение для случая, когда ссылка не найдена
     * @return исключение
     */
    public static InvalidInviteLinkException notFound() {
        return new InvalidInviteLinkException("Ссылка-приглашение не найдена или удалена");
    }
    
    /**
     * Создает исключение для случая, когда срок действия ссылки истек
     * @return исключение
     */
    public static InvalidInviteLinkException expired() {
        return new InvalidInviteLinkException("Срок действия приглашения истек");
    }
    
    /**
     * Создает исключение для случая, когда превышено максимальное количество использований
     * @return исключение
     */
    public static InvalidInviteLinkException maxUsesExceeded() {
        return new InvalidInviteLinkException("Превышено максимальное количество использований приглашения");
    }
    
    /**
     * Создает исключение для случая, когда ссылка неактивна
     * @return исключение
     */
    public static InvalidInviteLinkException inactive() {
        return new InvalidInviteLinkException("Приглашение больше не активно");
    }
} 