package com.crm.module.customer.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("customer")
public class Customer {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String phone;

    private String email;

    private String gender;

    private Integer age;

    private String source;

    private String level;

    private Long ownerId;

    private Integer status;

    private String remark;

    // 扩展字段 (DDL新增)
    private String industry;
    private String companySize;
    private String address;
    private String website;
    private String avatar;
    private String sourceDetail;
    private String creditLevel;
    private Long mergedToId;
    private Integer protectDays;
    private LocalDateTime lastFollowAt;
    private LocalDateTime nextFollowAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
