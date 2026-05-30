package com.crm.module.approval.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_approval_record")
public class ApprovalRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("flow_id")
    private Long flowId;

    @TableField("business_type")
    private String businessType;

    @TableField("business_id")
    private Long businessId;

    @TableField("current_step")
    private Integer currentStep;

    @TableField("approver_id")
    private Long approverId;

    private String comment;
    private String action;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
