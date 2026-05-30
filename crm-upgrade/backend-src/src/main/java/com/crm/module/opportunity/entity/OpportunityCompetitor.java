package com.crm.module.opportunity.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_opportunity_competitor")
public class OpportunityCompetitor {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("opportunity_id")
    private Long opportunityId;

    @TableField("competitor_name")
    private String competitorName;

    private String strength;

    private String weakness;

    @TableField("our_advantage")
    private String ourAdvantage;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
