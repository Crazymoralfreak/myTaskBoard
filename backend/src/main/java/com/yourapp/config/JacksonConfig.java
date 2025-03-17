package com.yourapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Регистрируем модуль для работы с Java 8 Date/Time API
        mapper.registerModule(new JavaTimeModule());
        
        // Отключаем сериализацию дат как временных меток
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Игнорируем неизвестные свойства при десериализации
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        // Отключаем ошибку при пустых бинах (важно для Hibernate прокси)
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        
        // Для красивого вывода JSON в логах
        mapper.enable(SerializationFeature.INDENT_OUTPUT);
        
        return mapper;
    }
} 