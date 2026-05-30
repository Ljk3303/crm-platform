package com.crm.module.contact.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_contact")
public class Contact {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("customer_id")
    private Long customerId;

    private String name;

    private String department;

    private String position;

    private String phone;

    private String email;

    private String wechat;

    private String qq;

    private String gender;

    @TableField("decision_role")
    private String decisionRole;

    @TableField("is_primary")
    private Integer isPrimary;

    private String remark;

    private Integer status = 1;

    @TableField("created_by")
    private Long createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
