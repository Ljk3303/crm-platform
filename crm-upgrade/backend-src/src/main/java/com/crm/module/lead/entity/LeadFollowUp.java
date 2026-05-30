package com.crm.module.lead.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_lead_follow_up")
public class LeadFollowUp {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("lead_id")
    private Long leadId;

    private String content;

    @TableField("follow_type")
    private String followType;

    @TableField("employee_id")
    private Long employeeId;

    @TableField("next_plan")
    private String nextPlan;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
