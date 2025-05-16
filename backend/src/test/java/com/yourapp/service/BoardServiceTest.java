package com.yourapp.service;

import com.yourapp.model.Board;
import com.yourapp.model.User;
import com.yourapp.model.Role;
import com.yourapp.repository.BoardRepository;
import com.yourapp.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
public class BoardServiceTest {

    @Mock
    private BoardRepository boardRepository;
    
    @Mock
    private BoardMemberService boardMemberService;
    
    @Mock
    private RoleService roleService;
    
    @InjectMocks
    private BoardService boardService;
    
    private Board board;
    private User owner;
    private Role adminRole;
    
    @BeforeEach
    void setUp() {
        // Настраиваем тестовые данные
        owner = new User();
        owner.setId(1L);
        owner.setUsername("testUser");
        owner.setEmail("test@example.com");
        
        board = new Board();
        board.setId("test-board-id");
        board.setName("Test Board");
        board.setDescription("Test Description");
        board.setOwner(owner);
        
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ADMIN");
        adminRole.setDescription("Полный доступ к доске");
        adminRole.setSystem(true);
    }
    
    @Test
    void testCreateBoardWithOwnerAsAdmin() {
        // Настраиваем поведение моков
        when(boardRepository.save(any(Board.class))).thenReturn(board);
        when(roleService.getSystemRoleByName("ADMIN")).thenReturn(adminRole);
        
        // Вызываем тестируемый метод
        Board savedBoard = boardService.createBoard(board);
        
        // Проверяем результаты
        assertNotNull(savedBoard);
        assertEquals("Test Board", savedBoard.getName());
        assertEquals("Test Description", savedBoard.getDescription());
        assertEquals(owner, savedBoard.getOwner());
        
        // Проверяем, что владелец был добавлен как участник с ролью админа
        verify(boardRepository, times(1)).save(any(Board.class));
        verify(roleService, times(1)).getSystemRoleByName("ADMIN");
        verify(boardMemberService, times(1)).addMemberToBoard(
                board.getId(), owner.getId(), adminRole.getId());
    }
} 