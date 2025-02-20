package com.yourapp.dto;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateBoardRequest {
    private String name;
    private String description;
} 