-- CRM Database Initialization (H2 Compatible)
-- Auto-created for development using H2 in-memory database

CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'EMPLOYEE',
    phone VARCHAR(20),
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    gender VARCHAR(5),
    age INT,
    source VARCHAR(50),
    level VARCHAR(20) DEFAULT '普通',
    owner_id BIGINT,
    status TINYINT DEFAULT 1,
    remark CLOB,
    -- Extended fields
    industry VARCHAR(100),
    company_size VARCHAR(50),
    address VARCHAR(255),
    website VARCHAR(100),
    avatar VARCHAR(255),
    source_detail VARCHAR(255),
    credit_level VARCHAR(20) DEFAULT '一般',
    merged_to_id BIGINT,
    protect_days INT DEFAULT 0,
    last_follow_at TIMESTAMP,
    next_follow_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_lead (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    employee_id BIGINT,
    status VARCHAR(20) DEFAULT '跟进中',
    is_pool TINYINT DEFAULT 0,
    follow_count INT DEFAULT 0,
    last_follow_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL UNIQUE,
    card_level VARCHAR(20) DEFAULT '普通',
    points INT DEFAULT 0,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS point_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    type VARCHAR(10) NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_campaign (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20),
    description CLOB,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT '进行中',
    target_group VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT,
    name VARCHAR(100) NOT NULL,
    discount_value DECIMAL(10,2),
    min_amount DECIMAL(10,2) DEFAULT 0,
    total_qty INT DEFAULT 0,
    used_qty INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    coupon_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    status VARCHAR(10) DEFAULT '未使用',
    send_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    use_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    employee_id BIGINT,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT '待付款',
    remark CLOB,
    -- Extended fields
    order_no VARCHAR(50),
    delivery_date DATE,
    shipping_address VARCHAR(500),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    payment_method VARCHAR(50),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    invoice_status VARCHAR(20) DEFAULT '未开票',
    delivery_status VARCHAR(20) DEFAULT '未发货',
    quotation_id BIGINT,
    approved_by BIGINT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    -- Extended fields
    product_id BIGINT,
    specification VARCHAR(100),
    unit VARCHAR(20),
    discount DECIMAL(10,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_up (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    employee_id BIGINT,
    type VARCHAR(10) DEFAULT '回访',
    plan_time TIMESTAMP,
    actual_time TIMESTAMP,
    content CLOB,
    status VARCHAR(20) DEFAULT '待处理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS todo_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    type VARCHAR(20),
    content VARCHAR(500),
    customer_id BIGINT,
    deadline TIMESTAMP,
    status VARCHAR(10) DEFAULT '待办',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_performance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    "month" VARCHAR(7),
    sales_amount DECIMAL(12,2) DEFAULT 0,
    new_customers INT DEFAULT 0,
    follow_up_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== New Module Tables ====================

-- Lead (线索)
CREATE TABLE IF NOT EXISTS crm_lead (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    source VARCHAR(50),
    contact_name VARCHAR(50),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    company_name VARCHAR(200),
    industry VARCHAR(100),
    description CLOB,
    owner_id BIGINT,
    status INT DEFAULT 1,
    convert_customer_id BIGINT,
    convert_opportunity_id BIGINT,
    follow_count INT DEFAULT 0,
    last_follow_at TIMESTAMP,
    next_follow_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_lead_follow_up (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    employee_id BIGINT,
    content CLOB,
    plan_time TIMESTAMP,
    actual_time TIMESTAMP,
    status VARCHAR(20) DEFAULT '待处理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunity (商机)
CREATE TABLE IF NOT EXISTS crm_opportunity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    customer_id BIGINT,
    contact_id BIGINT,
    amount DECIMAL(12,2) DEFAULT 0,
    expected_close_date DATE,
    stage VARCHAR(50),
    stage_order INT DEFAULT 0,
    probability INT DEFAULT 0,
    competitor_info CLOB,
    description CLOB,
    owner_id BIGINT,
    campaign_id BIGINT,
    lead_id BIGINT,
    loss_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_opportunity_team (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) DEFAULT '成员',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_opportunity_competitor (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    advantage CLOB,
    disadvantage CLOB,
    price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_opportunity_stage_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50),
    operator_id BIGINT,
    remark CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product (产品)
CREATE TABLE IF NOT EXISTS crm_product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    model VARCHAR(100),
    category VARCHAR(100),
    unit VARCHAR(20),
    price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    specification VARCHAR(200),
    description CLOB,
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_product_price (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    price_type VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    min_qty INT DEFAULT 1,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotation (报价)
CREATE TABLE IF NOT EXISTS crm_quotation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quotation_no VARCHAR(50),
    customer_id BIGINT,
    opportunity_id BIGINT,
    contact_id BIGINT,
    title VARCHAR(200),
    total_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT '草稿',
    owner_id BIGINT,
    valid_until DATE,
    remark CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_quotation_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quotation_id BIGINT NOT NULL,
    product_id BIGINT,
    product_name VARCHAR(200),
    specification VARCHAR(100),
    unit VARCHAR(20),
    qty INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(12,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_quotation_template (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    content CLOB,
    owner_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule (日程)
CREATE TABLE IF NOT EXISTS crm_schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content CLOB,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    type VARCHAR(50),
    priority VARCHAR(20) DEFAULT '普通',
    status VARCHAR(20) DEFAULT '待办',
    owner_id BIGINT,
    related_id BIGINT,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task (任务)
CREATE TABLE IF NOT EXISTS crm_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description CLOB,
    assignee_id BIGINT,
    creator_id BIGINT,
    status VARCHAR(20) DEFAULT '待办',
    priority VARCHAR(20) DEFAULT '普通',
    due_date DATE,
    related_id BIGINT,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notice (公告通知)
CREATE TABLE IF NOT EXISTS crm_notice (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content CLOB,
    type VARCHAR(50) DEFAULT '通知',
    status VARCHAR(20) DEFAULT '已发布',
    publisher_id BIGINT,
    publish_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_notice_read (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notice_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Internal Mail (站内信)
CREATE TABLE IF NOT EXISTS crm_internal_mail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content CLOB,
    sender_id BIGINT,
    receiver_id BIGINT,
    status VARCHAR(20) DEFAULT '未读',
    type VARCHAR(50) DEFAULT '普通',
    parent_id BIGINT,
    is_starred INT DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document (文档)
CREATE TABLE IF NOT EXISTS crm_document (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT DEFAULT 0,
    file_path VARCHAR(500),
    category VARCHAR(50),
    uploader_id BIGINT,
    related_id BIGINT,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval (审批)
CREATE TABLE IF NOT EXISTS crm_approval_flow (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    description CLOB,
    steps CLOB,
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_approval_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flow_id BIGINT,
    business_type VARCHAR(50),
    business_id BIGINT,
    title VARCHAR(200),
    submitter_id BIGINT,
    current_step INT DEFAULT 1,
    status VARCHAR(20) DEFAULT '审批中',
    result VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts (联系人)
CREATE TABLE IF NOT EXISTS crm_contact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    title VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    department VARCHAR(100),
    is_primary INT DEFAULT 0,
    remark CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dict (数据字典)
CREATE TABLE IF NOT EXISTS sys_dict_type (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dict_name VARCHAR(100) NOT NULL,
    dict_type VARCHAR(100) NOT NULL UNIQUE,
    status INT DEFAULT 1,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sys_dict_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dict_type VARCHAR(100) NOT NULL,
    dict_label VARCHAR(100) NOT NULL,
    dict_value VARCHAR(100) NOT NULL,
    css_class VARCHAR(50),
    list_class VARCHAR(50),
    is_default INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    status INT DEFAULT 1,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Config (系统配置)
CREATE TABLE IF NOT EXISTS sys_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value CLOB,
    config_type VARCHAR(50),
    description VARCHAR(500),
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Team (销售团队)
CREATE TABLE IF NOT EXISTS crm_sales_team (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    leader_id BIGINT,
    description CLOB,
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_sales_team_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) DEFAULT '成员',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketing Activity (市场活动)
CREATE TABLE IF NOT EXISTS crm_marketing_activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2) DEFAULT 0,
    actual_cost DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT '计划中',
    description CLOB,
    owner_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_activity_expense (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    type VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(500),
    expense_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_activity_target (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    target_type VARCHAR(50),
    target_value INT DEFAULT 0,
    actual_value INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service (服务管理)
CREATE TABLE IF NOT EXISTS crm_service_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_no VARCHAR(50),
    customer_id BIGINT NOT NULL,
    contact_id BIGINT,
    type VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description CLOB,
    priority VARCHAR(20) DEFAULT '普通',
    status VARCHAR(20) DEFAULT '待处理',
    owner_id BIGINT,
    satisfaction_score INT,
    resolution CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_service_ticket (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    title VARCHAR(200),
    status VARCHAR(20) DEFAULT '待处理',
    assignee_id BIGINT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_service_ticket_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    operator_id BIGINT,
    action VARCHAR(50),
    content CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_service_visit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_id BIGINT,
    customer_id BIGINT,
    visit_time TIMESTAMP,
    visitor_id BIGINT,
    content CLOB,
    result CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery (发货)
CREATE TABLE IF NOT EXISTS crm_delivery (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    delivery_no VARCHAR(50),
    status VARCHAR(20) DEFAULT '待发货',
    address VARCHAR(500),
    contact_name VARCHAR(50),
    contact_phone VARCHAR(20),
    ship_time TIMESTAMP,
    sign_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_delivery_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_id BIGINT NOT NULL,
    order_item_id BIGINT,
    product_id BIGINT,
    product_name VARCHAR(200),
    qty INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice (发票)
CREATE TABLE IF NOT EXISTS crm_invoice (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    invoice_no VARCHAR(50),
    type VARCHAR(50),
    title VARCHAR(200),
    tax_no VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT '待开票',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receivable (应收款)
CREATE TABLE IF NOT EXISTS crm_receivable_plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    plan_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    status VARCHAR(20) DEFAULT '待收款',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_receivable_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    pay_time TIMESTAMP,
    pay_method VARCHAR(50),
    operator_id BIGINT,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Tags & Share (标签与共享)
CREATE TABLE IF NOT EXISTS crm_customer_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#409EFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_customer_tag_rel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_customer_share (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    from_user_id BIGINT NOT NULL,
    to_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_customer_protection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sys_user (username, password, real_name, role, phone) VALUES
('admin', '$2a$10$gbTE46j3Jv1tVUd1THh7pOYCPvN7/n48c9cHUfXDu.QpUQd21q.zu', '管理员', 'ADMIN', '13800000000');
