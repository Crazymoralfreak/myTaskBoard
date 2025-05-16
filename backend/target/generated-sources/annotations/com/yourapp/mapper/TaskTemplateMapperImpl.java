package com.yourapp.mapper;

import com.yourapp.dto.TaskTemplateDTO;
import com.yourapp.model.Board;
import com.yourapp.model.TaskStatus;
import com.yourapp.model.TaskTemplate;
import com.yourapp.model.TaskType;
import com.yourapp.model.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-05-16T13:00:40+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.42.0.z20250331-1358, environment: Java 21.0.6 (Eclipse Adoptium)"
)
@Component
public class TaskTemplateMapperImpl implements TaskTemplateMapper {

    @Override
    public TaskTemplateDTO toDTO(TaskTemplate template) {
        if ( template == null ) {
            return null;
        }

        TaskTemplateDTO taskTemplateDTO = new TaskTemplateDTO();

        if ( template.getType() != null ) {
            if ( taskTemplateDTO.getTaskData() == null ) {
                taskTemplateDTO.setTaskData( new TaskTemplateDTO.TaskDataDTO() );
            }
            taskTypeToTaskDataDTO( template.getType(), taskTemplateDTO.getTaskData() );
        }
        if ( template.getStatus() != null ) {
            if ( taskTemplateDTO.getTaskData() == null ) {
                taskTemplateDTO.setTaskData( new TaskTemplateDTO.TaskDataDTO() );
            }
            taskStatusToTaskDataDTO( template.getStatus(), taskTemplateDTO.getTaskData() );
        }
        taskTemplateDTO.setCreatedBy( templateCreatedById( template ) );
        taskTemplateDTO.setBoardId( templateBoardId( template ) );
        taskTemplateDTO.setId( template.getId() );
        taskTemplateDTO.setName( template.getName() );
        taskTemplateDTO.setDescription( template.getDescription() );

        return taskTemplateDTO;
    }

    @Override
    public TaskTemplate toEntity(TaskTemplateDTO dto) {
        if ( dto == null ) {
            return null;
        }

        TaskTemplate.TaskTemplateBuilder taskTemplate = TaskTemplate.builder();

        taskTemplate.type( taskDataDTOToTaskType( dto.getTaskData() ) );
        taskTemplate.status( taskDataDTOToTaskStatus( dto.getTaskData() ) );
        taskTemplate.description( dto.getDescription() );
        taskTemplate.id( dto.getId() );
        taskTemplate.name( dto.getName() );

        return taskTemplate.build();
    }

    @Override
    public void updateEntity(TaskTemplate template, TaskTemplateDTO dto) {
        if ( dto == null ) {
            return;
        }

        if ( dto.getTaskData() != null ) {
            if ( template.getType() == null ) {
                template.setType( TaskType.builder().build() );
            }
            taskDataDTOToTaskType1( dto.getTaskData(), template.getType() );
        }
        if ( dto.getTaskData() != null ) {
            if ( template.getStatus() == null ) {
                template.setStatus( TaskStatus.builder().build() );
            }
            taskDataDTOToTaskStatus1( dto.getTaskData(), template.getStatus() );
        }
        if ( dto.getId() != null ) {
            template.setId( dto.getId() );
        }
        if ( dto.getName() != null ) {
            template.setName( dto.getName() );
        }
        if ( dto.getDescription() != null ) {
            template.setDescription( dto.getDescription() );
        }
    }

    protected void taskTypeToTaskDataDTO(TaskType taskType, TaskTemplateDTO.TaskDataDTO mappingTarget) {
        if ( taskType == null ) {
            return;
        }

        if ( taskType.getId() != null ) {
            mappingTarget.setTypeId( taskType.getId() );
        }
    }

    protected void taskStatusToTaskDataDTO(TaskStatus taskStatus, TaskTemplateDTO.TaskDataDTO mappingTarget) {
        if ( taskStatus == null ) {
            return;
        }

        if ( taskStatus.getId() != null ) {
            mappingTarget.setStatusId( taskStatus.getId() );
        }
    }

    private Long templateCreatedById(TaskTemplate taskTemplate) {
        if ( taskTemplate == null ) {
            return null;
        }
        User createdBy = taskTemplate.getCreatedBy();
        if ( createdBy == null ) {
            return null;
        }
        Long id = createdBy.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String templateBoardId(TaskTemplate taskTemplate) {
        if ( taskTemplate == null ) {
            return null;
        }
        Board board = taskTemplate.getBoard();
        if ( board == null ) {
            return null;
        }
        String id = board.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    protected TaskType taskDataDTOToTaskType(TaskTemplateDTO.TaskDataDTO taskDataDTO) {
        if ( taskDataDTO == null ) {
            return null;
        }

        TaskType.TaskTypeBuilder taskType = TaskType.builder();

        taskType.id( taskDataDTO.getTypeId() );

        return taskType.build();
    }

    protected TaskStatus taskDataDTOToTaskStatus(TaskTemplateDTO.TaskDataDTO taskDataDTO) {
        if ( taskDataDTO == null ) {
            return null;
        }

        TaskStatus.TaskStatusBuilder taskStatus = TaskStatus.builder();

        taskStatus.id( taskDataDTO.getStatusId() );

        return taskStatus.build();
    }

    protected void taskDataDTOToTaskType1(TaskTemplateDTO.TaskDataDTO taskDataDTO, TaskType mappingTarget) {
        if ( taskDataDTO == null ) {
            return;
        }

        if ( taskDataDTO.getTypeId() != null ) {
            mappingTarget.setId( taskDataDTO.getTypeId() );
        }
    }

    protected void taskDataDTOToTaskStatus1(TaskTemplateDTO.TaskDataDTO taskDataDTO, TaskStatus mappingTarget) {
        if ( taskDataDTO == null ) {
            return;
        }

        if ( taskDataDTO.getStatusId() != null ) {
            mappingTarget.setId( taskDataDTO.getStatusId() );
        }
    }
}
