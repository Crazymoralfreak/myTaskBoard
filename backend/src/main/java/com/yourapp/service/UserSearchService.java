package com.yourapp.service;

import com.yourapp.model.User;
import com.yourapp.dto.UserDto;
import com.yourapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

/**
 * Сервис для поиска пользователей
 */
@Service
@RequiredArgsConstructor
public class UserSearchService {
    private final UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    /**
     * Универсальный поиск пользователей
     * @param query строка поиска
     * @param searchType тип поиска ("username", "email", или null для поиска по обоим полям)
     * @param limit максимальное количество результатов
     * @return список пользователей, соответствующих запросу
     */
    @Transactional(readOnly = true)
    public List<UserDto> findByQuery(String query, String searchType, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        
        // Определение типа поиска
        boolean searchByUsername = searchType == null || "username".equalsIgnoreCase(searchType) 
                || "any".equalsIgnoreCase(searchType);
        boolean searchByEmail = searchType == null || "email".equalsIgnoreCase(searchType) 
                || "any".equalsIgnoreCase(searchType);
        
        // Автоматическое определение типа поиска по наличию @
        if (searchType == null && query.contains("@")) {
            searchByUsername = false;
            searchByEmail = true;
        }
        
        // Используем Criteria API для гибкого поиска
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        // Добавляем предикаты в зависимости от типа поиска
        if (searchByUsername) {
            predicates.add(cb.like(cb.lower(root.get("username")), "%" + query.toLowerCase() + "%"));
        }
        
        if (searchByEmail) {
            predicates.add(cb.like(cb.lower(root.get("email")), "%" + query.toLowerCase() + "%"));
        }
        
        // Объединяем предикаты с OR
        cq.where(cb.or(predicates.toArray(new Predicate[0])));
        
        // Выполняем запрос с ограничением количества результатов
        TypedQuery<User> typedQuery = entityManager.createQuery(cq);
        typedQuery.setMaxResults(limit);
        
        // Преобразуем результаты в DTO и возвращаем
        return typedQuery.getResultList().stream()
                .map(User::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Поиск пользователей по имени пользователя
     * @param username имя пользователя
     * @param limit максимальное количество результатов
     * @return список пользователей
     */
    @Transactional(readOnly = true)
    public List<UserDto> findByUsername(String username, int limit) {
        return findByQuery(username, "username", limit);
    }
    
    /**
     * Поиск пользователей по email
     * @param email email
     * @param limit максимальное количество результатов
     * @return список пользователей
     */
    @Transactional(readOnly = true)
    public List<UserDto> findByEmail(String email, int limit) {
        return findByQuery(email, "email", limit);
    }
} 