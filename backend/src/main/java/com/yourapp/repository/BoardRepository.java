package com.yourapp.repository;

import com.yourapp.model.Board;
import com.yourapp.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BoardRepository extends JpaRepository<Board, String> {
    List<Board> findByOwnerId(Long ownerId);

    @Query("SELECT DISTINCT b FROM Board b " +
           "LEFT JOIN FETCH b.columns c " +
           "WHERE b.id = :id AND b.archived = false")
    Optional<Board> findByIdWithColumns(@Param("id") String id);

    @Query("SELECT DISTINCT b FROM Board b " +
           "LEFT JOIN FETCH b.taskTypes " +
           "WHERE b.id = :id AND b.archived = false")
    Optional<Board> findByIdWithTypes(@Param("id") String id);

    @Query("SELECT DISTINCT b FROM Board b " +
           "LEFT JOIN FETCH b.taskStatuses " +
           "WHERE b.id = :id AND b.archived = false")
    Optional<Board> findByIdWithStatuses(@Param("id") String id);

    @Query("SELECT DISTINCT t FROM Task t " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.customStatus " +
           "WHERE t.column.board.id = :boardId " +
           "AND t.column.board.archived = false " +
           "AND t.column IS NOT NULL")
    List<Task> findTasksByBoardId(@Param("boardId") String boardId);
}