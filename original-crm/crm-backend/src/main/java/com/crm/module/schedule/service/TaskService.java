package com.crm.module.schedule.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.schedule.entity.Task;
import com.crm.module.schedule.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskMapper taskMapper;

    public PageResult<Task> list(Integer page, Integer size, Long ownerId, String priority, String status, String relatedType) {
        Page<Task> p = new Page<>(page, size);
        LambdaQueryWrapper<Task> wrapper = Wrappers.lambdaQuery();
        if (ownerId != null) wrapper.eq(Task::getOwnerId, ownerId);
        if (StringUtils.hasText(priority)) wrapper.eq(Task::getPriority, priority);
        if (StringUtils.hasText(status)) wrapper.eq(Task::getStatus, status);
        if (StringUtils.hasText(relatedType)) wrapper.eq(Task::getRelatedType, relatedType);
        wrapper.orderByDesc(Task::getCreatedAt);
        Page<Task> result = taskMapper.selectPage(p, wrapper);
        return new PageResult(result.getTotal(), page, size, result.getRecords());
    }

    public Task getById(Long id) {
        return taskMapper.selectById(id);
    }

    @Transactional
    public Task create(Task task) {
        task.setStatus("待办");
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.insert(task);
        return task;
    }

    @Transactional
    public Task update(Task task) {
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.updateById(task);
        return task;
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        Task task = taskMapper.selectById(id);
        if (task != null) {
            task.setStatus(status);
            if ("已完成".equals(status)) {
                task.setCompletedAt(LocalDateTime.now());
            }
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.updateById(task);
        }
    }

    @Transactional
    public void complete(Long id) {
        updateStatus(id, "已完成");
    }

    @Transactional
    public void delete(Long id) {
        taskMapper.deleteById(id);
    }
}
