package com.crm.module.salesteam.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("crm_sales_team_member")
public class SalesTeamMember {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("team_id")
    private Long teamId;

    @TableField("user_id")
    private Long userId;

    private String role;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField("created_at")
    private LocalDateTime createdAt;
}
