package com.crm.module.delivery.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_delivery")
public class Delivery {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("delivery_no")
    private String deliveryNo;

    @TableField("order_id")
    private Long orderId;

    @TableField("customer_id")
    private Long customerId;

    @TableField("delivery_date")
    private LocalDate deliveryDate;

    private String carrier;

    @TableField("tracking_no")
    private String trackingNo;

    private String address;

    @TableField("contact_name")
    private String contactName;

    @TableField("contact_phone")
    private String contactPhone;

    private String status;
    private String remark;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
