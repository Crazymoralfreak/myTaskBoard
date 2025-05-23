package com.yourapp.repository;

import com.yourapp.model.User;
import com.yourapp.model.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
    Optional<UserSettings> findByUser(User user);
    void deleteByUser(User user);
    
    /**
     * Безопасное обновление настроек пользователя без изменения связи с пользователем
     * @param id ID настроек
     * @param darkMode режим темной темы
     * @param compactMode компактный режим
     * @param enableAnimations включить анимации
     * @param language язык интерфейса
     * @param timezone временная зона
     * @return количество обновленных записей
     */
    @Modifying
    @Transactional
    @Query("UPDATE UserSettings s SET " +
           "s.darkMode = :darkMode, " +
           "s.compactMode = :compactMode, " +
           "s.enableAnimations = :enableAnimations, " +
           "s.language = :language, " +
           "s.timezone = :timezone " +
           "WHERE s.id = :id")
    int updateSettingsSafely(Long id, Boolean darkMode, Boolean compactMode, 
                          Boolean enableAnimations, String language, String timezone);
}