package com.crm.module.delivery.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("crm_delivery_item")
public class DeliveryItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("delivery_id")
    private Long deliveryId;

    @TableField("order_item_id")
    private Long orderItemId;

    @TableField("product_id")
    private Long productId;

    @TableField("product_name")
    private String productName;

    private BigDecimal quantity;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
