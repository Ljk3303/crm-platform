package com.crm.module.schedule.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("crm_task")
public class Task {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;
    private String description;
    private String type;
    private String priority;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("related_type")
    private String relatedType;

    @TableField("related_id")
    private Long relatedId;

    @TableField("start_date")
    private LocalDate startDate;

    @TableField("due_date")
    private LocalDate dueDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("completed_at")
    private LocalDateTime completedAt;

    private String status;

    @TableField("parent_id")
    private Long parentId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
