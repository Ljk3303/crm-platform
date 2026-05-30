package com.crm.module.service.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_service_visit")
public class ServiceVisit {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("request_id")
    private Long requestId;

    @TableField("plan_date")
    private LocalDate planDate;

    @TableField("actual_date")
    private LocalDate actualDate;

    private String content;

    @TableField("visitor_id")
    private Long visitorId;

    @TableField("satisfaction_score")
    private Integer satisfactionScore;

    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
