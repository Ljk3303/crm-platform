package com.crm.module.opportunity.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_opportunity_team")
public class OpportunityTeam {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("opportunity_id")
    private Long opportunityId;

    @TableField("user_id")
    private Long userId;

    private String role;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
