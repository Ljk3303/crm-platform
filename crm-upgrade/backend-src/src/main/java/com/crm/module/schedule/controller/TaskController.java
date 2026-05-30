package com.crm.module.schedule.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.schedule.entity.Task;
import com.crm.module.schedule.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskMapper taskMapper;

    @GetMapping("/list")
    public Result<PageResult<Task>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status) {
        Page<Task> p = new Page<>(page, size);
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        if (ownerId != null) wrapper.eq(Task::getOwnerId, ownerId);
        if (priority != null) wrapper.eq(Task::getPriority, priority);
        if (status != null) wrapper.eq(Task::getStatus, status);
        wrapper.orderByDesc(Task::getCreatedAt);
        p = taskMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Task> getById(@PathVariable Long id) {
        return Result.success(taskMapper.selectById(id));
    }

    @PostMapping
    public Result<Task> create(@RequestBody Task task) {
        if (task.getStatus() == null) task.setStatus("PENDING");
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.insert(task);
        return Result.success(task);
    }

    @PutMapping
    public Result<Task> update(@RequestBody Task task) {
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.updateById(task);
        return Result.success(task);
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Task task = taskMapper.selectById(id);
        if (task != null) {
            task.setStatus(body.get("status"));
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.updateById(task);
        }
        return Result.success();
    }

    @PutMapping("/{id}/complete")
    public Result<Void> complete(@PathVariable Long id) {
        Task task = taskMapper.selectById(id);
        if (task != null) {
            task.setStatus("COMPLETED");
            task.setCompletedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.updateById(task);
        }
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        taskMapper.deleteById(id);
        return Result.success();
    }
}
