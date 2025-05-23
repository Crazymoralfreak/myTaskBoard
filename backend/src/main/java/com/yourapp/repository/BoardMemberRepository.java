package com.yourapp.repository;

import com.yourapp.model.BoardMember;
import com.yourapp.model.Board;
import com.yourapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
    /**
     * Находит участника доски по пользователю и доске
     * @param user пользователь
     * @param board доска
     * @return участник, если найден
     */
    Optional<BoardMember> findByUserAndBoard(User user, Board board);
    
    /**
     * Проверяет, является ли пользователь участником доски
     * @param user пользователь
     * @param board доска
     * @return true, если пользователь является участником доски
     */
    boolean existsByUserAndBoard(User user, Board board);
    
    /**
     * Находит всех участников доски
     * @param board доска
     * @return список участников доски
     */
    List<BoardMember> findByBoard(Board board);
    
    /**
     * Находит все доски, в которых участвует пользователь
     * @param user пользователь
     * @return список участий пользователя в досках
     */
    List<BoardMember> findByUser(User user);
    
    /**
     * Удаляет участника доски по пользователю и доске
     * @param user пользователь
     * @param board доска
     */
    void deleteByUserAndBoard(User user, Board board);
} 