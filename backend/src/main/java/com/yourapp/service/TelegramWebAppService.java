package com.yourapp.service;

import com.yourapp.model.Task;
import com.yourapp.model.User;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.objects.WebAppData;

@Service
public class TelegramWebAppService {

    public String processWebAppData(WebAppData webAppData, User user) {
        // Process data from Telegram Web App
        return "Data processed successfully";
    }

    public String generateTaskShareLink(Task task) {
        // Generate a shareable link for the task
        return "https://yourdomain.com/tasks/" + task.getId();
    }

    public String generateAuthUrl() {
        // Generate Telegram Login Widget URL
        return "https://oauth.telegram.org/auth?bot_id=YOUR_BOT_ID&amp;origin=https://yourdomain.com";
    }
}