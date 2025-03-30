package com.yourapp.mapper;

import com.yourapp.dto.TaskTemplateDTO;
import com.yourapp.model.TaskTemplate;
import com.yourapp.model.TaskType;
import com.yourapp.model.TaskStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface TaskTemplateMapper {
    @Mapping(target = "taskData.typeId", source = "type.id")
    @Mapping(target = "taskData.statusId", source = "status.id")
    @Mapping(target = "createdBy", source = "createdBy.id")
    @Mapping(target = "boardId", source = "board.id")
    TaskTemplateDTO toDTO(TaskTemplate template);

    @Mapping(target = "type.id", source = "taskData.typeId")
    @Mapping(target = "status.id", source = "taskData.statusId")
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "board", ignore = true)
    TaskTemplate toEntity(TaskTemplateDTO dto);

    @Mapping(target = "type.id", source = "taskData.typeId")
    @Mapping(target = "status.id", source = "taskData.statusId")
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "board", ignore = true)
    void updateEntity(@MappingTarget TaskTemplate template, TaskTemplateDTO dto);
} 