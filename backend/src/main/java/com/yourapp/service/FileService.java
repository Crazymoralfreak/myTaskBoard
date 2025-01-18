package com.yourapp.service;

import com.yourapp.model.File;
import com.yourapp.repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FileService {
    @Autowired
    private FileRepository fileRepository;

    public List<File> getAllFiles() {
        return fileRepository.findAll();
    }

    public Optional<File> getFileById(Long id) {
        return fileRepository.findById(id);
    }

    public File createFile(File file) {
        return fileRepository.save(file);
    }

    public File updateFile(Long id, File fileDetails) {
        File file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
        file.setFileName(fileDetails.getFileName());
        file.setFilePath(fileDetails.getFilePath());
        file.setFileType(fileDetails.getFileType());
        return fileRepository.save(file);
    }

    public void deleteFile(Long id) {
        fileRepository.deleteById(id);
    }
}