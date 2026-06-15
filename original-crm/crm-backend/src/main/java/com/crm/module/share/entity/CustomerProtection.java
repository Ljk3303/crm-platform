package com.crm.module.share.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_customer_protection")
public class CustomerProtection {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    @TableField("protect_days")
    private Integer protectDays;

    @TableField("is_auto_recycle")
    private Integer isAutoRecycle;

    @TableField("reminder_days")
    private Integer reminderDays;

    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
