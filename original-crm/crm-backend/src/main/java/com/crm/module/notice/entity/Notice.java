package com.crm.module.notice.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_notice")
public class Notice {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;
    private String content;
    private String type;
    private String level;

    @TableField("publisher_id")
    private Long publisherId;

    @TableField("is_top")
    private Integer isTop;

    @TableField("view_count")
    private Integer viewCount;

    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("published_at")
    private LocalDateTime publishedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
