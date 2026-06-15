package com.crm.module.service.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_service_ticket")
public class ServiceTicket {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("ticket_no")
    private String ticketNo;

    @TableField("request_id")
    private Long requestId;

    private String title;
    private String description;

    @TableField("assignee_id")
    private Long assigneeId;

    private String status;
    private String resolution;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("start_at")
    private LocalDateTime startAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("end_at")
    private LocalDateTime endAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
