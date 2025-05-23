package com.yourapp.controller;

import com.yourapp.dto.TaskTemplateDTO;
import com.yourapp.mapper.TaskTemplateMapper;
import com.yourapp.model.TaskTemplate;
import com.yourapp.model.User;
import com.yourapp.service.TaskTemplateService;
import com.yourapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskTemplateController {
    private final TaskTemplateService taskTemplateService;
    private final TaskTemplateMapper taskTemplateMapper;
    private final UserService userService;

    @GetMapping("/boards/{boardId}/templates")
    public ResponseEntity<List<TaskTemplateDTO>> getBoardTemplates(@PathVariable String boardId) {
        List<TaskTemplateDTO> templates = 
            taskTemplateService.getBoardTemplates(boardId).stream()
                .map(TaskTemplateDTO::fromEntity)
                .toList();
                
        return ResponseEntity.ok(templates);
    }

    @PostMapping("/boards/{boardId}/templates")
    public ResponseEntity<TaskTemplateDTO> createTemplate(
        @PathVariable String boardId,
        @RequestBody TaskTemplate template,
        @AuthenticationPrincipal User currentUser
    ) {
        var savedTemplate = taskTemplateService.createTemplate(template, boardId, currentUser);
        return ResponseEntity.ok(TaskTemplateDTO.fromEntity(savedTemplate));
    }

    @PutMapping("/templates/{templateId}")
    public ResponseEntity<TaskTemplateDTO> updateTemplate(
            @PathVariable Long templateId,
            @RequestBody TaskTemplateDTO templateDTO) {
        var template = taskTemplateService.getTemplate(templateId);
        taskTemplateMapper.updateEntity(template, templateDTO);
        var updatedTemplate = taskTemplateService.updateTemplate(templateId, template);
        return ResponseEntity.ok(taskTemplateMapper.toDTO(updatedTemplate));
    }

    @DeleteMapping("/templates/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long templateId) {
        taskTemplateService.deleteTemplate(templateId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<TaskTemplateDTO> getTemplate(@PathVariable Long templateId) {
        return ResponseEntity.ok(
            taskTemplateMapper.toDTO(taskTemplateService.getTemplate(templateId))
        );
    }

    @GetMapping("/users/{userId}/templates")
    public ResponseEntity<List<TaskTemplateDTO>> getUserTemplates(@PathVariable Long userId) {
        return ResponseEntity.ok(
            taskTemplateService.getUserTemplates(userId).stream()
                .map(taskTemplateMapper::toDTO)
                .collect(Collectors.toList())
        );
    }
} 