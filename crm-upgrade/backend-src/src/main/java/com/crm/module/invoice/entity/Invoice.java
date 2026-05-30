package com.crm.module.invoice.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_invoice")
public class Invoice {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("invoice_no")
    private String invoiceNo;

    @TableField("order_id")
    private Long orderId;

    @TableField("customer_id")
    private Long customerId;

    @TableField("invoice_type")
    private String invoiceType;

    @TableField("invoice_title")
    private String invoiceTitle;

    @TableField("tax_number")
    private String taxNumber;

    private BigDecimal amount;
    private String status;

    @TableField("apply_date")
    private LocalDate applyDate;

    @TableField("issue_date")
    private LocalDate issueDate;

    private String remark;

    @TableField("created_by")
    private Long createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
