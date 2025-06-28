package com.yourapp.service;

import com.yourapp.model.Board;
import com.yourapp.model.User;
import com.yourapp.model.Role;
import com.yourapp.model.BoardMember;
import com.yourapp.dto.BoardMemberDTO;
import com.yourapp.dto.RoleDTO;
import com.yourapp.util.NotificationUtil;
import com.yourapp.repository.BoardMemberRepository;
import com.yourapp.repository.BoardRepository;
import com.yourapp.repository.UserRepository;
import com.yourapp.exception.EntityNotFoundException;
import com.yourapp.exception.BoardMemberExistsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Сервис для работы с участниками доски
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BoardMemberService {
    private final BoardMemberRepository boardMemberRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;
    private final NotificationUtil notificationUtil;
    
    /**
     * Добавляет пользователя к доске с указанной ролью
     * @param boardId ID доски
     * @param userId ID пользователя
     * @param roleId ID роли
     * @return DTO добавленного участника
     */
    @Transactional
    public BoardMemberDTO addMemberToBoard(String boardId, Long userId, Long roleId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        // Проверяем, не является ли пользователь уже участником доски
        if (boardMemberRepository.existsByUserAndBoard(user, board)) {
            throw new BoardMemberExistsException(user.getUsername(), board.getName());
        }
        
        Role role = roleService.getRoleById(roleId);
        
        BoardMember boardMember = BoardMember.builder()
                .user(user)
                .board(board)
                .role(role)
                .build();
        
        BoardMember savedMember = boardMemberRepository.save(boardMember);
        
        // Создаем уведомление о добавлении участника доски
        notificationUtil.notifyBoardMemberAdded(user, board);
        
        return mapToDTO(savedMember);
    }
    
    /**
     * Получает всех участников доски
     * @param boardId ID доски
     * @return список участников доски
     */
    @Transactional(readOnly = true)
    public List<BoardMemberDTO> getBoardMembers(String boardId) {
        log.info("Загрузка участников доски с ID: {}", boardId);
        
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
        
        log.info("Доска найдена: {}, владелец: {}", board.getName(), 
                board.getOwner() != null ? board.getOwner().getUsername() + " (ID: " + board.getOwner().getId() + ")" : "null");
        
        List<BoardMember> boardMembers = boardMemberRepository.findByBoard(board);
        log.info("Найдено {} участников доски", boardMembers.size());
        
        // Логирование информации о каждом участнике
        boardMembers.forEach(member -> {
            log.info("Участник: userId={}, username={}, roleId={}, roleName={}",
                    member.getUser().getId(),
                    member.getUser().getUsername(),
                    member.getRole().getId(),
                    member.getRole().getName());
        });
        
        List<BoardMemberDTO> memberDTOs = boardMembers.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        log.info("Преобразовано в DTO {} участников", memberDTOs.size());
        return memberDTOs;
    }
    
    /**
     * Обновляет роль участника доски
     * @param boardId ID доски
     * @param userId ID пользователя
     * @param roleId ID новой роли
     * @return обновленный DTO участника
     */
    @Transactional
    public BoardMemberDTO updateMemberRole(String boardId, Long userId, Long roleId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        // Проверяем, является ли пользователь владельцем доски
        if (board.getOwner() != null && board.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException("Невозможно изменить роль владельца доски");
        }
        
        BoardMember boardMember = boardMemberRepository.findByUserAndBoard(user, board)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не является участником доски"));
        
        Role role = roleService.getRoleById(roleId);
        boardMember.setRole(role);
        
        BoardMember updatedMember = boardMemberRepository.save(boardMember);
        
        // Создаем уведомление об изменении роли
        notificationUtil.notifyRoleChanged(user, board, role);
        
        return mapToDTO(updatedMember);
    }
    
    /**
     * Удаляет участника из доски
     * @param boardId ID доски
     * @param userId ID пользователя
     */
    @Transactional
    public void removeMemberFromBoard(String boardId, Long userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь с ID " + userId + " не найден"));
        
        // Проверяем, не является ли пользователь владельцем доски
        if (board.getOwner() != null && board.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException("Невозможно удалить владельца доски");
        }
        
        // Проверяем, является ли пользователь участником доски
        if (!boardMemberRepository.existsByUserAndBoard(user, board)) {
            throw new EntityNotFoundException("Пользователь не является участником доски");
        }
        
        boardMemberRepository.deleteByUserAndBoard(user, board);
        
        // Создаем уведомление об удалении участника доски
        notificationUtil.notifyBoardMemberRemoved(user, board);
    }
    
    /**
     * Проверяет, является ли пользователь участником доски
     * @param board доска
     * @param user пользователь
     * @return true, если пользователь является участником доски
     */
    @Transactional(readOnly = true)
    public boolean isBoardMember(Board board, User user) {
        return boardMemberRepository.existsByUserAndBoard(user, board);
    }
    
    /**
     * Преобразование модели BoardMember в DTO
     * @param boardMember модель участника доски
     * @return DTO участника доски
     */
    private BoardMemberDTO mapToDTO(BoardMember boardMember) {
        User user = boardMember.getUser();
        
        RoleDTO roleDTO = RoleDTO.builder()
                .id(boardMember.getRole().getId())
                .name(boardMember.getRole().getName())
                .description(boardMember.getRole().getDescription())
                .isSystem(boardMember.getRole().isSystem())
                .build();
        
        return BoardMemberDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(roleDTO)
                .joinedAt(boardMember.getJoinedAt())
                .build();
    }
} 