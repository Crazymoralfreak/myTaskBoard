package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO для передачи информации о ссылке-приглашении
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardInviteLinkDTO {
    private Long id;
    private String token;
    private String inviteUrl;
    private UserDTO createdBy;
    private String boardId;
    private String boardName;
    private RoleDTO defaultRole;
    private Integer maxUses;
    private Integer useCount;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private boolean isActive;
} 