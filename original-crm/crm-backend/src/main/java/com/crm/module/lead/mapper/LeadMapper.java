package com.crm.module.lead.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.crm.module.lead.entity.Lead;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LeadMapper extends BaseMapper<Lead> {
}
