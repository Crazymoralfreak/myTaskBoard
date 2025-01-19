package com.yourapp.service;

import com.yourapp.model.Task;
import com.yourapp.model.User;
import org.junit.jupiter.api.Test;
import org.telegram.telegrambots.meta.api.objects.WebAppData;

import static org.junit.jupiter.api.Assertions.*;

class TelegramWebAppServiceTest {

    private final TelegramWebAppService telegramWebAppService = new TelegramWebAppService();

    @Test
    void testProcessWebAppData() {
        WebAppData webAppData = new WebAppData();
        webAppData.setData("test data");
        User user = new User();
        user.setId(1L);

        String result = telegramWebAppService.processWebAppData(webAppData, user);
        assertEquals("Data processed successfully", result);
    }

    @Test
    void testGenerateTaskShareLink() {
        Task task = new Task();
        task.setId(123L);
        
        String link = telegramWebAppService.generateTaskShareLink(task);
        assertTrue(link.contains("https://yourdomain.com/tasks/123"));
    }

    @Test
    void testGenerateAuthUrl() {
        String authUrl = telegramWebAppService.generateAuthUrl();
        assertTrue(authUrl.contains("https://oauth.telegram.org/auth"));
    }
}