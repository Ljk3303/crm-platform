package com.crm.module.schedule.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.schedule.entity.Schedule;
import com.crm.module.schedule.mapper.ScheduleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleMapper scheduleMapper;

    public PageResult<Schedule> list(Integer page, Integer size, Long ownerId, String type, String startDate, String endDate) {
        Page<Schedule> p = new Page<>(page, size);
        LambdaQueryWrapper<Schedule> wrapper = Wrappers.lambdaQuery();
        if (ownerId != null) wrapper.eq(Schedule::getOwnerId, ownerId);
        if (StringUtils.hasText(type)) wrapper.eq(Schedule::getType, type);
        if (StringUtils.hasText(startDate) && StringUtils.hasText(endDate)) {
            wrapper.between(Schedule::getStartTime, LocalDateTime.parse(startDate), LocalDateTime.parse(endDate));
        }
        wrapper.orderByAsc(Schedule::getStartTime);
        Page<Schedule> result = scheduleMapper.selectPage(p, wrapper);
        return new PageResult(result.getTotal(), page, size, result.getRecords());
    }

    public List<Schedule> calendar(String start, String end) {
        return scheduleMapper.selectList(
                Wrappers.<Schedule>lambdaQuery()
                        .ge(Schedule::getStartTime, LocalDateTime.parse(start))
                        .le(Schedule::getEndTime, LocalDateTime.parse(end))
                        .orderByAsc(Schedule::getStartTime));
    }

    public Schedule getById(Long id) {
        return scheduleMapper.selectById(id);
    }

    @Transactional
    public Schedule create(Schedule schedule) {
        schedule.setCreatedAt(LocalDateTime.now());
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleMapper.insert(schedule);
        return schedule;
    }

    @Transactional
    public Schedule update(Schedule schedule) {
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleMapper.updateById(schedule);
        return schedule;
    }

    @Transactional
    public void delete(Long id) {
        scheduleMapper.deleteById(id);
    }

    public List<Schedule> teamSchedules() {
        return scheduleMapper.selectList(
                Wrappers.<Schedule>lambdaQuery().eq(Schedule::getIsPublic, 1).orderByAsc(Schedule::getStartTime));
    }
}
