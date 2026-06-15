package com.crm.module.notice.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_notice_read")
public class NoticeRead {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("notice_id")
    private Long noticeId;

    @TableField("user_id")
    private Long userId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("read_at")
    private LocalDateTime readAt;
}
