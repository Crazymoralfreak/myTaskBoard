package com.yourapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Добавляем обработку загруженных аватаров
        String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";
        
        // Проверяем существование директории или создаем ее
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir + File.separator);
                
        // Добавляем стандартные статические ресурсы
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
    }
} 