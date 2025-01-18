package com.yourapp.controller;

import com.yourapp.model.File;
import com.yourapp.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {
    @Autowired
    private FileService fileService;

    @GetMapping
    public List<File> getAllFiles() {
        return fileService.getAllFiles();
    }

    @GetMapping("/{id}")
    public File getFileById(@PathVariable Long id) {
        return fileService.getFileById(id).orElseThrow(() -> new RuntimeException("File not found"));
    }

    @PostMapping
    public File createFile(@RequestBody File file) {
        return fileService.createFile(file);
    }

    @PutMapping("/{id}")
    public File updateFile(@PathVariable Long id, @RequestBody File fileDetails) {
        return fileService.updateFile(id, fileDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteFile(@PathVariable Long id) {
        fileService.deleteFile(id);
    }
}