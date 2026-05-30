package com.crm.module.schedule.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.schedule.entity.Schedule;
import com.crm.module.schedule.mapper.ScheduleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleMapper scheduleMapper;

    @GetMapping("/list")
    public Result<PageResult<Schedule>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String type) {
        Page<Schedule> p = new Page<>(page, size);
        LambdaQueryWrapper<Schedule> wrapper = new LambdaQueryWrapper<>();
        if (ownerId != null) wrapper.eq(Schedule::getOwnerId, ownerId);
        if (type != null) wrapper.eq(Schedule::getType, type);
        wrapper.orderByDesc(Schedule::getStartTime);
        p = scheduleMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/calendar")
    public Result<List<Schedule>> calendar(@RequestParam String start, @RequestParam String end) {
        LambdaQueryWrapper<Schedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(Schedule::getStartTime, LocalDateTime.parse(start + " 00:00:00", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .le(Schedule::getEndTime, LocalDateTime.parse(end + " 23:59:59", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return Result.success(scheduleMapper.selectList(wrapper));
    }

    @GetMapping("/{id}")
    public Result<Schedule> getById(@PathVariable Long id) {
        return Result.success(scheduleMapper.selectById(id));
    }

    @PostMapping
    public Result<Schedule> create(@RequestBody Schedule schedule) {
        schedule.setCreatedAt(LocalDateTime.now());
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleMapper.insert(schedule);
        return Result.success(schedule);
    }

    @PutMapping
    public Result<Schedule> update(@RequestBody Schedule schedule) {
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleMapper.updateById(schedule);
        return Result.success(schedule);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        scheduleMapper.deleteById(id);
        return Result.success();
    }

    @GetMapping("/team")
    public Result<List<Schedule>> teamSchedules() {
        LambdaQueryWrapper<Schedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Schedule::getIsPublic, 1).orderByAsc(Schedule::getStartTime);
        return Result.success(scheduleMapper.selectList(wrapper));
    }
}
