package com.crm.module.receivable.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_receivable_record")
public class ReceivableRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("order_id")
    private Long orderId;

    @TableField("plan_id")
    private Long planId;

    private BigDecimal amount;

    @TableField("payment_method")
    private String paymentMethod;

    @TableField("payment_date")
    private LocalDate paymentDate;

    private String payer;
    private String remark;

    @TableField("created_by")
    private Long createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
