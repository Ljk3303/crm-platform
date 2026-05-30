package com.crm.module.quotation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.crm.module.quotation.entity.Order;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderMapper extends BaseMapper<Order> {
}
