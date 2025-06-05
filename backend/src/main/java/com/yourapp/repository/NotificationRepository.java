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
     * Находит неархивированные уведомления пользователя
     * @param user пользователь
     * @param pageable пагинация
     * @return страница неархивированных уведомлений
     */
    Page<Notification> findByUserAndIsArchivedFalseOrderByCreatedAtDesc(User user, Pageable pageable);
    
    /**
     * Находит архивированные уведомления пользователя
     * @param user пользователь
     * @param pageable пагинация
     * @return страница архивированных уведомлений
     */
    Page<Notification> findByUserAndIsArchivedTrueOrderByCreatedAtDesc(User user, Pageable pageable);
    
    /**
     * Находит непрочитанные уведомления пользователя
     * @param user пользователь
     * @return список непрочитанных уведомлений
     */
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    /**
     * Находит непрочитанные неархивированные уведомления пользователя, отсортированные по приоритету и дате
     * @param user пользователь
     * @return список непрочитанных уведомлений
     */
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.isRead = false AND n.isArchived = false ORDER BY n.priority DESC, n.createdAt DESC")
    List<Notification> findByUserAndIsReadFalseAndIsArchivedFalseOrderByPriorityDescCreatedAtDesc(User user);
    
    /**
     * Подсчитывает количество непрочитанных уведомлений пользователя
     * @param user пользователь
     * @return количество непрочитанных уведомлений
     */
    long countByUserAndIsReadFalse(User user);
    
    /**
     * Подсчитывает количество непрочитанных неархивированных уведомлений пользователя
     * @param user пользователь
     * @return количество непрочитанных неархивированных уведомлений
     */
    long countByUserAndIsReadFalseAndIsArchivedFalse(User user);
    
    /**
     * Отмечает все уведомления пользователя как прочитанные
     * @param user пользователь
     * @return количество обновленных записей
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.user = :user AND n.isRead = false")
    int markAllAsRead(User user);
    
    /**
     * Находит уведомления по ключу группировки
     * @param user пользователь
     * @param groupKey ключ группировки
     * @return список уведомлений
     */
    List<Notification> findByUserAndGroupKey(User user, String groupKey);
    
    /**
     * Находит уведомления по списку ID и пользователю
     * @param ids список ID уведомлений
     * @param user пользователь
     * @return список уведомлений
     */
    List<Notification> findByIdInAndUser(List<Long> ids, User user);
    
    /**
     * Находит непрочитанные уведомления по списку ID и пользователю
     * @param ids список ID уведомлений
     * @param user пользователь
     * @return список уведомлений
     */
    List<Notification> findByIdInAndUserAndIsReadFalse(List<Long> ids, User user);
} 