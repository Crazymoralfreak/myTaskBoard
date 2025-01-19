package com.yourapp.controller;

import com.yourapp.service.TelegramWebAppService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TelegramControllerTest {

    @Mock
    private TelegramWebAppService telegramWebAppService;

    @InjectMocks
    private TelegramController telegramController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testHandleWebAppData() {
        when(telegramWebAppService.processWebAppData(any(), any()))
            .thenReturn("Data processed successfully");

        String result = telegramController.handleWebAppData("test data", 1L);
        assertEquals("Data processed successfully", result);
    }

    @Test
    void testGetTaskShareLink() {
        when(telegramWebAppService.generateTaskShareLink(any()))
            .thenReturn("https://yourdomain.com/tasks/123");

        String link = telegramController.getTaskShareLink(123L);
        assertTrue(link.contains("https://yourdomain.com/tasks/123"));
    }

    @Test
    void testGetAuthUrl() {
        when(telegramWebAppService.generateAuthUrl())
            .thenReturn("https://oauth.telegram.org/auth");

        String authUrl = telegramController.getAuthUrl();
        assertTrue(authUrl.contains("https://oauth.telegram.org/auth"));
    }
}