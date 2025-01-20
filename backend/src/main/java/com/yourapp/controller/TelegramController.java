package com.yourapp.controller;

import com.yourapp.model.Task;
import com.yourapp.model.User;
import com.yourapp.service.TelegramWebAppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.telegram.telegrambots.meta.api.objects.webapp.WebAppData;

@RestController
@RequestMapping("/api/telegram")
public class TelegramController {

    @Autowired
    private TelegramWebAppService telegramWebAppService;

    @PostMapping("/webapp")
    public String handleWebAppData(@RequestBody String webAppData, @RequestHeader("X-User-Id") Long userId) {
        User user = new User();
        user.setId(userId);
        return telegramWebAppService.processWebAppData(new WebAppData(), user);
    }

    @GetMapping("/task/{taskId}/share")
    public String getTaskShareLink(@PathVariable Long taskId) {
        Task task = new Task();
        task.setId(taskId);
        return telegramWebAppService.generateTaskShareLink(task);
    }

    @GetMapping("/auth/url")
    public String getAuthUrl() {
        return telegramWebAppService.generateAuthUrl();
    }
}