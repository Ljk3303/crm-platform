package com.crm.module.service.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_service_request")
public class ServiceRequest {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("request_no")
    private String requestNo;

    @TableField("customer_id")
    private Long customerId;

    @TableField("contact_id")
    private Long contactId;

    private String type;
    private String title;
    private String description;
    private String priority;
    private String status;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("satisfaction_score")
    private Integer satisfactionScore;

    private String resolution;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
