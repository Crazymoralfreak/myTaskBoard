package com.yourapp.repository;

import com.yourapp.model.BoardInviteLink;
import com.yourapp.model.Board;
import com.yourapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с ссылками-приглашениями
 */
@Repository
public interface BoardInviteLinkRepository extends JpaRepository<BoardInviteLink, Long> {
    /**
     * Находит ссылку-приглашение по токену
     * @param token токен
     * @return ссылка-приглашение, если найдена
     */
    Optional<BoardInviteLink> findByToken(String token);
    
    /**
     * Находит все активные ссылки-приглашения для доски
     * @param board доска
     * @return список ссылок-приглашений
     */
    List<BoardInviteLink> findByBoardAndIsActiveTrue(Board board);
    
    /**
     * Находит все активные ссылки-приглашения для доски, созданные пользователем
     * @param board доска
     * @param createdBy создатель
     * @return список ссылок-приглашений
     */
    List<BoardInviteLink> findByBoardAndCreatedByAndIsActiveTrue(Board board, User createdBy);
    
    /**
     * Находит все активные и валидные ссылки-приглашения для доски
     * @param board доска
     * @param now текущее время
     * @return список ссылок-приглашений
     */
    @Query("SELECT l FROM BoardInviteLink l WHERE l.board = :board AND l.isActive = true " +
           "AND (l.expiresAt IS NULL OR l.expiresAt > :now)")
    List<BoardInviteLink> findValidLinks(Board board, LocalDateTime now);
    
    /**
     * Проверяет, существует ли активная ссылка-приглашение с указанным токеном
     * @param token токен
     * @return true, если ссылка существует
     */
    boolean existsByTokenAndIsActiveTrue(String token);
} 