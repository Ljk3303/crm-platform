package com.crm.module.contact.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.crm.module.contact.entity.Contact;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ContactMapper extends BaseMapper<Contact> {
}
