package com.yourapp.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.Message;
import org.telegram.telegrambots.meta.api.objects.Chat;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class TelegramBotServiceTest {

    @Mock
    private TelegramBotsApi telegramBotsApi;

    @InjectMocks
    private TelegramBotService telegramBotService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testOnUpdateReceived() throws TelegramApiException {
        Update update = new Update();
        Message message = new Message();
        Chat chat = new Chat();
        
        chat.setId(12345L);
        message.setChat(chat);
        message.setText("Test message");
        update.setMessage(message);

        telegramBotService.onUpdateReceived(update);

        verify(telegramBotsApi, times(1)).execute(any(SendMessage.class));
    }

    @Test
    void testSendNotification() throws TelegramApiException {
        Long chatId = 12345L;
        String messageText = "Test notification";
        
        telegramBotService.sendNotification(chatId, messageText);

        verify(telegramBotsApi, times(1)).execute(any(SendMessage.class));
    }
}