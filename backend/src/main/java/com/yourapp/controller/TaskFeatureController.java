package com.yourapp.controller;

import com.yourapp.model.*;
import com.yourapp.service.TimeTrackingService;
import com.yourapp.service.TaskLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskFeatureController {
    private final TimeTrackingService timeTrackingService;
    private final TaskLinkService taskLinkService;

    // Отслеживание времени
    @PostMapping("/{taskId}/time-tracking/start")
    public ResponseEntity<TimeTracking> startTimeTracking(
        @PathVariable Long taskId,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(timeTrackingService.startTimeTracking(taskId, user));
    }

    @PostMapping("/{taskId}/time-tracking/stop")
    public ResponseEntity<TimeTracking> stopTimeTracking(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeTrackingService.stopTimeTracking(taskId));
    }

    @PostMapping("/{taskId}/time-estimate")
    public ResponseEntity<TimeEstimate> updateTimeEstimate(
        @PathVariable Long taskId,
        @RequestBody Map<String, Integer> request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(timeTrackingService.updateTimeEstimate(
            taskId,
            request.get("estimatedMinutes"),
            user
        ));
    }

    @GetMapping("/{taskId}/time-tracking")
    public ResponseEntity<List<TimeTracking>> getTaskTimeTrackings(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeTrackingService.getTaskTimeTrackings(taskId));
    }

    @GetMapping("/{taskId}/time-estimate/latest")
    public ResponseEntity<TimeEstimate> getLatestTimeEstimate(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeTrackingService.getLatestTimeEstimate(taskId)
            .orElseThrow(() -> new RuntimeException("No time estimate found")));
    }

    @GetMapping("/{taskId}/time-spent")
    public ResponseEntity<Integer> getTotalTimeSpent(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeTrackingService.calculateTotalTimeSpent(taskId));
    }

    // Связи между задачами
    @PostMapping("/{sourceTaskId}/links/{targetTaskId}")
    public ResponseEntity<TaskLink> createTaskLink(
        @PathVariable Long sourceTaskId,
        @PathVariable Long targetTaskId,
        @RequestBody Map<String, String> request,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(taskLinkService.createTaskLink(
            sourceTaskId,
            targetTaskId,
            TaskLink.LinkType.valueOf(request.get("type")),
            user
        ));
    }

    @DeleteMapping("/{sourceTaskId}/links/{targetTaskId}")
    public ResponseEntity<Void> deleteTaskLink(
        @PathVariable Long sourceTaskId,
        @PathVariable Long targetTaskId
    ) {
        taskLinkService.deleteTaskLink(sourceTaskId, targetTaskId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{taskId}/outgoing-links")
    public ResponseEntity<List<TaskLink>> getTaskOutgoingLinks(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskLinkService.getTaskOutgoingLinks(taskId));
    }

    @GetMapping("/{taskId}/incoming-links")
    public ResponseEntity<List<TaskLink>> getTaskIncomingLinks(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskLinkService.getTaskIncomingLinks(taskId));
    }
} 