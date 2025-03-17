package com.yourapp.repository;

import com.yourapp.model.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
    // Дополнительные методы при необходимости
} 