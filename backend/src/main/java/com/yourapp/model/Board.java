package com.yourapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import java.time.LocalDateTime;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.stream.Collectors;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "boards")
public class Board {
    private static final Logger logger = LoggerFactory.getLogger(Board.class);

    @Id
    @Column(length = 64)
    private String id;
    
    @Column(nullable = false)
    private String name;
    private String description;
    
    @Column(name = "is_archived")
    private boolean archived;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @JsonBackReference("board-owner")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User owner;
    
    @JsonManagedReference("board-columns")
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<BoardColumn> columns = new ArrayList<>();
    
    @JsonManagedReference("board-statuses")
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<TaskStatus> taskStatuses = new ArrayList<>();
    
    @JsonManagedReference("board-types")
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<TaskType> taskTypes = new ArrayList<>();
    
    // Дополнительные свойства, не хранящиеся в БД
    @Transient
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Map<String, Object> additionalProperties = new HashMap<>();
    
    /**
     * Устанавливает дополнительное свойство, которое будет сериализовано вместе с объектом
     * @param key ключ свойства
     * @param value значение свойства
     */
    public void setAdditionalProperty(String key, Object value) {
        if (additionalProperties == null) {
            additionalProperties = new HashMap<>();
        }
        additionalProperties.put(key, value);
    }
    
    /**
     * Позволяет получить все дополнительные свойства при сериализации
     * @return карта с дополнительными свойствами
     */
    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return additionalProperties;
    }
    
    /**
     * Генерирует хэш-идентификатор на основе UUID
     * @param uuid случайный UUID
     * @return SHA-256 хэш от UUID, сокращенный до 12 символов
     */
    public static String generateBoardId(String uuid) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(uuid.getBytes(StandardCharsets.UTF_8));
            
            // Преобразование байтов в шестнадцатеричную строку
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            
            return sb.toString().substring(0, 12);
        } catch (Exception e) {
            logger.error("Ошибка при генерации ID доски", e);
            return String.valueOf(System.currentTimeMillis());
        }
    }
    
    @PrePersist
    public void beforeSave() {
        if (id == null) {
            id = generateBoardId(UUID.randomUUID().toString());
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void beforeUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addColumn(BoardColumn column) {
        column.setBoard(this);
        column.setPosition(columns.size());
        columns.add(column);
    }
    
    public void removeColumn(BoardColumn column) {
        columns.remove(column);
        column.setBoard(null);
    }
    
    public void moveColumn(BoardColumn column, int newPosition) {
        // Сохраняем текущую позицию колонки
        int currentPosition = column.getPosition();
        logger.debug("Перемещение колонки с позиции {} на позицию {}", currentPosition, newPosition);
        
        // Если позиция не изменилась, ничего не делаем
        if (currentPosition == newPosition) {
            logger.debug("Позиция не изменилась, ничего не делаем");
            return;
        }
        
        // Проверяем, что колонка принадлежит этой доске
        if (!columns.contains(column)) {
            throw new IllegalArgumentException("Column not found in this board");
        }
        
        // Сначала удаляем колонку из списка
        columns.remove(column);
        logger.debug("Колонка удалена из списка, размер списка: {}", columns.size());
        
        // Проверяем, что новая позиция находится в допустимом диапазоне
        if (newPosition < 0 || newPosition > columns.size()) {
            // Возвращаем колонку на её оригинальную позицию
            if (currentPosition < columns.size()) {
                columns.add(currentPosition, column);
            } else {
                columns.add(column);
            }
            logger.error("Недопустимая позиция {}, допустимый диапазон: 0-{}", newPosition, columns.size());
            throw new IllegalArgumentException("Invalid position: " + newPosition);
        }
        
        // Добавляем колонку на новую позицию
        columns.add(newPosition, column);
        logger.debug("Колонка добавлена на новую позицию {}", newPosition);
        
        // Обновляем позиции всех колонок
        reorderColumns();
        logger.debug("Колонка успешно перемещена, новые позиции: {}", 
            columns.stream().map(c -> c.getName() + ":" + c.getPosition()).collect(Collectors.joining(", ")));
    }
    
    private void reorderColumns() {
        logger.debug("Переупорядочивание {} колонок", columns.size());
        for (int i = 0; i < columns.size(); i++) {
            BoardColumn col = columns.get(i);
            col.setPosition(i);
            logger.debug("Колонка '{}' теперь имеет позицию {}", col.getName(), col.getPosition());
        }
    }
    
    public void addTaskStatus(TaskStatus status) {
        status.setBoard(this);
        status.setPosition(taskStatuses.size());
        taskStatuses.add(status);
    }
    
    public void removeTaskStatus(TaskStatus status) {
        taskStatuses.remove(status);
        status.setBoard(null);
    }
    
    public void addTaskType(TaskType type) {
        type.setBoard(this);
        type.setPosition(taskTypes.size());
        taskTypes.add(type);
    }
    
    public void removeTaskType(TaskType type) {
        taskTypes.remove(type);
        type.setBoard(null);
    }
}