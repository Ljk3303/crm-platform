package com.crm.module.opportunity.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_opportunity")
public class Opportunity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    @TableField("customer_id")
    private Long customerId;

    @TableField("contact_id")
    private Long contactId;

    private BigDecimal amount;

    @TableField("expected_close_date")
    private LocalDate expectedCloseDate;

    private String stage;

    @TableField("stage_order")
    private Integer stageOrder;

    private Integer probability;

    @TableField("competitor_info")
    private String competitorInfo;

    private String description;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("campaign_id")
    private Long campaignId;

    @TableField("lead_id")
    private Long leadId;

    @TableField("loss_reason")
    private String lossReason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
