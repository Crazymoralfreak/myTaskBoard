package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

/**
 * DTO для запроса на добавление участника к доске
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddBoardMemberRequest {
    @NotNull(message = "ID пользователя не может быть пустым")
    private Long userId;
    
    @NotNull(message = "ID роли не может быть пустым")
    private Long roleId;
} 