package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

/**
 * DTO для запроса на создание ссылки-приглашения
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInviteLinkRequest {
    /**
     * ID роли по умолчанию для приглашенных пользователей
     */
    @NotNull(message = "ID роли по умолчанию не может быть пустым")
    private Long defaultRoleId;
    
    /**
     * Максимальное количество использований ссылки
     */
    @Min(value = 1, message = "Максимальное количество использований должно быть не менее 1")
    private Integer maxUses;
    
    /**
     * Дата и время истечения срока действия ссылки
     */
    @Future(message = "Дата истечения срока действия должна быть в будущем")
    private LocalDateTime expiresAt;
} 