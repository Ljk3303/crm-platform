package com.crm.module.product.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("crm_product")
public class Product {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;

    private String name;

    private String model;

    private String unit;

    private String category;

    private BigDecimal price;

    @TableField("cost_price")
    private BigDecimal costPrice;

    private String description;

    private String specification;

    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
