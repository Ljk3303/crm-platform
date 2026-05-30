package com.crm.module.lead.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_lead")
public class Lead {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String source;

    @TableField("contact_name")
    private String contactName;

    @TableField("contact_phone")
    private String contactPhone;

    @TableField("contact_email")
    private String contactEmail;

    @TableField("company_name")
    private String companyName;

    private String industry;

    private String description;

    @TableField("owner_id")
    private Long ownerId;

    private Integer status;

    @TableField("convert_customer_id")
    private Long convertCustomerId;

    @TableField("convert_opportunity_id")
    private Long convertOpportunityId;

    @TableField("follow_count")
    private Integer followCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("last_follow_at")
    private LocalDateTime lastFollowAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("next_follow_at")
    private LocalDateTime nextFollowAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
