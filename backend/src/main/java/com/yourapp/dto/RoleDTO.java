package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для передачи данных о роли пользователя на доске
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {
    private Long id;
    private String name;
    private String description;
    private boolean isSystem;
    
    // Геттеры
    public Long getId() {
        return this.id;
    }
    
    public String getName() {
        return this.name;
    }
    
    public String getDescription() {
        return this.description;
    }
    
    public boolean isSystem() {
        return this.isSystem;
    }
    
    // Сеттеры
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public void setSystem(boolean isSystem) {
        this.isSystem = isSystem;
    }
    
    // Ручная реализация builder
    public static RoleDTOBuilder builder() {
        return new RoleDTOBuilder();
    }
    
    public static class RoleDTOBuilder {
        private Long id;
        private String name;
        private String description;
        private boolean isSystem;
        
        public RoleDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }
        
        public RoleDTOBuilder name(String name) {
            this.name = name;
            return this;
        }
        
        public RoleDTOBuilder description(String description) {
            this.description = description;
            return this;
        }
        
        public RoleDTOBuilder isSystem(boolean isSystem) {
            this.isSystem = isSystem;
            return this;
        }
        
        public RoleDTO build() {
            RoleDTO dto = new RoleDTO();
            dto.id = this.id;
            dto.name = this.name;
            dto.description = this.description;
            dto.isSystem = this.isSystem;
            return dto;
        }
    }
} 