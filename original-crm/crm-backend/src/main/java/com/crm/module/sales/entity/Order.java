package com.crm.module.sales.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("sales_order")
public class Order {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long customerId;

    private Long employeeId;

    private BigDecimal totalAmount;

    private String status;

    private String remark;

    // DDL added fields
    private String orderNo;
    private java.time.LocalDate deliveryDate;
    private String shippingAddress;
    private String contactName;
    private String contactPhone;
    private String paymentMethod;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal paidAmount;
    private String invoiceStatus;
    private String deliveryStatus;
    private Long quotationId;
    private Long approvedBy;
    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
