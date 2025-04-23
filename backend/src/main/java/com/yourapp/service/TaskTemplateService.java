package com.yourapp.service;

import com.yourapp.model.TaskTemplate;
import com.yourapp.model.Board;
import com.yourapp.model.User;
import com.yourapp.repository.TaskTemplateRepository;
import com.yourapp.repository.BoardRepository;
import com.yourapp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskTemplateService {
    private final TaskTemplateRepository taskTemplateRepository;
    private final BoardRepository boardRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    public TaskTemplate createTemplate(TaskTemplate template, String boardId, User currentUser) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        
        template.setBoard(board);
        template.setCreatedBy(currentUser);
        return taskTemplateRepository.save(template);
    }

    public TaskTemplate updateTemplate(Long templateId, TaskTemplate templateDetails) {
        TaskTemplate template = taskTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        
        template.setName(templateDetails.getName());
        template.setDescription(templateDetails.getDescription());
        template.setType(templateDetails.getType());
        template.setStatus(templateDetails.getStatus());
        template.setTags(templateDetails.getTags());
        
        return taskTemplateRepository.save(template);
    }

    public void deleteTemplate(Long templateId) {
        taskTemplateRepository.deleteById(templateId);
    }

    @SuppressWarnings("unchecked")
    @Transactional(readOnly = true)
    public List<TaskTemplate> getBoardTemplates(String boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
                
        return taskTemplateRepository.findByBoardId(boardId);
    }

    public List<TaskTemplate> getUserTemplates(Long userId) {
        return taskTemplateRepository.findByCreatedById(userId);
    }

    public TaskTemplate getTemplate(Long templateId) {
        return taskTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
    }
} 