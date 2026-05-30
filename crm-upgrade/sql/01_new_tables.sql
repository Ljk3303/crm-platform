-- ============================================
-- CRM System Upgrade: New Tables
-- Database: crm_db
-- Charset: utf8mb4
-- Engine: InnoDB
-- ============================================

-- 1. 联系人表
CREATE TABLE `crm_contact` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '姓名',
  `department` VARCHAR(100) DEFAULT NULL COMMENT '部门',
  `position` VARCHAR(100) DEFAULT NULL COMMENT '职位',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '电话',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `wechat` VARCHAR(50) DEFAULT NULL COMMENT '微信',
  `qq` VARCHAR(20) DEFAULT NULL COMMENT 'QQ',
  `gender` TINYINT DEFAULT 0 COMMENT '性别: 0-未知 1-男 2-女',
  `decision_role` VARCHAR(20) DEFAULT NULL COMMENT '决策角色: 决策者/影响者/使用者/守门人',
  `is_primary` TINYINT DEFAULT 0 COMMENT '是否首要联系人: 0-否 1-是',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_email` (`email`),
  INDEX `idx_is_primary` (`is_primary`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系人表';

-- 2. 客户标签定义表
CREATE TABLE `crm_customer_tag` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(100) NOT NULL COMMENT '标签名称',
  `parent_id` BIGINT DEFAULT 0 COMMENT '父级标签ID, 0为顶级',
  `level` TINYINT DEFAULT 1 COMMENT '层级: 1/2/3',
  `color` VARCHAR(20) DEFAULT NULL COMMENT '标签颜色',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_level` (`level`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户标签定义表';

-- 3. 客户标签关联表
CREATE TABLE `crm_customer_tag_rel` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `tag_id` BIGINT NOT NULL COMMENT '标签ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_tag_id` (`tag_id`),
  UNIQUE INDEX `uk_customer_tag` (`customer_id`, `tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户标签关联表';

-- 4. 客户共享表
CREATE TABLE `crm_customer_share` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `from_user_id` BIGINT NOT NULL COMMENT '共享人ID',
  `to_user_id` BIGINT NOT NULL COMMENT '被共享人ID',
  `permission` VARCHAR(20) NOT NULL DEFAULT '只读' COMMENT '权限: 只读/可编辑',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_from_user_id` (`from_user_id`),
  INDEX `idx_to_user_id` (`to_user_id`),
  UNIQUE INDEX `uk_customer_to_user` (`customer_id`, `to_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户共享表';

-- 5. 客户保护规则表
CREATE TABLE `crm_customer_protection` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `protect_days` INT NOT NULL DEFAULT 30 COMMENT '保护天数',
  `is_auto_recycle` TINYINT DEFAULT 1 COMMENT '是否自动回收: 0-否 1-是',
  `reminder_days` INT DEFAULT 3 COMMENT '提前提醒天数',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户保护规则表';

-- 6. 市场活动表
CREATE TABLE `crm_marketing_activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(200) NOT NULL COMMENT '活动名称',
  `type` VARCHAR(20) NOT NULL COMMENT '活动类型: 展会/线上推广/线下活动/邮件营销/其他',
  `budget` DECIMAL(15,2) DEFAULT 0.00 COMMENT '预算金额',
  `actual_cost` DECIMAL(15,2) DEFAULT 0.00 COMMENT '实际花费',
  `start_date` DATE DEFAULT NULL COMMENT '开始日期',
  `end_date` DATE DEFAULT NULL COMMENT '结束日期',
  `owner_id` BIGINT DEFAULT NULL COMMENT '负责人ID',
  `description` TEXT COMMENT '活动描述',
  `target_description` TEXT COMMENT '目标描述',
  `status` VARCHAR(20) NOT NULL DEFAULT '计划中' COMMENT '状态: 计划中/进行中/已完成/已取消',
  `lead_count` INT DEFAULT 0 COMMENT '产生线索数',
  `opportunity_count` INT DEFAULT 0 COMMENT '产生商机数',
  `deal_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT '成交金额',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_start_date` (`start_date`),
  INDEX `idx_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='市场活动表';

-- 7. 活动目标客户关联表
CREATE TABLE `crm_activity_target` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `activity_id` BIGINT NOT NULL COMMENT '活动ID',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_activity_id` (`activity_id`),
  INDEX `idx_customer_id` (`customer_id`),
  UNIQUE INDEX `uk_activity_customer` (`activity_id`, `customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动目标客户关联表';

-- 8. 活动费用表
CREATE TABLE `crm_activity_expense` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `activity_id` BIGINT NOT NULL COMMENT '活动ID',
  `expense_type` VARCHAR(50) NOT NULL COMMENT '费用类型',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '金额',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '费用描述',
  `expense_date` DATE NOT NULL COMMENT '费用日期',
  `payee` VARCHAR(100) DEFAULT NULL COMMENT '收款方',
  `status` VARCHAR(20) NOT NULL DEFAULT '待审批' COMMENT '状态: 待审批/已批准/已驳回',
  `approval_id` BIGINT DEFAULT NULL COMMENT '审批记录ID',
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_activity_id` (`activity_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_approval_id` (`approval_id`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动费用表';

-- 9. 线索表
CREATE TABLE `crm_lead` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(200) NOT NULL COMMENT '线索名称',
  `source` VARCHAR(20) DEFAULT NULL COMMENT '来源: 网站/电话/介绍/广告/其他',
  `contact_name` VARCHAR(100) DEFAULT NULL COMMENT '联系人姓名',
  `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '联系人电话',
  `contact_email` VARCHAR(100) DEFAULT NULL COMMENT '联系人邮箱',
  `company_name` VARCHAR(200) DEFAULT NULL COMMENT '公司名称',
  `industry` VARCHAR(100) DEFAULT NULL COMMENT '行业',
  `description` TEXT COMMENT '描述',
  `owner_id` BIGINT DEFAULT NULL COMMENT '负责人ID',
  `status` VARCHAR(20) NOT NULL DEFAULT '新建' COMMENT '状态: 新建/跟进中/已转化/无效',
  `convert_customer_id` BIGINT DEFAULT NULL COMMENT '转化客户ID',
  `convert_opportunity_id` BIGINT DEFAULT NULL COMMENT '转化商机ID',
  `follow_count` INT DEFAULT 0 COMMENT '跟进次数',
  `last_follow_at` DATETIME DEFAULT NULL COMMENT '最后跟进时间',
  `next_follow_at` DATETIME DEFAULT NULL COMMENT '下次跟进时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_source` (`source`),
  INDEX `idx_company_name` (`company_name`),
  INDEX `idx_contact_phone` (`contact_phone`),
  INDEX `idx_convert_customer_id` (`convert_customer_id`),
  INDEX `idx_convert_opportunity_id` (`convert_opportunity_id`),
  INDEX `idx_next_follow_at` (`next_follow_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索表';

-- 10. 线索跟进记录表
CREATE TABLE `crm_lead_follow_up` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `lead_id` BIGINT NOT NULL COMMENT '线索ID',
  `content` TEXT NOT NULL COMMENT '跟进内容',
  `follow_type` VARCHAR(20) DEFAULT NULL COMMENT '跟进方式: 电话/邮件/拜访/其他',
  `employee_id` BIGINT DEFAULT NULL COMMENT '跟进人ID',
  `next_plan` TEXT COMMENT '下一步计划',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_lead_id` (`lead_id`),
  INDEX `idx_employee_id` (`employee_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索跟进记录表';

-- 11. 商机表
CREATE TABLE `crm_opportunity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(200) NOT NULL COMMENT '商机名称',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `contact_id` BIGINT DEFAULT NULL COMMENT '联系人ID',
  `amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT '商机金额',
  `expected_close_date` DATE DEFAULT NULL COMMENT '预计成交日期',
  `stage` VARCHAR(20) NOT NULL DEFAULT '初步接触' COMMENT '阶段: 初步接触/需求分析/方案报价/谈判/赢单/输单',
  `stage_order` INT DEFAULT 1 COMMENT '阶段顺序号',
  `probability` INT DEFAULT 0 COMMENT '赢单概率: 0-100',
  `competitor_info` TEXT COMMENT '竞争对手信息',
  `description` TEXT COMMENT '描述',
  `owner_id` BIGINT DEFAULT NULL COMMENT '负责人ID',
  `campaign_id` BIGINT DEFAULT NULL COMMENT '来源活动ID',
  `lead_id` BIGINT DEFAULT NULL COMMENT '来源线索ID',
  `loss_reason` VARCHAR(500) DEFAULT NULL COMMENT '输单原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_contact_id` (`contact_id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_stage` (`stage`),
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_lead_id` (`lead_id`),
  INDEX `idx_expected_close_date` (`expected_close_date`),
  INDEX `idx_probability` (`probability`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机表';

-- 12. 商机阶段变更记录表
CREATE TABLE `crm_opportunity_stage_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `opportunity_id` BIGINT NOT NULL COMMENT '商机ID',
  `from_stage` VARCHAR(20) DEFAULT NULL COMMENT '变更前阶段',
  `to_stage` VARCHAR(20) DEFAULT NULL COMMENT '变更后阶段',
  `content` TEXT COMMENT '变更说明',
  `employee_id` BIGINT DEFAULT NULL COMMENT '操作人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_opportunity_id` (`opportunity_id`),
  INDEX `idx_employee_id` (`employee_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机阶段变更记录表';

-- 13. 商机团队表
CREATE TABLE `crm_opportunity_team` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `opportunity_id` BIGINT NOT NULL COMMENT '商机ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role` VARCHAR(20) NOT NULL COMMENT '角色: 负责人/商务/技术/售后',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_opportunity_id` (`opportunity_id`),
  INDEX `idx_user_id` (`user_id`),
  UNIQUE INDEX `uk_opportunity_user` (`opportunity_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机团队表';

-- 14. 商机竞争对手表
CREATE TABLE `crm_opportunity_competitor` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `opportunity_id` BIGINT NOT NULL COMMENT '商机ID',
  `competitor_name` VARCHAR(200) NOT NULL COMMENT '竞争对手名称',
  `strength` TEXT COMMENT '对手优势',
  `weakness` TEXT COMMENT '对手劣势',
  `our_advantage` TEXT COMMENT '我方优势',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_opportunity_id` (`opportunity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商机竞争对手表';

-- 15. 报价单表
CREATE TABLE `crm_quotation` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `quotation_no` VARCHAR(50) NOT NULL COMMENT '报价单号',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `contact_id` BIGINT DEFAULT NULL COMMENT '联系人ID',
  `opportunity_id` BIGINT DEFAULT NULL COMMENT '商机ID',
  `template_id` BIGINT DEFAULT NULL COMMENT '模板ID',
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '总金额',
  `discount_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT '折扣率',
  `discount_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT '折扣金额',
  `tax_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT '税率',
  `tax_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT '税额',
  `final_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '最终金额',
  `valid_until` DATE DEFAULT NULL COMMENT '有效期至',
  `description` TEXT COMMENT '报价说明',
  `owner_id` BIGINT DEFAULT NULL COMMENT '负责人ID',
  `status` VARCHAR(20) NOT NULL DEFAULT '草稿' COMMENT '状态: 草稿/待审批/已批准/已驳回/已转订单',
  `approval_id` BIGINT DEFAULT NULL COMMENT '审批记录ID',
  `order_id` BIGINT DEFAULT NULL COMMENT '关联订单ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_quotation_no` (`quotation_no`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_contact_id` (`contact_id`),
  INDEX `idx_opportunity_id` (`opportunity_id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_template_id` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单表';

-- 16. 报价明细表
CREATE TABLE `crm_quotation_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `quotation_id` BIGINT NOT NULL COMMENT '报价单ID',
  `product_id` BIGINT DEFAULT NULL COMMENT '产品ID',
  `product_name` VARCHAR(200) NOT NULL COMMENT '产品名称',
  `specification` VARCHAR(200) DEFAULT NULL COMMENT '规格',
  `unit` VARCHAR(20) DEFAULT NULL COMMENT '单位',
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 1.00 COMMENT '数量',
  `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '单价',
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '金额',
  `discount` DECIMAL(12,2) DEFAULT 0.00 COMMENT '折扣',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_quotation_id` (`quotation_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价明细表';

-- 17. 报价模板表
CREATE TABLE `crm_quotation_template` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '模板描述',
  `header_content` TEXT COMMENT '页眉内容',
  `footer_content` TEXT COMMENT '页脚内容',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认模板: 0-否 1-是',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_is_default` (`is_default`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价模板表';

-- 18. 产品表
CREATE TABLE `crm_product` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code` VARCHAR(50) NOT NULL COMMENT '产品编码',
  `name` VARCHAR(200) NOT NULL COMMENT '产品名称',
  `model` VARCHAR(100) DEFAULT NULL COMMENT '型号',
  `unit` VARCHAR(20) DEFAULT NULL COMMENT '单位',
  `category` VARCHAR(100) DEFAULT NULL COMMENT '分类',
  `price` DECIMAL(12,2) DEFAULT 0.00 COMMENT '销售价格',
  `cost_price` DECIMAL(12,2) DEFAULT 0.00 COMMENT '成本价格',
  `description` TEXT COMMENT '产品描述',
  `specification` TEXT COMMENT '规格参数',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-下架 1-上架',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_code` (`code`),
  INDEX `idx_name` (`name`),
  INDEX `idx_category` (`category`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品表';

-- 19. 产品价格策略表
CREATE TABLE `crm_product_price` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `product_id` BIGINT NOT NULL COMMENT '产品ID',
  `customer_level` VARCHAR(50) NOT NULL COMMENT '客户等级',
  `price` DECIMAL(12,2) NOT NULL COMMENT '等级价格',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_product_id` (`product_id`),
  UNIQUE INDEX `uk_product_level` (`product_id`, `customer_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品价格策略表';

-- 20. 发货单表
CREATE TABLE `crm_delivery` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `delivery_no` VARCHAR(50) NOT NULL COMMENT '发货单号',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `delivery_date` DATE DEFAULT NULL COMMENT '发货日期',
  `carrier` VARCHAR(100) DEFAULT NULL COMMENT '承运商',
  `tracking_no` VARCHAR(100) DEFAULT NULL COMMENT '物流单号',
  `address` VARCHAR(500) DEFAULT NULL COMMENT '收货地址',
  `contact_name` VARCHAR(100) DEFAULT NULL COMMENT '收货联系人',
  `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '收货电话',
  `status` VARCHAR(20) NOT NULL DEFAULT '待发货' COMMENT '状态: 待发货/已发货/已签收',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_delivery_no` (`delivery_no`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_delivery_date` (`delivery_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发货单表';

-- 21. 发货明细表
CREATE TABLE `crm_delivery_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `delivery_id` BIGINT NOT NULL COMMENT '发货单ID',
  `order_item_id` BIGINT DEFAULT NULL COMMENT '订单明细ID',
  `product_id` BIGINT NOT NULL COMMENT '产品ID',
  `product_name` VARCHAR(200) NOT NULL COMMENT '产品名称',
  `quantity` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '发货数量',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_delivery_id` (`delivery_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发货明细表';

-- 22. 收款计划表
CREATE TABLE `crm_receivable_plan` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `plan_amount` DECIMAL(15,2) NOT NULL COMMENT '计划收款金额',
  `plan_date` DATE NOT NULL COMMENT '计划收款日期',
  `status` VARCHAR(20) NOT NULL DEFAULT '待收款' COMMENT '状态: 待收款/已收款/已逾期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_plan_date` (`plan_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收款计划表';

-- 23. 收款记录表
CREATE TABLE `crm_receivable_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `plan_id` BIGINT DEFAULT NULL COMMENT '收款计划ID',
  `amount` DECIMAL(15,2) NOT NULL COMMENT '收款金额',
  `payment_method` VARCHAR(50) DEFAULT NULL COMMENT '付款方式',
  `payment_date` DATE NOT NULL COMMENT '付款日期',
  `payer` VARCHAR(100) DEFAULT NULL COMMENT '付款方',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_plan_id` (`plan_id`),
  INDEX `idx_payment_date` (`payment_date`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收款记录表';

-- 24. 发票表
CREATE TABLE `crm_invoice` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `invoice_no` VARCHAR(50) NOT NULL COMMENT '发票编号',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `invoice_type` VARCHAR(50) NOT NULL COMMENT '发票类型: 增值税专用发票/增值税普通发票',
  `invoice_title` VARCHAR(200) NOT NULL COMMENT '发票抬头',
  `tax_number` VARCHAR(50) DEFAULT NULL COMMENT '税号',
  `amount` DECIMAL(15,2) NOT NULL COMMENT '开票金额',
  `status` VARCHAR(20) NOT NULL DEFAULT '待开票' COMMENT '状态: 待开票/已开票/已作废',
  `apply_date` DATE DEFAULT NULL COMMENT '申请日期',
  `issue_date` DATE DEFAULT NULL COMMENT '开票日期',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_invoice_no` (`invoice_no`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_issue_date` (`issue_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票表';

-- 25. 服务请求表
CREATE TABLE `crm_service_request` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `request_no` VARCHAR(50) NOT NULL COMMENT '请求编号',
  `customer_id` BIGINT NOT NULL COMMENT '客户ID',
  `contact_id` BIGINT DEFAULT NULL COMMENT '联系人ID',
  `type` VARCHAR(20) NOT NULL COMMENT '类型: 投诉/咨询/维修/建议/其他',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `description` TEXT COMMENT '描述',
  `priority` VARCHAR(10) NOT NULL DEFAULT '中' COMMENT '优先级: 低/中/高/紧急',
  `status` VARCHAR(20) NOT NULL DEFAULT '待处理' COMMENT '状态: 待处理/处理中/已解决/已关闭',
  `owner_id` BIGINT DEFAULT NULL COMMENT '负责人ID',
  `satisfaction_score` INT DEFAULT NULL COMMENT '满意度评分: 1-5',
  `resolution` TEXT COMMENT '解决方案',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_request_no` (`request_no`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_contact_id` (`contact_id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务请求表';

-- 26. 服务工单表
CREATE TABLE `crm_service_ticket` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `ticket_no` VARCHAR(50) NOT NULL COMMENT '工单编号',
  `request_id` BIGINT NOT NULL COMMENT '服务请求ID',
  `title` VARCHAR(200) NOT NULL COMMENT '工单标题',
  `description` TEXT COMMENT '工单描述',
  `assignee_id` BIGINT DEFAULT NULL COMMENT '处理人ID',
  `status` VARCHAR(20) NOT NULL DEFAULT '待处理' COMMENT '状态: 待处理/处理中/待确认/已完成',
  `resolution` TEXT COMMENT '处理结果',
  `start_at` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_at` DATETIME DEFAULT NULL COMMENT '结束时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_ticket_no` (`ticket_no`),
  INDEX `idx_request_id` (`request_id`),
  INDEX `idx_assignee_id` (`assignee_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务工单表';

-- 27. 工单处理记录表
CREATE TABLE `crm_service_ticket_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `ticket_id` BIGINT NOT NULL COMMENT '工单ID',
  `action_type` VARCHAR(20) NOT NULL COMMENT '操作类型',
  `content` TEXT COMMENT '处理内容',
  `employee_id` BIGINT DEFAULT NULL COMMENT '操作人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_ticket_id` (`ticket_id`),
  INDEX `idx_employee_id` (`employee_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单处理记录表';

-- 28. 服务回访表
CREATE TABLE `crm_service_visit` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `request_id` BIGINT NOT NULL COMMENT '服务请求ID',
  `plan_date` DATE DEFAULT NULL COMMENT '计划回访日期',
  `actual_date` DATE DEFAULT NULL COMMENT '实际回访日期',
  `content` TEXT COMMENT '回访内容',
  `visitor_id` BIGINT DEFAULT NULL COMMENT '回访人ID',
  `satisfaction_score` INT DEFAULT NULL COMMENT '满意度评分: 1-5',
  `status` VARCHAR(20) NOT NULL DEFAULT '待回访' COMMENT '状态: 待回访/已回访',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_request_id` (`request_id`),
  INDEX `idx_visitor_id` (`visitor_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务回访表';

-- 29. 日程表
CREATE TABLE `crm_schedule` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(200) NOT NULL COMMENT '日程标题',
  `type` VARCHAR(20) NOT NULL COMMENT '类型: 会议/拜访/电话/任务/其他',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `is_all_day` TINYINT DEFAULT 0 COMMENT '是否全天: 0-否 1-是',
  `location` VARCHAR(255) DEFAULT NULL COMMENT '地点',
  `description` TEXT COMMENT '描述',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联类型: customer/opportunity/lead',
  `related_id` BIGINT DEFAULT NULL COMMENT '关联ID',
  `owner_id` BIGINT NOT NULL COMMENT '负责人ID',
  `status` VARCHAR(20) NOT NULL DEFAULT '待开始' COMMENT '状态: 待开始/进行中/已完成/已取消',
  `is_public` TINYINT DEFAULT 0 COMMENT '是否公开: 0-否 1-是',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_start_time` (`start_time`),
  INDEX `idx_end_time` (`end_time`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_related` (`related_type`, `related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日程表';

-- 30. 工作任务表
CREATE TABLE `crm_task` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(200) NOT NULL COMMENT '任务标题',
  `description` TEXT COMMENT '任务描述',
  `type` VARCHAR(20) NOT NULL DEFAULT '日常' COMMENT '类型: 日常/项目/审批',
  `priority` VARCHAR(10) NOT NULL DEFAULT '中' COMMENT '优先级: 低/中/高/紧急',
  `owner_id` BIGINT DEFAULT NULL COMMENT '负责人ID',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联类型',
  `related_id` BIGINT DEFAULT NULL COMMENT '关联ID',
  `start_date` DATE DEFAULT NULL COMMENT '开始日期',
  `due_date` DATE DEFAULT NULL COMMENT '截止日期',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `status` VARCHAR(20) NOT NULL DEFAULT '待办' COMMENT '状态: 待办/进行中/已完成/已关闭',
  `parent_id` BIGINT DEFAULT NULL COMMENT '父任务ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_due_date` (`due_date`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作任务表';

-- 31. 公告通知表
CREATE TABLE `crm_notice` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(200) NOT NULL COMMENT '公告标题',
  `content` TEXT NOT NULL COMMENT '公告内容',
  `type` VARCHAR(20) NOT NULL DEFAULT '系统' COMMENT '类型: 系统/业务',
  `level` VARCHAR(10) NOT NULL DEFAULT '一般' COMMENT '级别: 一般/重要/紧急',
  `publisher_id` BIGINT DEFAULT NULL COMMENT '发布人ID',
  `is_top` TINYINT DEFAULT 0 COMMENT '是否置顶: 0-否 1-是',
  `view_count` INT DEFAULT 0 COMMENT '浏览次数',
  `status` VARCHAR(20) NOT NULL DEFAULT '草稿' COMMENT '状态: 草稿/已发布/已撤回',
  `published_at` DATETIME DEFAULT NULL COMMENT '发布时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_publisher_id` (`publisher_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_level` (`level`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_top` (`is_top`),
  INDEX `idx_published_at` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告通知表';

-- 32. 公告已读记录表
CREATE TABLE `crm_notice_read` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `notice_id` BIGINT NOT NULL COMMENT '公告ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `read_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  PRIMARY KEY (`id`),
  INDEX `idx_notice_id` (`notice_id`),
  INDEX `idx_user_id` (`user_id`),
  UNIQUE INDEX `uk_notice_user` (`notice_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告已读记录表';

-- 33. 站内信表
CREATE TABLE `crm_internal_mail` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` VARCHAR(200) NOT NULL COMMENT '站内信标题',
  `content` TEXT COMMENT '站内信内容',
  `sender_id` BIGINT DEFAULT NULL COMMENT '发送人ID',
  `receiver_id` BIGINT NOT NULL COMMENT '接收人ID',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读: 0-否 1-是',
  `is_starred` TINYINT DEFAULT 0 COMMENT '是否星标: 0-否 1-是',
  `parent_id` BIGINT DEFAULT NULL COMMENT '回复关联ID',
  `type` VARCHAR(20) DEFAULT '通知' COMMENT '类型: 通知/消息/审批',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联类型',
  `related_id` BIGINT DEFAULT NULL COMMENT '关联ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_sender_id` (`sender_id`),
  INDEX `idx_receiver_id` (`receiver_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_type` (`type`),
  INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内信表';

-- 34. 审批流程定义表
CREATE TABLE `crm_approval_flow` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(200) NOT NULL COMMENT '流程名称',
  `type` VARCHAR(50) NOT NULL COMMENT '类型: 报价/活动费用/订单/其他',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '流程描述',
  `steps` JSON DEFAULT NULL COMMENT '审批步骤 (JSON: 审批人user_id数组)',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批流程定义表';

-- 35. 审批记录表
CREATE TABLE `crm_approval_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `flow_id` BIGINT NOT NULL COMMENT '审批流程ID',
  `business_type` VARCHAR(50) NOT NULL COMMENT '业务类型',
  `business_id` BIGINT NOT NULL COMMENT '业务ID',
  `current_step` INT DEFAULT 1 COMMENT '当前步骤',
  `approver_id` BIGINT NOT NULL COMMENT '审批人ID',
  `comment` VARCHAR(500) DEFAULT NULL COMMENT '审批意见',
  `action` VARCHAR(20) NOT NULL COMMENT '审批动作: 同意/驳回/转审',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_flow_id` (`flow_id`),
  INDEX `idx_business` (`business_type`, `business_id`),
  INDEX `idx_approver_id` (`approver_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批记录表';

-- 36. 文档表
CREATE TABLE `crm_document` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(200) NOT NULL COMMENT '文档名称',
  `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件大小(字节)',
  `file_type` VARCHAR(50) DEFAULT NULL COMMENT '文件类型',
  `category` VARCHAR(100) DEFAULT NULL COMMENT '分类',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联类型',
  `related_id` BIGINT DEFAULT NULL COMMENT '关联ID',
  `uploader_id` BIGINT DEFAULT NULL COMMENT '上传人ID',
  `download_count` INT DEFAULT 0 COMMENT '下载次数',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_uploader_id` (`uploader_id`),
  INDEX `idx_related` (`related_type`, `related_id`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档表';

-- 37. 销售团队表
CREATE TABLE `crm_sales_team` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(100) NOT NULL COMMENT '团队名称',
  `leader_id` BIGINT NOT NULL COMMENT '团队负责人ID',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '团队描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_leader_id` (`leader_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售团队表';

-- 38. 团队成员表
CREATE TABLE `crm_sales_team_member` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `team_id` BIGINT NOT NULL COMMENT '团队ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role` VARCHAR(20) NOT NULL DEFAULT 'member' COMMENT '角色: leader/member',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_team_id` (`team_id`),
  INDEX `idx_user_id` (`user_id`),
  UNIQUE INDEX `uk_team_user` (`team_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队成员表';

-- 39. 字典类型表
CREATE TABLE `sys_dict_type` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dict_name` VARCHAR(100) NOT NULL COMMENT '字典名称',
  `dict_type` VARCHAR(100) NOT NULL COMMENT '字典类型',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_dict_type` (`dict_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典类型表';

-- 40. 字典数据表
CREATE TABLE `sys_dict_data` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dict_type` VARCHAR(100) NOT NULL COMMENT '字典类型',
  `dict_label` VARCHAR(100) NOT NULL COMMENT '字典标签',
  `dict_value` VARCHAR(100) NOT NULL COMMENT '字典值',
  `css_class` VARCHAR(100) DEFAULT NULL COMMENT '样式属性',
  `list_class` VARCHAR(100) DEFAULT NULL COMMENT '表格回显样式',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认: 0-否 1-是',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_dict_type` (`dict_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典数据表';

-- 41. 系统配置表
CREATE TABLE `sys_config` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `config_name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` VARCHAR(500) DEFAULT NULL COMMENT '配置值',
  `config_type` VARCHAR(50) DEFAULT NULL COMMENT '配置类型',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 42. AI建议记录表
CREATE TABLE `crm_ai_suggestion` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `type` VARCHAR(50) NOT NULL COMMENT '建议类型: churn/sales_script/marketing',
  `target_type` VARCHAR(50) NOT NULL COMMENT '目标类型',
  `target_id` BIGINT NOT NULL COMMENT '目标ID',
  `content` TEXT NOT NULL COMMENT '建议内容',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '评分',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_target` (`target_type`, `target_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI建议记录表';
