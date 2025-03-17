package com.yourapp.service;

import com.yourapp.model.Board;
import com.yourapp.model.BoardColumn;
import com.yourapp.model.TaskStatus;
import com.yourapp.model.TaskType;
import com.yourapp.exception.ResourceNotFoundException;
import com.yourapp.repository.BoardRepository;
import com.yourapp.repository.TaskStatusRepository;
import com.yourapp.repository.TaskTypeRepository;
import com.yourapp.repository.BoardColumnRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Arrays;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {
    private static final Logger logger = LoggerFactory.getLogger(BoardService.class);
    private final BoardRepository boardRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final TaskTypeRepository taskTypeRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final EntityManager entityManager;
    
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
        
        for (TaskStatus status : defaultStatuses) {
            board.addTaskStatus(status);
        }
        
        // Добавляем дефолтные типы задач
        List<TaskType> defaultTypes = Arrays.asList(
            TaskType.builder()
                .name("Task")
                .color("#4169E1")
                .icon("task_alt")
                .isDefault(true)
                .position(0)
                .build(),
            TaskType.builder()
                .name("Bug")
                .color("#FF6347")
                .icon("bug_report")
                .isDefault(true)
                .position(1)
                .build(),
            TaskType.builder()
                .name("Feature")
                .color("#32CD32")
                .icon("lightbulb")
                .isDefault(true)
                .position(2)
                .build()
        );
        
        for (TaskType type : defaultTypes) {
            board.addTaskType(type);
        }
        
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
            
        // Инициализируем коллекции, чтобы избежать LazyInitializationException
        board.getColumns().forEach(existingColumn -> {
            if (existingColumn.getTasks() != null) {
                existingColumn.getTasks().size(); // Принудительная инициализация задач
            }
        });
        
        BoardColumn column = board.getColumns().stream()
            .filter(c -> c.getId().equals(columnId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Column not found"));
            
        board.removeColumn(column);
        return boardRepository.save(board);
    }

    @Transactional
    public Board moveColumnInBoard(Long boardId, Long columnId, int newPosition) {
        try {
            logger.debug("Начало перемещения колонки {} в позицию {} на доске {}", columnId, newPosition, boardId);
            Board board = getBoardById(boardId);
            
            BoardColumn column = board.getColumns().stream()
                    .filter(c -> c.getId().equals(columnId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + columnId));
            
            logger.debug("Найдена колонка: {}, текущая позиция: {}", column.getName(), column.getPosition());
            logger.debug("Текущие позиции колонок на доске: {}", 
                board.getColumns().stream()
                    .map(c -> String.format("%s (id:%d, pos:%d)", c.getName(), c.getId(), c.getPosition()))
                    .collect(Collectors.joining(", ")));
            
            // Проверяем, что новая позиция корректна
            int totalColumns = board.getColumns().size();
            if (newPosition < 0 || newPosition >= totalColumns) {
                logger.error("Некорректная позиция: {}, допустимый диапазон: 0-{}", newPosition, totalColumns - 1);
                throw new IllegalArgumentException("Invalid position");
            }
            
            try {
                // Запоминаем исходные позиции колонок перед изменением
                Map<Long, Integer> originalPositions = board.getColumns().stream()
                    .collect(Collectors.toMap(BoardColumn::getId, BoardColumn::getPosition));
                
                // Перемещаем колонку
                board.moveColumn(column, newPosition);
                
                logger.debug("Колонка перемещена, обновляем позиции в базе данных");
                logger.debug("Новые позиции колонок перед сохранением: {}", 
                    board.getColumns().stream()
                        .map(c -> String.format("%s (id:%d, pos:%d)", c.getName(), c.getId(), c.getPosition()))
                        .collect(Collectors.joining(", ")));
                
                // Обновляем позиции всех колонок по отдельности
                boolean anyChanges = false;
                for (BoardColumn col : board.getColumns()) {
                    Integer originalPosition = originalPositions.get(col.getId());
                    if (originalPosition == null || originalPosition != col.getPosition()) {
                        logger.debug("Обновляем колонку id:{} с позиции {} на {}", 
                            col.getId(), originalPosition, col.getPosition());
                        boardColumnRepository.save(col);
                        anyChanges = true;
                    }
                }
                
                if (!anyChanges) {
                    logger.debug("Позиции колонок не изменились, сохранение не требуется");
                }
                
                // Явно сохраняем и фиксируем изменения
                boardRepository.saveAndFlush(board);
                entityManager.flush();
                
                // Получаем обновленный экземпляр доски из БД
                Board refreshedBoard = boardRepository.findById(boardId)
                    .orElseThrow(() -> new ResourceNotFoundException("Board not found with id: " + boardId));
                
                // Проверяем, что изменения сохранились
                BoardColumn updatedColumn = refreshedBoard.getColumns().stream()
                        .filter(c -> c.getId().equals(columnId))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Column not found after save"));
                
                logger.debug("Колонка после обновления: id:{}, позиция {}", updatedColumn.getId(), updatedColumn.getPosition());
                logger.debug("Финальные позиции колонок: {}", 
                    refreshedBoard.getColumns().stream()
                        .map(c -> String.format("%s (id:%d, pos:%d)", c.getName(), c.getId(), c.getPosition()))
                        .collect(Collectors.joining(", ")));
                
                return refreshedBoard;
            } catch (Exception e) {
                logger.error("Ошибка при перемещении колонки: {}", e.getMessage(), e);
                throw e;
            }
        } catch (Exception e) {
            logger.error("Ошибка в методе moveColumnInBoard: {}", e.getMessage(), e);
            throw e;
        }
    }

    public Board getBoardById(Long id) {
        Board board = boardRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Board not found with id: " + id));
            
        // Убедимся, что колонки отсортированы по позиции
        List<BoardColumn> sortedColumns = board.getColumns().stream()
            .sorted(Comparator.comparing(BoardColumn::getPosition))
            .collect(Collectors.toList());
        board.getColumns().clear();
        board.getColumns().addAll(sortedColumns);
        
        return board;
    }

    @Transactional
    public Board updateColumn(Long boardId, Long columnId, String newName, String newColor) {
        Board board = getBoardById(boardId);
        
        // Инициализируем коллекции, чтобы избежать LazyInitializationException
        board.getColumns().forEach(existingColumn -> {
            if (existingColumn.getTasks() != null) {
                existingColumn.getTasks().size(); // Принудительная инициализация задач
            }
        });
        
        BoardColumn column = board.getColumns().stream()
            .filter(c -> c.getId().equals(columnId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Column not found"));
        
        column.setName(newName);
        if (newColor != null) {
            column.setColor(newColor);
        }
        return boardRepository.save(board);
    }

    @Transactional
    public TaskStatus createTaskStatus(Long boardId, TaskStatus status) {
        Board board = getBoardById(boardId);
        
        // Устанавливаем только те поля, которые не установлены
        if (status.getPosition() == null) {
            status.setPosition(board.getTaskStatuses().size());
        }
        
        // Явно устанавливаем флаги для пользовательского статуса
        status.setCustom(true);
        status.setDefault(false);
        
        board.addTaskStatus(status);
        boardRepository.save(board);
        
        logger.debug("Создан новый статус задачи: id={}, name={}, position={}, isCustom={}, isDefault={}", 
            status.getId(), status.getName(), status.getPosition(), status.isCustom(), status.isDefault());
            
        return status;
    }

    @Transactional
    public TaskStatus updateTaskStatus(Long boardId, Long statusId, TaskStatus statusDetails) {
        Board board = getBoardById(boardId);
        TaskStatus status = board.getTaskStatuses().stream()
            .filter(s -> s.getId().equals(statusId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Status not found"));
        
        // Проверяем, что мы обновляем тот же статус, который получили
        // Это важно для предотвращения дублирования записей
        if (statusDetails != status) {
            status.setName(statusDetails.getName());
            status.setColor(statusDetails.getColor());
            
            // Обновляем позицию только если она указана
            if (statusDetails.getPosition() != null) {
                status.setPosition(statusDetails.getPosition());
            }
            
            // Обновляем флаги только если они указаны
            status.setDefault(statusDetails.isDefault());
            status.setCustom(statusDetails.isCustom());
        }
        
        logger.debug("Обновляем статус задачи: id={}, name={}, position={}, isCustom={}, isDefault={}", 
            status.getId(), status.getName(), status.getPosition(), status.isCustom(), status.isDefault());
            
        return taskStatusRepository.save(status);
    }

    @Transactional
    public void deleteTaskStatus(Long boardId, Long statusId) {
        Board board = getBoardById(boardId);
        TaskStatus status = board.getTaskStatuses().stream()
            .filter(s -> s.getId().equals(statusId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Status not found"));
        
        // Проверяем, есть ли задачи с этим статусом
        if (!status.getTasks().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete status with assigned tasks");
        }
        
        board.removeTaskStatus(status);
        boardRepository.save(board);
        taskStatusRepository.delete(status);
    }

    @Transactional
    public TaskType createTaskType(Long boardId, TaskType type) {
        Board board = getBoardById(boardId);
        
        // Устанавливаем только те поля, которые не установлены
        if (type.getPosition() == null) {
            type.setPosition(board.getTaskTypes().size());
        }
        
        // Явно устанавливаем флаги для пользовательского типа
        type.setCustom(true);
        type.setDefault(false);
        
        board.addTaskType(type);
        boardRepository.save(board);
        
        logger.debug("Создан новый тип задачи: id={}, name={}, position={}, isCustom={}, isDefault={}", 
            type.getId(), type.getName(), type.getPosition(), type.isCustom(), type.isDefault());
            
        return type;
    }

    @Transactional
    public TaskType updateTaskType(Long boardId, Long typeId, TaskType typeDetails) {
        Board board = getBoardById(boardId);
        TaskType type = board.getTaskTypes().stream()
            .filter(t -> t.getId().equals(typeId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Task type not found"));
        
        // Проверяем, что мы обновляем тот же тип, который получили
        // Это важно для предотвращения дублирования записей
        if (typeDetails != type) {
            type.setName(typeDetails.getName());
            type.setColor(typeDetails.getColor());
            
            // Обновляем позицию только если она указана
            if (typeDetails.getPosition() != null) {
                type.setPosition(typeDetails.getPosition());
            }
            
            // Обновляем флаги
            type.setDefault(typeDetails.isDefault());
            type.setCustom(typeDetails.isCustom());
            
            // Обновляем иконку только если она указана
            if (typeDetails.getIcon() != null && !typeDetails.getIcon().isEmpty()) {
                type.setIcon(typeDetails.getIcon());
            }
        }
        
        logger.debug("Обновляем тип задачи: id={}, name={}, position={}, isCustom={}, isDefault={}", 
            type.getId(), type.getName(), type.getPosition(), type.isCustom(), type.isDefault());
            
        return taskTypeRepository.save(type);
    }

    @Transactional
    public void deleteTaskType(Long boardId, Long typeId) {
        Board board = getBoardById(boardId);
        TaskType type = board.getTaskTypes().stream()
            .filter(t -> t.getId().equals(typeId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Task type not found"));
        
        // Проверяем, есть ли задачи с этим типом
        if (!type.getTasks().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete task type with assigned tasks");
        }
        
        board.removeTaskType(type);
        boardRepository.save(board);
        taskTypeRepository.delete(type);
    }

    public List<TaskStatus> getBoardStatuses(Long boardId) {
        Board board = getBoardById(boardId);
        return board.getTaskStatuses().stream().sorted(Comparator.comparing(TaskStatus::getPosition)).collect(Collectors.toList());
    }

    public TaskStatus getTaskStatusById(Long statusId) {
        return taskStatusRepository.findById(statusId)
            .orElseThrow(() -> new ResourceNotFoundException("TaskStatus not found with id: " + statusId));
    }

    public List<TaskType> getBoardTaskTypes(Long boardId) {
        Board board = getBoardById(boardId);
        return board.getTaskTypes().stream().sorted(Comparator.comparing(TaskType::getPosition)).collect(Collectors.toList());
    }
    
    public TaskType getTaskTypeById(Long typeId) {
        return taskTypeRepository.findById(typeId)
            .orElseThrow(() -> new ResourceNotFoundException("TaskType not found with id: " + typeId));
    }
}
