package com.yourapp.config;

import com.yourapp.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

/**
 * Компонент для инициализации данных при запуске приложения
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InitializationConfig implements ApplicationListener<ContextRefreshedEvent> {
    private final RoleService roleService;
    private boolean alreadyInitialized = false;
    
    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        if (alreadyInitialized) {
            return;
        }
        
        log.info("Инициализация данных приложения");
        
        // Инициализация системных ролей
        roleService.initSystemRoles();
        
        alreadyInitialized = true;
        log.info("Инициализация данных завершена");
    }
} 