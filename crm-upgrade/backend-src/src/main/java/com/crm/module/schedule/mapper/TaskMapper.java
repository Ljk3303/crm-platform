package com.crm.module.schedule.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.crm.module.schedule.entity.Task;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TaskMapper extends BaseMapper<Task> {
}
