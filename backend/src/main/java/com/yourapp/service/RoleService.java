package com.yourapp.service;

import com.yourapp.model.Role;
import com.yourapp.model.Board;
import com.yourapp.dto.RoleDTO;
import com.yourapp.repository.RoleRepository;
import com.yourapp.repository.BoardRepository;
import com.yourapp.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Сервис для работы с ролями пользователей
 */
@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final BoardRepository boardRepository;
    
    /**
     * Инициализация системных ролей при запуске приложения
     */
    @Transactional
    public void initSystemRoles() {
        if (roleRepository.findByIsSystemTrue().isEmpty()) {
            Role adminRole = Role.builder()
                    .name("ADMIN")
                    .description("Полный доступ к доске")
                    .isSystem(true)
                    .build();
            
            Role editorRole = Role.builder()
                    .name("EDITOR")
                    .description("Может редактировать задачи и колонки")
                    .isSystem(true)
                    .build();
            
            Role viewerRole = Role.builder()
                    .name("VIEWER")
                    .description("Только просмотр доски")
                    .isSystem(true)
                    .build();
            
            roleRepository.save(adminRole);
            roleRepository.save(editorRole);
            roleRepository.save(viewerRole);
        }
    }
    
    /**
     * Получает роль по ID
     * @param roleId ID роли
     * @return роль
     * @throws EntityNotFoundException если роль не найдена
     */
    @Transactional(readOnly = true)
    public Role getRoleById(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new EntityNotFoundException("Роль с ID " + roleId + " не найдена"));
    }
    
    /**
     * Получает системную роль по имени
     * @param name имя роли
     * @return роль
     * @throws EntityNotFoundException если роль не найдена
     */
    @Transactional(readOnly = true)
    public Role getSystemRoleByName(String name) {
        return roleRepository.findByNameAndBoardIsNull(name)
                .orElseThrow(() -> new EntityNotFoundException("Системная роль с именем " + name + " не найдена"));
    }
    
    /**
     * Получает все системные роли
     * @return список системных ролей
     */
    @Transactional(readOnly = true)
    public List<RoleDTO> getAllSystemRoles() {
        return roleRepository.findByIsSystemTrue()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Получает все роли для доски
     * @param boardId ID доски
     * @return список ролей
     */
    @Transactional(readOnly = true)
    public List<RoleDTO> getBoardRoles(String boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Доска с ID " + boardId + " не найдена"));
                
        return getBoardRoles(board);
    }
    
    /**
     * Получает все роли для доски
     * @param board доска
     * @return список ролей
     */
    @Transactional(readOnly = true)
    public List<RoleDTO> getBoardRoles(Board board) {
        // Получаем системные роли и роли доски
        List<Role> systemRoles = roleRepository.findByIsSystemTrue();
        List<Role> boardRoles = roleRepository.findByBoard(board);
        
        // Объединяем списки и конвертируем в DTO
        return Stream.concat(systemRoles.stream(), boardRoles.stream())
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Преобразование модели Role в DTO
     * @param role модель роли
     * @return DTO роли
     */
    private RoleDTO mapToDTO(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .isSystem(role.isSystem())
                .build();
    }
} 