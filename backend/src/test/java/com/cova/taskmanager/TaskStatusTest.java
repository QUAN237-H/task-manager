package com.cova.taskmanager;

import com.cova.taskmanager.entity.TaskStatus;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class TaskStatusTest {

    @Test
    void statusesExist() {
        assertEquals("TODO", TaskStatus.TODO.name());
        assertEquals("IN_PROGRESS", TaskStatus.IN_PROGRESS.name());
        assertEquals("DONE", TaskStatus.DONE.name());
    }
}
