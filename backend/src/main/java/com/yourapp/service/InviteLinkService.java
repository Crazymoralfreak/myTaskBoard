package com.yourapp.service;

import com.yourapp.dto.BoardInviteLinkDTO;
import com.yourapp.dto.CreateInviteLinkRequest;
import com.yourapp.dto.JoinBoardByInviteResponse;
import com.yourapp.dto.RoleDTO;
import com.yourapp.dto.UserDto;
import com.yourapp.exception.EntityNotFoundException;
import com.yourapp.exception.InvalidInviteLinkException;
import com.yourapp.exception.BoardMemberExistsException;
import com.yourapp.model.Board;
import com.yourapp.model.BoardInviteLink;
import com.yourapp.model.BoardInviteUse;
import com.yourapp.model.Role;
import com.yourapp.model.User;
import com.yourapp.repository.BoardInviteLinkRepository;
import com.yourapp.repository.BoardInviteUseRepository;
import com.yourapp.repository.BoardRepository;
import com.yourapp.repository.RoleRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.util.NotificationUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Сервис для работы с ссылками-приглашениями
 */
@Service
@RequiredArgsConstructor
public class InviteLinkService {
    private final BoardInviteLinkRepository inviteLinkRepository;
    private final BoardInviteUseRepository inviteUseRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BoardMemberService boardMemberService;
    private final NotificationUtil notificationUtil;
    
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Создает новую ссылку-приглашение
     * @param boardId ID доски
     * @param currentUserId ID текущего пользователя
     * @param request запрос на создание ссылки
     * @return созданная ссылка-приглашение
     */
    @Transactional
    public BoardInviteLinkDTO createInviteLink(String boardId, Long currentUserId, CreateInviteLinkRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + currentUserId + " не найден"));
        
        Role defaultRole = roleRepository.findById(request.getDefaultRoleId())
                .orElseThrow(() -> new EntityNotFoundException("Роль с ID " + request.getDefaultRoleId() + " не найдена"));
        
        // Генерируем уникальный токен
        String token = generateUniqueToken();
        
        BoardInviteLink inviteLink = BoardInviteLink.builder()
                .board(board)
                .token(token)
                .createdBy(currentUser)
                .defaultRole(defaultRole)
                .maxUses(request.getMaxUses())
                .useCount(0)
                .expiresAt(request.getExpiresAt())
                .isActive(true)
                .build();
        
        BoardInviteLink savedInviteLink = inviteLinkRepository.save(inviteLink);
        
        return mapToDTO(savedInviteLink);
    }
    
    /**
     * Получает все активные ссылки-приглашения для доски
     * @param boardId ID доски
     * @return список ссылок-приглашений
     */
    @Transactional(readOnly = true)
    public List<BoardInviteLinkDTO> getBoardInviteLinks(String boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
        
        return inviteLinkRepository.findByBoardAndIsActiveTrue(board)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Деактивирует ссылку-приглашение
     * @param linkId ID ссылки
     * @param currentUserId ID текущего пользователя
     */
    @Transactional
    public void deactivateInviteLink(Long linkId, Long currentUserId) {
        BoardInviteLink inviteLink = inviteLinkRepository.findById(linkId)
                .orElseThrow(() -> new EntityNotFoundException("Ссылка-приглашение с ID " + linkId + " не найдена"));
        
        // Проверяем, что пользователь является создателем ссылки или владельцем доски
        if (!inviteLink.getCreatedBy().getId().equals(currentUserId) && 
            !inviteLink.getBoard().getOwner().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("У вас нет прав для деактивации этой ссылки");
        }
        
        inviteLink.setActive(false);
        inviteLinkRepository.save(inviteLink);
    }
    
    /**
     * Обрабатывает присоединение к доске по ссылке-приглашению
     * @param token токен приглашения
     * @param currentUserId ID текущего пользователя
     * @param request HTTP-запрос
     * @return ответ с информацией о доске
     */
    @Transactional
    public JoinBoardByInviteResponse joinByInviteLink(String token, Long currentUserId, HttpServletRequest request) {
        // Находим ссылку-приглашение по токену
        BoardInviteLink inviteLink = inviteLinkRepository.findByToken(token)
                .orElseThrow(InvalidInviteLinkException::notFound);
        
        // Проверяем, что ссылка валидна
        if (!inviteLink.isValid()) {
            if (!inviteLink.isActive()) {
                throw InvalidInviteLinkException.inactive();
            }
            if (inviteLink.getExpiresAt() != null && inviteLink.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw InvalidInviteLinkException.expired();
            }
            if (inviteLink.getMaxUses() != null && inviteLink.getUseCount() >= inviteLink.getMaxUses()) {
                throw InvalidInviteLinkException.maxUsesExceeded();
            }
        }
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + currentUserId + " не найден"));
        
        Board board = inviteLink.getBoard();
        
        // Проверяем, не является ли пользователь уже участником доски
        boolean alreadyMember = boardMemberService.isBoardMember(board, currentUser);
        
        if (!alreadyMember) {
            // Добавляем пользователя к доске с ролью из ссылки
            boardMemberService.addMemberToBoard(board.getId(), currentUser.getId(), inviteLink.getDefaultRole().getId());
            
            // Регистрируем использование ссылки
            BoardInviteUse inviteUse = BoardInviteUse.builder()
                    .inviteLink(inviteLink)
                    .user(currentUser)
                    .ipAddress(request.getRemoteAddr())
                    .userAgent(request.getHeader("User-Agent"))
                    .build();
            
            inviteUseRepository.save(inviteUse);
            
            // Увеличиваем счетчик использований
            inviteLink.incrementUseCount();
            inviteLinkRepository.save(inviteLink);
            
            // Отправляем уведомление создателю ссылки
            notificationUtil.notifyBoardInvite(currentUser, board);
        }
        
        return JoinBoardByInviteResponse.builder()
                .boardId(board.getId())
                .boardName(board.getName())
                .invitedBy(mapUserToDTO(inviteLink.getCreatedBy()))
                .assignedRole(mapRoleToDTO(inviteLink.getDefaultRole()))
                .requiresAuthentication(false)
                .alreadyMember(alreadyMember)
                .build();
    }
    
    /**
     * Генерирует уникальный токен для ссылки-приглашения
     * @return уникальный токен
     */
    private String generateUniqueToken() {
        String token;
        do {
            // Генерируем случайный UUID и берем первые 8 символов
            token = UUID.randomUUID().toString().substring(0, 8);
        } while (inviteLinkRepository.existsByTokenAndIsActiveTrue(token));
        
        return token;
    }
    
    /**
     * Преобразует модель BoardInviteLink в DTO
     * @param inviteLink модель ссылки-приглашения
     * @return DTO ссылки-приглашения
     */
    private BoardInviteLinkDTO mapToDTO(BoardInviteLink inviteLink) {
        String inviteUrl = String.format("%s/invite/%s", frontendUrl, inviteLink.getToken());
        
        return BoardInviteLinkDTO.builder()
                .id(inviteLink.getId())
                .token(inviteLink.getToken())
                .inviteUrl(inviteUrl)
                .createdBy(mapUserToDTO(inviteLink.getCreatedBy()))
                .boardId(inviteLink.getBoard().getId())
                .boardName(inviteLink.getBoard().getName())
                .defaultRole(mapRoleToDTO(inviteLink.getDefaultRole()))
                .maxUses(inviteLink.getMaxUses())
                .useCount(inviteLink.getUseCount())
                .expiresAt(inviteLink.getExpiresAt())
                .createdAt(inviteLink.getCreatedAt())
                .isActive(inviteLink.isActive())
                .build();
    }
    
    /**
     * Преобразует модель User в DTO
     * @param user модель пользователя
     * @return DTO пользователя
     */
    private UserDto mapUserToDTO(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
    
    /**
     * Преобразует модель Role в DTO
     * @param role модель роли
     * @return DTO роли
     */
    private RoleDTO mapRoleToDTO(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .isSystem(role.isSystem())
                .build();
    }
} 