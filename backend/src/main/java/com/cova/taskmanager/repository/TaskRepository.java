package com.cova.taskmanager.repository;

import com.cova.taskmanager.entity.Task;
import com.cova.taskmanager.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
            SELECT t FROM Task t
            WHERE t.user.id = :userId
              AND (:status IS NULL OR t.status = :status)
              AND (
                :search IS NULL OR :search = '' OR
                LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            ORDER BY t.updatedAt DESC
            """)
    List<Task> findByUserFiltered(
            @Param("userId") Long userId,
            @Param("status") TaskStatus status,
            @Param("search") String search
    );

    Optional<Task> findByIdAndUserId(Long id, Long userId);
}
