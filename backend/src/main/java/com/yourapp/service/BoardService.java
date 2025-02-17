package com.yourapp.service;

import com.yourapp.model.Board;
import com.yourapp.model.BoardColumn;
import com.yourapp.model.TaskStatus;
import com.yourapp.exception.ResourceNotFoundException;
import com.yourapp.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {
    private static final Logger logger = LoggerFactory.getLogger(BoardService.class);
    private final BoardRepository boardRepository;
    
    public Board createBoard(Board board) {
        if (board.getName() == null || board.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Board name cannot be empty");
        }
        
        if (board.getOwner() == null) {
            throw new IllegalArgumentException("Board must have an owner");
        }
        
        // Добавляем дефолтные статусы
        List<TaskStatus> defaultStatuses = Arrays.asList(
            TaskStatus.builder()
                .name("To Do")
                .color("#E5E5E5")
                .isDefault(true)
                .position(0)
                .build(),
            TaskStatus.builder()
                .name("In Progress")
                .color("#FFD700")
                .isDefault(true)
                .position(1)
                .build(),
            TaskStatus.builder()
                .name("Completed")
                .color("#90EE90")
                .isDefault(true)
                .position(2)
                .build()
        );
        
        defaultStatuses.forEach(status -> {
            status.setBoard(board);
            board.getTaskStatuses().add(status);
        });
        
        return boardRepository.save(board);
    }
    
    @Transactional
    public Board updateBoard(Long id, Board boardDetails) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));
        
        board.setName(boardDetails.getName());
        board.setDescription(boardDetails.getDescription());
        board.setArchived(boardDetails.isArchived());
        
        return boardRepository.save(board);
    }
    
    @Transactional
    public void deleteBoard(Long id) {
        boardRepository.deleteById(id);
    }
    
    public Board getBoard(Long id) {
        return boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));
    }
    
    public List<Board> getAllBoards() {
        return boardRepository.findAll();
    }
    
    @Transactional
    public Board archiveBoard(Long id) {
        Board board = getBoard(id);
        board.setArchived(true);
        return boardRepository.save(board);
    }
    
    @Transactional
    public Board unarchiveBoard(Long id) {
        Board board = getBoard(id);
        board.setArchived(false);
        return boardRepository.save(board);
    }

    public List<Board> getUserBoards(Long userId) {
        return boardRepository.findByOwnerId(userId);
    }

    @Transactional
    public Board addColumnToBoard(Long boardId, BoardColumn column) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        // Инициализируем коллекции, чтобы избежать LazyInitializationException
        board.getColumns().forEach(existingColumn -> {
            existingColumn.getTasks().size(); // Принудительная инициализация задач
        });
        board.addColumn(column);
        return boardRepository.save(board);
    }

    public Board removeColumnFromBoard(Long boardId, Long columnId) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        BoardColumn column = board.getColumns().stream()
            .filter(c -> c.getId().equals(columnId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Column not found"));
        board.removeColumn(column);
        return boardRepository.save(board);
    }

    public Board moveColumnInBoard(Long boardId, Long columnId, int newPosition) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        BoardColumn column = board.getColumns().stream()
            .filter(c -> c.getId().equals(columnId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Column not found"));
        board.moveColumn(column, newPosition);
        return boardRepository.save(board);
    }

    public Board getBoardById(Long id) {
        return boardRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Board not found with id: " + id));
    }
}