-- ============================================
-- CRM System Upgrade: Alter Existing Tables
-- Database: crm_db
-- ============================================

-- ============================================
-- 1. customer 表 - 新增字段
-- ============================================
ALTER TABLE `customer`
  ADD COLUMN `industry` VARCHAR(100) DEFAULT NULL COMMENT '行业',
  ADD COLUMN `company_size` VARCHAR(50) DEFAULT NULL COMMENT '公司规模',
  ADD COLUMN `annual_revenue` DECIMAL(15,2) DEFAULT NULL COMMENT '年营收',
  ADD COLUMN `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
  ADD COLUMN `website` VARCHAR(100) DEFAULT NULL COMMENT '网站',
  ADD COLUMN `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
  ADD COLUMN `source_detail` VARCHAR(255) DEFAULT NULL COMMENT '来源详情',
  ADD COLUMN `credit_level` VARCHAR(20) DEFAULT '一般' COMMENT '信用等级',
  ADD COLUMN `merged_to_id` BIGINT DEFAULT NULL COMMENT '合并到哪个客户ID',
  ADD COLUMN `protect_days` INT DEFAULT 0 COMMENT '保护天数',
  ADD COLUMN `last_follow_at` DATETIME DEFAULT NULL COMMENT '最后跟进时间',
  ADD COLUMN `next_follow_at` DATETIME DEFAULT NULL COMMENT '下次跟进时间';

-- Indexes for new customer columns
ALTER TABLE `customer`
  ADD INDEX `idx_industry` (`industry`),
  ADD INDEX `idx_credit_level` (`credit_level`),
  ADD INDEX `idx_merged_to_id` (`merged_to_id`),
  ADD INDEX `idx_last_follow_at` (`last_follow_at`),
  ADD INDEX `idx_next_follow_at` (`next_follow_at`);

-- ============================================
-- 2. sales_order 表 - 新增字段
-- ============================================
ALTER TABLE `sales_order`
  ADD COLUMN `order_no` VARCHAR(50) DEFAULT NULL COMMENT '订单编号',
  ADD COLUMN `delivery_date` DATE DEFAULT NULL COMMENT '交货日期',
  ADD COLUMN `shipping_address` VARCHAR(500) DEFAULT NULL COMMENT '收货地址',
  ADD COLUMN `contact_name` VARCHAR(100) DEFAULT NULL COMMENT '收货联系人',
  ADD COLUMN `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '收货电话',
  ADD COLUMN `payment_method` VARCHAR(50) DEFAULT NULL COMMENT '付款方式',
  ADD COLUMN `discount_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '折扣金额',
  ADD COLUMN `tax_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '税额',
  ADD COLUMN `paid_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '已付金额',
  ADD COLUMN `invoice_status` VARCHAR(20) DEFAULT '未开票' COMMENT '开票状态',
  ADD COLUMN `delivery_status` VARCHAR(20) DEFAULT '未发货' COMMENT '发货状态',
  ADD COLUMN `quotation_id` BIGINT DEFAULT NULL COMMENT '关联报价单ID',
  ADD COLUMN `approved_by` BIGINT DEFAULT NULL COMMENT '审核人ID',
  ADD COLUMN `approved_at` DATETIME DEFAULT NULL COMMENT '审核时间';

-- Indexes for new sales_order columns
ALTER TABLE `sales_order`
  ADD UNIQUE INDEX `uk_order_no` (`order_no`),
  ADD INDEX `idx_invoice_status` (`invoice_status`),
  ADD INDEX `idx_delivery_status` (`delivery_status`),
  ADD INDEX `idx_quotation_id` (`quotation_id`),
  ADD INDEX `idx_approved_by` (`approved_by`),
  ADD INDEX `idx_delivery_date` (`delivery_date`);

-- ============================================
-- 3. follow_up 表 - 新增字段
-- ============================================
ALTER TABLE `follow_up`
  ADD COLUMN `next_plan_time` DATETIME DEFAULT NULL COMMENT '下次计划跟进时间',
  ADD COLUMN `customer_name` VARCHAR(100) DEFAULT NULL COMMENT '冗余客户名',
  ADD COLUMN `satisfaction_score` INT DEFAULT NULL COMMENT '满意度评分';

-- Indexes for new follow_up columns
ALTER TABLE `follow_up`
  ADD INDEX `idx_next_plan_time` (`next_plan_time`),
  ADD INDEX `idx_customer_name` (`customer_name`);
