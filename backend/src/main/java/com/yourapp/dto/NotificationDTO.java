package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO для передачи данных уведомления
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String relatedEntityId;
    private String relatedEntityType;
    private boolean isRead;
    private LocalDateTime createdAt;
    
    // Ручная реализация методов вручную на случай, если Lombok не сработает
    public static NotificationDTOBuilder builder() {
        return new NotificationDTOBuilder();
    }
    
    public static class NotificationDTOBuilder {
        private Long id;
        private String title;
        private String message;
        private String type;
        private String relatedEntityId;
        private String relatedEntityType;
        private boolean isRead;
        private LocalDateTime createdAt;
        
        public NotificationDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public NotificationDTOBuilder title(String title) {
            this.title = title;
            return this;
        }
        
        public NotificationDTOBuilder message(String message) {
            this.message = message;
            return this;
        }
        
        public NotificationDTOBuilder type(String type) {
            this.type = type;
            return this;
        }
        
        public NotificationDTOBuilder relatedEntityId(String relatedEntityId) {
            this.relatedEntityId = relatedEntityId;
            return this;
        }
        
        public NotificationDTOBuilder relatedEntityType(String relatedEntityType) {
            this.relatedEntityType = relatedEntityType;
            return this;
        }
        
        public NotificationDTOBuilder isRead(boolean isRead) {
            this.isRead = isRead;
            return this;
        }
        
        public NotificationDTOBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        public NotificationDTO build() {
            NotificationDTO dto = new NotificationDTO();
            dto.id = this.id;
            dto.title = this.title;
            dto.message = this.message;
            dto.type = this.type;
            dto.relatedEntityId = this.relatedEntityId;
            dto.relatedEntityType = this.relatedEntityType;
            dto.isRead = this.isRead;
            dto.createdAt = this.createdAt;
            return dto;
        }
    }
} 