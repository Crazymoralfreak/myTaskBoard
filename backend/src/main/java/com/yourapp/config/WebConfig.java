package com.yourapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import jakarta.annotation.PostConstruct;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);
    
    @Value("${app.upload.path:uploads}")
    private String uploadPath;
    
    @PostConstruct
    public void init() {
        // Создаем директории для загрузки файлов при запуске
        createUploadDirectories();
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Обрабатываем загруженные файлы
        String uploadDir = "file:" + uploadPath + "/";
        log.info("Настройка обработки ресурсов, путь загрузки: {}", uploadDir);
        
        // Обработчик для аватаров пользователей
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(uploadDir + "avatars/")
                .setCachePeriod(3600); // Кеширование на 1 час
        
        // Обработчик для вложений к задачам
        registry.addResourceHandler("/uploads/attachments/**")
                .addResourceLocations(uploadDir + "attachments/")
                .setCachePeriod(3600);
        
        // Обработчик для других изображений и файлов
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadDir)
                .setCachePeriod(3600);
    }
    
    /**
     * Создает необходимые директории для загрузки файлов
     */
    private void createUploadDirectories() {
        try {
            // Создаем основную директорию для загрузок
            Path baseDir = Paths.get(uploadPath);
            if (!Files.exists(baseDir)) {
                log.info("Создание базовой директории для загрузки: {}", baseDir);
                Files.createDirectories(baseDir);
                log.info("Базовая директория успешно создана");
            }
            
            // Создаем директорию для аватаров
            Path avatarsDir = Paths.get(uploadPath, "avatars");
            if (!Files.exists(avatarsDir)) {
                log.info("Создание директории для аватаров: {}", avatarsDir);
                Files.createDirectories(avatarsDir);
                log.info("Директория для аватаров успешно создана");
            }
            
            // Создаем директорию для вложений
            Path attachmentsDir = Paths.get(uploadPath, "attachments");
            if (!Files.exists(attachmentsDir)) {
                log.info("Создание директории для вложений: {}", attachmentsDir);
                Files.createDirectories(attachmentsDir);
                log.info("Директория для вложений успешно создана");
            }
        } catch (IOException e) {
            log.error("Ошибка при создании директорий для загрузки файлов", e);
        }
    }
} 