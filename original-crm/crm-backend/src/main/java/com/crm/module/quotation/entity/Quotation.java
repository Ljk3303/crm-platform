package com.crm.module.quotation.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_quotation")
public class Quotation {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("quotation_no")
    private String quotationNo;

    @TableField("customer_id")
    private Long customerId;

    @TableField("contact_id")
    private Long contactId;

    @TableField("opportunity_id")
    private Long opportunityId;

    @TableField("template_id")
    private Long templateId;

    @TableField("total_amount")
    private BigDecimal totalAmount;

    @TableField("discount_rate")
    private BigDecimal discountRate;

    @TableField("discount_amount")
    private BigDecimal discountAmount;

    @TableField("tax_rate")
    private BigDecimal taxRate;

    @TableField("tax_amount")
    private BigDecimal taxAmount;

    @TableField("final_amount")
    private BigDecimal finalAmount;

    @TableField("valid_until")
    private LocalDate validUntil;

    private String description;

    @TableField("owner_id")
    private Long ownerId;

    private Integer status;

    @TableField("approval_id")
    private Long approvalId;

    @TableField("order_id")
    private Long orderId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
