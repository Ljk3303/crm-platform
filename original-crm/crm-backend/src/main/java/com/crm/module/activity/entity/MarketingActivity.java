package com.crm.module.activity.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_marketing_activity")
public class MarketingActivity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String type;

    private BigDecimal budget;

    @TableField("actual_cost")
    private BigDecimal actualCost;

    @TableField("start_date")
    private LocalDate startDate;

    @TableField("end_date")
    private LocalDate endDate;

    @TableField("owner_id")
    private Long ownerId;

    private String description;

    @TableField("target_description")
    private String targetDescription;

    private Integer status;

    @TableField("lead_count")
    private Integer leadCount;

    @TableField("opportunity_count")
    private Integer opportunityCount;

    @TableField("deal_amount")
    private BigDecimal dealAmount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
