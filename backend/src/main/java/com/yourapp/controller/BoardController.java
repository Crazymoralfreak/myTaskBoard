package com.yourapp.controller;

import com.yourapp.model.Board;
import com.yourapp.service.BoardService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/boards")
public class BoardController {
    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @PostMapping
    public Board createBoard(@RequestBody Board board) {
        return boardService.createBoard(board);
    }

    @GetMapping("/user/{userId}")
    public List<Board> getUserBoards(@PathVariable Long userId) {
        return boardService.getUserBoards(userId);
    }

    @PutMapping("/{id}")
    public Board updateBoard(@PathVariable Long id, @RequestBody Board board) {
        return boardService.updateBoard(id, board);
    }

    @PatchMapping("/{id}/archive")
    public Board archiveBoard(@PathVariable Long id) {
        return boardService.archiveBoard(id);
    }

    @PatchMapping("/{id}/restore")
    public Board restoreBoard(@PathVariable Long id) {
        return boardService.restoreBoard(id);
    }

    @DeleteMapping("/{id}")
    public void deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
    }
}