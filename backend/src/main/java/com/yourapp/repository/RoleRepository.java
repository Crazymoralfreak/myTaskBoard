package com.yourapp.repository;

import com.yourapp.model.Role;
import com.yourapp.model.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    /**
     * Находит роль по имени и доске
     * @param name имя роли
     * @param board доска, к которой относится роль
     * @return роль, если найдена
     */
    Optional<Role> findByNameAndBoard(String name, Board board);
    
    /**
     * Находит роль по имени для системных ролей (board = null)
     * @param name имя роли
     * @return роль, если найдена
     */
    Optional<Role> findByNameAndBoardIsNull(String name);
    
    /**
     * Находит все системные роли
     * @return список системных ролей
     */
    List<Role> findByIsSystemTrue();
    
    /**
     * Находит все роли для конкретной доски
     * @param board доска
     * @return список ролей доски
     */
    List<Role> findByBoard(Board board);
} 