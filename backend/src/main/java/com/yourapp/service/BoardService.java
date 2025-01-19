package com.yourapp.service;

import com.yourapp.model.Board;
import com.yourapp.model.Column;
import com.yourapp.repository.BoardRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BoardService {
    private final BoardRepository boardRepository;

    public BoardService(BoardRepository boardRepository) {
        this.boardRepository = boardRepository;
    }

    public Board createBoard(Board board) {
        return boardRepository.save(board);
    }

    public List<Board> getUserBoards(Long userId) {
        return boardRepository.findByOwnerId(userId);
    }

    public Board updateBoard(Long id, Board boardDetails) {
        Board board = boardRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        
        board.setName(boardDetails.getName());
        board.setDescription(boardDetails.getDescription());
        board.setArchived(boardDetails.isArchived());
        return boardRepository.save(board);
    }

    public Board addColumnToBoard(Long boardId, Column column) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        board.addColumn(column);
        return boardRepository.save(board);
    }

    public Board removeColumnFromBoard(Long boardId, Long columnId) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        Column column = board.getColumns().stream()
            .filter(c -> c.getId().equals(columnId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Column not found"));
        board.removeColumn(column);
        return boardRepository.save(board);
    }

    public Board moveColumnInBoard(Long boardId, Long columnId, int newPosition) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        Column column = board.getColumns().stream()
            .filter(c -> c.getId().equals(columnId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Column not found"));
        board.moveColumn(column, newPosition);
        return boardRepository.save(board);
    }

    public Board archiveBoard(Long id) {
        Board board = boardRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        board.setArchived(true);
        return boardRepository.save(board);
    }

    public Board restoreBoard(Long id) {
        Board board = boardRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        board.setArchived(false);
        return boardRepository.save(board);
    }

    public void deleteBoard(Long id) {
        boardRepository.deleteById(id);
    }
}