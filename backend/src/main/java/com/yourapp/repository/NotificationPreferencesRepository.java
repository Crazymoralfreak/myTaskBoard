package com.yourapp.repository;

import com.yourapp.model.NotificationPreferences;
import com.yourapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Репозиторий для работы с настройками уведомлений
 */
@Repository
public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, Long> {
    /**
     * Находит настройки уведомлений по пользователю
     * @param user пользователь
     * @return настройки уведомлений
     */
    Optional<NotificationPreferences> findByUser(User user);
} 