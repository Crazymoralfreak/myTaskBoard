package com.yourapp.controller;

import com.yourapp.service.UserService;
import com.yourapp.service.TaskService;
import com.yourapp.service.BoardService;
import com.yourapp.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ApiControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private TaskService taskService;

    @Mock
    private BoardService boardService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ApiController apiController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLogin() {
        when(userService.authenticate(any(), any()))
            .thenReturn("token123");

        ResponseEntity<?> response = apiController.login("user@example.com", "password123");
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("token123"));
    }

    @Test
    void testGetCurrentUser() {
        when(userService.getCurrentUser())
            .thenReturn("User data");

        ResponseEntity<?> response = apiController.getCurrentUser();
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("User data"));
    }

    @Test
    void testCreateTask() {
        when(taskService.createTask(any()))
            .thenReturn("Task created");

        ResponseEntity<?> response = apiController.createTask("Task data");
        assertEquals(201, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("Task created"));
    }

    @Test
    void testGetTask() {
        when(taskService.getTask(anyLong()))
            .thenReturn("Task details");

        ResponseEntity<?> response = apiController.getTask(123L);
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("Task details"));
    }

    @Test
    void testCreateBoard() {
        when(boardService.createBoard(any()))
            .thenReturn("Board created");

        ResponseEntity<?> response = apiController.createBoard("Board data");
        assertEquals(201, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("Board created"));
    }

    @Test
    void testGetBoard() {
        when(boardService.getBoard(anyLong()))
            .thenReturn("Board details");

        ResponseEntity<?> response = apiController.getBoard(123L);
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("Board details"));
    }

    @Test
    void testGetNotificationPreferences() {
        when(notificationService.getPreferences())
            .thenReturn("Notification preferences");

        ResponseEntity<?> response = apiController.getNotificationPreferences();
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().toString().contains("Notification preferences"));
    }
}