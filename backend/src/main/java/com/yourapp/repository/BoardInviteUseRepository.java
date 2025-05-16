package com.yourapp.repository;

import com.yourapp.model.BoardInviteUse;
import com.yourapp.model.BoardInviteLink;
import com.yourapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Репозиторий для работы с использованиями ссылок-приглашений
 */
@Repository
public interface BoardInviteUseRepository extends JpaRepository<BoardInviteUse, Long> {
    /**
     * Находит все использования ссылки-приглашения
     * @param inviteLink ссылка-приглашение
     * @return список использований
     */
    List<BoardInviteUse> findByInviteLink(BoardInviteLink inviteLink);
    
    /**
     * Находит все использования ссылок-приглашений пользователем
     * @param user пользователь
     * @return список использований
     */
    List<BoardInviteUse> findByUser(User user);
    
    /**
     * Проверяет, использовал ли пользователь ссылку-приглашение
     * @param inviteLink ссылка-приглашение
     * @param user пользователь
     * @return true, если пользователь использовал ссылку
     */
    boolean existsByInviteLinkAndUser(BoardInviteLink inviteLink, User user);
    
    /**
     * Подсчитывает количество использований ссылки-приглашения
     * @param inviteLink ссылка-приглашение
     * @return количество использований
     */
    long countByInviteLink(BoardInviteLink inviteLink);
} 