package com.cova.taskmanager.service;

import com.cova.taskmanager.dto.TaskRequest;
import com.cova.taskmanager.dto.TaskResponse;
import com.cova.taskmanager.entity.Task;
import com.cova.taskmanager.entity.TaskStatus;
import com.cova.taskmanager.entity.User;
import com.cova.taskmanager.exception.ResourceNotFoundException;
import com.cova.taskmanager.repository.TaskRepository;
import com.cova.taskmanager.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(UserPrincipal principal, TaskStatus status, String search) {
        return taskRepository.findByUserFiltered(principal.getId(), status, search)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    @Transactional
    public TaskResponse createTask(UserPrincipal principal, TaskRequest request) {
        User user = principal.getUser();
        Task task = new Task();
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO);
        task.setUser(user);
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(UserPrincipal principal, Long id, TaskRequest request) {
        Task task = taskRepository.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UserPrincipal principal, Long id) {
        Task task = taskRepository.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        taskRepository.delete(task);
    }
}
