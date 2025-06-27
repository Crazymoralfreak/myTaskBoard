package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.yourapp.dto.UserDto;

/**
 * DTO для ответа на запрос присоединения к доске по ссылке-приглашению
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinBoardByInviteResponse {
    private String boardId;
    private String boardName;
    private UserDto invitedBy;
    private RoleDTO assignedRole;
    private boolean requiresAuthentication;
    private boolean alreadyMember;
} 