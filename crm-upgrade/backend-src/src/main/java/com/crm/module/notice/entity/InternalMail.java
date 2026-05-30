package com.crm.module.notice.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_internal_mail")
public class InternalMail {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;
    private String content;

    @TableField("sender_id")
    private Long senderId;

    @TableField("receiver_id")
    private Long receiverId;

    @TableField("is_read")
    private Integer isRead;

    @TableField("is_starred")
    private Integer isStarred;

    @TableField("parent_id")
    private Long parentId;

    private String type;

    @TableField("related_type")
    private String relatedType;

    @TableField("related_id")
    private Long relatedId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
