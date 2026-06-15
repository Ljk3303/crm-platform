package com.crm.module.service.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_service_ticket_log")
public class ServiceTicketLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("ticket_id")
    private Long ticketId;

    @TableField("action_type")
    private String actionType;

    private String content;

    @TableField("employee_id")
    private Long employeeId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
