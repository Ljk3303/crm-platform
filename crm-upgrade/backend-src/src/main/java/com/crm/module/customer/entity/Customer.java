package com.crm.module.customer.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_customer")
public class Customer {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String phone;

    private String email;

    private String industry;

    private String source;

    private String address;

    private String website;

    private String description;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("created_by")
    private Long createdBy;

    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
