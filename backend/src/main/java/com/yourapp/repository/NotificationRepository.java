package com.yourapp.repository;

import com.yourapp.model.Notification;
import com.yourapp.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Репозиторий для работы с уведомлениями
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    /**
     * Находит все уведомления пользователя
     * @param user пользователь
     * @param pageable пагинация
     * @return страница уведомлений
     */
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    /**
     * Находит непрочитанные уведомления пользователя
     * @param user пользователь
     * @return список непрочитанных уведомлений
     */
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    /**
     * Подсчитывает количество непрочитанных уведомлений пользователя
     * @param user пользователь
     * @return количество непрочитанных уведомлений
     */
    long countByUserAndIsReadFalse(User user);
    
    /**
     * Отмечает все уведомления пользователя как прочитанные
     * @param user пользователь
     * @return количество обновленных записей
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    int markAllAsRead(User user);
} 