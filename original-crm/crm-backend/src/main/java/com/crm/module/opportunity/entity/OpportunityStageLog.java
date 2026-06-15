package com.crm.module.opportunity.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_opportunity_stage_log")
public class OpportunityStageLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("opportunity_id")
    private Long opportunityId;

    @TableField("from_stage")
    private String fromStage;

    @TableField("to_stage")
    private String toStage;

    private String content;

    @TableField("employee_id")
    private Long employeeId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
