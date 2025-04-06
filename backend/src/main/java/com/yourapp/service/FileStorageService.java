package com.yourapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;
import jakarta.annotation.PostConstruct;

/**
 * Сервис для централизованной работы с файлами в приложении
 */
@Service
public class FileStorageService {
    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    
    @Value("${app.upload.path:uploads}")
    private String uploadPath;
    
    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadPath));
            log.info("Инициализация сервиса хранения файлов. Базовая директория: {}", uploadPath);
        } catch (IOException e) {
            log.error("Не удалось создать директорию для загрузки файлов", e);
            throw new RuntimeException("Не удалось создать директорию для загрузки файлов", e);
        }
    }
    
    /**
     * Сохраняет файл и возвращает путь к нему
     * 
     * @param file файл для сохранения
     * @param subdirectory поддиректория для сохранения файла (например, "avatars" или "attachments")
     * @return относительный путь к сохраненному файлу
     */
    public String storeFile(MultipartFile file, String subdirectory) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Не удалось сохранить пустой файл");
        }
        
        // Создаем поддиректорию, если она не существует
        Path targetDir = Paths.get(uploadPath, subdirectory);
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
            log.info("Создана поддиректория для файлов: {}", targetDir);
        }
        
        // Очищаем имя файла и получаем расширение
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String fileExtension = "";
        
        if (originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        // Создаем уникальное имя файла
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        Path targetLocation = targetDir.resolve(uniqueFilename);
        
        log.info("Сохранение файла {} в {}", originalFilename, targetLocation);
        
        // Копируем файл в целевую директорию
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        // Возвращаем относительный путь к файлу для хранения в БД
        return String.format("/uploads/%s/%s", subdirectory, uniqueFilename);
    }
    
    /**
     * Удаляет файл по указанному пути
     * 
     * @param filePath путь к файлу для удаления
     * @return true, если файл успешно удален, иначе false
     */
    public boolean deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            log.warn("Попытка удалить файл с пустым путем");
            return false;
        }
        
        try {
            // Удаляем префикс /uploads/ для получения относительного пути
            String relativePath = filePath.startsWith("/uploads/") ? 
                filePath.substring("/uploads/".length()) : filePath;
            
            Path fileToDelete = Paths.get(uploadPath, relativePath);
            
            if (Files.exists(fileToDelete)) {
                Files.delete(fileToDelete);
                log.info("Файл успешно удален: {}", fileToDelete);
                return true;
            } else {
                log.warn("Файл не найден: {}", fileToDelete);
                return false;
            }
        } catch (IOException e) {
            log.error("Ошибка при удалении файла: {}", filePath, e);
            return false;
        }
    }
    
    /**
     * Возвращает полный путь к файлу в файловой системе
     * 
     * @param relativePath относительный путь к файлу
     * @return полный путь к файлу
     */
    public Path getFullPath(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            throw new IllegalArgumentException("Путь к файлу не может быть пустым");
        }
        
        // Удаляем префикс /uploads/ для получения относительного пути
        String cleanPath = relativePath.startsWith("/uploads/") ? 
            relativePath.substring("/uploads/".length()) : relativePath;
            
        return Paths.get(uploadPath, cleanPath);
    }
} 