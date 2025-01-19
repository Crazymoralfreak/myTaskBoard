package com.yourapp.service;

import com.yourapp.model.Board;
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
        return boardRepository.save(board);
    }

    public void deleteBoard(Long id) {
        boardRepository.deleteById(id);
    }
}