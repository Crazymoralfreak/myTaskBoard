package com.yourapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Конфигурация WebSocket для уведомлений в реальном времени
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Префикс для точек назначения сообщений (куда отправляются сообщения)
        config.enableSimpleBroker("/topic", "/queue");
        // Префикс для точек назначения приложения (куда клиенты отправляют сообщения)
        config.setApplicationDestinationPrefixes("/app");
        // Префикс для приватных сообщений конкретным пользователям
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Регистрация конечной точки WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*") // В реальном проекте ограничьте это до ваших доменов
                .withSockJS(); // Поддержка для старых браузеров
    }

    /**
     * Конфигурация безопасности WebSocket
     */
    @Configuration
    static class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {
        
        @Override
        protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
            messages
                    // Сообщения могут быть отправлены только аутентифицированными пользователями
                    .simpDestMatchers("/app/**").authenticated()
                    // Подписки на топики доступны только аутентифицированным пользователям
                    .simpSubscribeDestMatchers("/topic/**", "/queue/**").authenticated();
        }
        
        @Override
        protected boolean sameOriginDisabled() {
            // Отключаем проверку origin для разработки
            // В реальном проекте установите это в false
            return true;
        }
    }
}