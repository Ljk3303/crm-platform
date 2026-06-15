import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data/crm.db');

let db;

export function getDb() {
  if (!db) {
    const fs = await? null;
    try { 
      const { mkdirSync } = await import('fs');
      mkdirSync(join(__dirname, '../../data'), { recursive: true });
    } catch {}
    
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
    seedData(db);
  }
  return db;
}

// 模拟 fs.mkdirSync 替代方案
import fs from 'fs';
fs.mkdirSync(join(__dirname, '../../data'), { recursive: true });

const _db = new Database(DB_PATH);
_db.pragma('journal_mode = WAL');
_db.pragma('foreign_keys = ON');

function initTables(db) {
  db.exec(`
    -- ========== 系统表 ==========
    CREATE TABLE IF NOT EXISTS sys_user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      real_name VARCHAR(50),
      role VARCHAR(20) DEFAULT 'EMPLOYEE',
      phone VARCHAR(20),
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sys_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_name VARCHAR(100) NOT NULL,
      config_key VARCHAR(100) NOT NULL UNIQUE,
      config_value TEXT,
      config_type VARCHAR(50),
      description VARCHAR(500),
      remark VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sys_dict_type (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dict_name VARCHAR(100) NOT NULL,
      dict_type VARCHAR(100) NOT NULL UNIQUE,
      status INTEGER DEFAULT 1,
      remark VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sys_dict_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dict_type VARCHAR(100) NOT NULL,
      dict_label VARCHAR(100) NOT NULL,
      dict_value VARCHAR(100) NOT NULL,
      css_class VARCHAR(50),
      list_class VARCHAR(50),
      is_default INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      remark VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ========== 核心业务表 ==========
    CREATE TABLE IF NOT EXISTS customer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      gender VARCHAR(5),
      age INTEGER,
      source VARCHAR(50),
      level VARCHAR(20) DEFAULT '普通',
      owner_id INTEGER,
      status INTEGER DEFAULT 1,
      remark TEXT,
      industry VARCHAR(100),
      company_size VARCHAR(50),
      address VARCHAR(255),
      website VARCHAR(100),
      avatar VARCHAR(255),
      source_detail VARCHAR(255),
      credit_level VARCHAR(20) DEFAULT '一般',
      merged_to_id INTEGER,
      protect_days INTEGER DEFAULT 0,
      last_follow_at DATETIME,
      next_follow_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_lead (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      employee_id INTEGER,
      status VARCHAR(20) DEFAULT '跟进中',
      is_pool INTEGER DEFAULT 0,
      follow_count INTEGER DEFAULT 0,
      last_follow_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_lead (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      source VARCHAR(50),
      contact_name VARCHAR(50),
      contact_phone VARCHAR(20),
      contact_email VARCHAR(100),
      company_name VARCHAR(200),
      industry VARCHAR(100),
      description TEXT,
      owner_id INTEGER,
      status INTEGER DEFAULT 1,
      convert_customer_id INTEGER,
      convert_opportunity_id INTEGER,
      follow_count INTEGER DEFAULT 0,
      last_follow_at DATETIME,
      next_follow_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_lead_follow_up (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      employee_id INTEGER,
      content TEXT,
      plan_time DATETIME,
      actual_time DATETIME,
      status VARCHAR(20) DEFAULT '待处理',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_opportunity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      customer_id INTEGER,
      contact_id INTEGER,
      amount DECIMAL(12,2) DEFAULT 0,
      expected_close_date DATE,
      stage VARCHAR(50),
      stage_order INTEGER DEFAULT 0,
      probability INTEGER DEFAULT 0,
      competitor_info TEXT,
      description TEXT,
      owner_id INTEGER,
      campaign_id INTEGER,
      lead_id INTEGER,
      loss_reason VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_opportunity_team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role VARCHAR(50) DEFAULT '成员',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_opportunity_competitor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      name VARCHAR(200) NOT NULL,
      advantage TEXT,
      disadvantage TEXT,
      price DECIMAL(12,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_opportunity_stage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      from_stage VARCHAR(50),
      to_stage VARCHAR(50),
      operator_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_contact (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      name VARCHAR(50) NOT NULL,
      department VARCHAR(100),
      position VARCHAR(100),
      phone VARCHAR(20),
      email VARCHAR(100),
      wechat VARCHAR(50),
      qq VARCHAR(20),
      gender VARCHAR(5),
      decision_role VARCHAR(50),
      is_primary INTEGER DEFAULT 0,
      remark TEXT,
      status INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_product (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code VARCHAR(50),
      name VARCHAR(200) NOT NULL,
      model VARCHAR(100),
      category VARCHAR(100),
      unit VARCHAR(20),
      price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      specification VARCHAR(200),
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_product_price (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      price_type VARCHAR(50),
      price DECIMAL(10,2) NOT NULL,
      min_qty INTEGER DEFAULT 1,
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_quotation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_no VARCHAR(50),
      customer_id INTEGER,
      opportunity_id INTEGER,
      contact_id INTEGER,
      title VARCHAR(200),
      total_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      final_amount DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT '草稿',
      owner_id INTEGER,
      valid_until DATE,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_quotation_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name VARCHAR(200),
      specification VARCHAR(100),
      unit VARCHAR(20),
      qty INTEGER NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      amount DECIMAL(12,2) DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_quotation_template (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      content TEXT,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales_order (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no VARCHAR(50),
      customer_id INTEGER NOT NULL,
      employee_id INTEGER,
      total_amount DECIMAL(12,2) NOT NULL,
      status VARCHAR(20) DEFAULT '待付款',
      remark TEXT,
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
      quotation_id INTEGER,
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name VARCHAR(200) NOT NULL,
      specification VARCHAR(100),
      unit VARCHAR(20),
      qty INTEGER NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follow_up (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      employee_id INTEGER,
      type VARCHAR(10) DEFAULT '回访',
      plan_time DATETIME,
      actual_time DATETIME,
      content TEXT,
      status VARCHAR(20) DEFAULT '待处理',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marketing_campaign (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20),
      description TEXT,
      start_time DATETIME,
      end_time DATETIME,
      status VARCHAR(20) DEFAULT '进行中',
      target_group VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupon (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      name VARCHAR(100) NOT NULL,
      discount_value DECIMAL(10,2),
      min_amount DECIMAL(10,2) DEFAULT 0,
      total_qty INTEGER DEFAULT 0,
      used_qty INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupon_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      status VARCHAR(10) DEFAULT '未使用',
      send_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      use_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS member (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL UNIQUE,
      card_level VARCHAR(20) DEFAULT '普通',
      points INTEGER DEFAULT 0,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS point_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      type VARCHAR(10) NOT NULL,
      points INTEGER NOT NULL,
      reason VARCHAR(200),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month VARCHAR(7),
      sales_amount DECIMAL(12,2) DEFAULT 0,
      new_customers INTEGER DEFAULT 0,
      follow_up_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todo_task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      type VARCHAR(20),
      content VARCHAR(500),
      customer_id INTEGER,
      deadline DATETIME,
      status VARCHAR(10) DEFAULT '待办',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ========== 简化的扩展表 ==========
    CREATE TABLE IF NOT EXISTS crm_notice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      type VARCHAR(50) DEFAULT '通知',
      status VARCHAR(20) DEFAULT '已发布',
      publisher_id INTEGER,
      publish_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_notice_read (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notice_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_internal_mail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      sender_id INTEGER,
      receiver_id INTEGER,
      status VARCHAR(20) DEFAULT '未读',
      type VARCHAR(50) DEFAULT '普通',
      parent_id INTEGER,
      is_starred INTEGER DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_document (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      file_type VARCHAR(50),
      file_size BIGINT DEFAULT 0,
      file_path VARCHAR(500),
      category VARCHAR(50),
      uploader_id INTEGER,
      related_id INTEGER,
      related_type VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_approval_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      type VARCHAR(50),
      description TEXT,
      steps TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_approval_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flow_id INTEGER,
      business_type VARCHAR(50),
      business_id INTEGER,
      title VARCHAR(200),
      submitter_id INTEGER,
      current_step INTEGER DEFAULT 1,
      status VARCHAR(20) DEFAULT '审批中',
      result VARCHAR(500),
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_sales_team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      leader_id INTEGER,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_sales_team_member (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role VARCHAR(50) DEFAULT '成员',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_service_request (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_no VARCHAR(50),
      customer_id INTEGER NOT NULL,
      contact_id INTEGER,
      type VARCHAR(50),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      priority VARCHAR(20) DEFAULT '普通',
      status VARCHAR(20) DEFAULT '待处理',
      owner_id INTEGER,
      satisfaction_score INTEGER,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_service_ticket (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      title VARCHAR(200),
      status VARCHAR(20) DEFAULT '待处理',
      assignee_id INTEGER,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      type VARCHAR(50),
      priority VARCHAR(20) DEFAULT '普通',
      status VARCHAR(20) DEFAULT '待办',
      owner_id INTEGER,
      related_id INTEGER,
      related_type VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      assignee_id INTEGER,
      creator_id INTEGER,
      status VARCHAR(20) DEFAULT '待办',
      priority VARCHAR(20) DEFAULT '普通',
      due_date DATE,
      related_id INTEGER,
      related_type VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_marketing_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      type VARCHAR(50),
      budget DECIMAL(12,2) DEFAULT 0,
      actual_cost DECIMAL(12,2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      owner_id INTEGER,
      description TEXT,
      target_description TEXT,
      status INTEGER DEFAULT 1,
      lead_count INTEGER DEFAULT 0,
      opportunity_count INTEGER DEFAULT 0,
      deal_amount DECIMAL(12,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM sys_user').get();
  if (count.c > 0) return;

  const bcrypt = await? null;
  // 使用固定哈希
  const hash = '$2a$10$gbTE46j3Jv1tVUd1THh7pOYCPvN7/n48c9cHUfXDu.QpUQd21q.zu';

  const insert = db.prepare('INSERT INTO sys_user (username, password, real_name, role, phone) VALUES (?, ?, ?, ?, ?)');
  insert.run('admin', hash, '管理员', 'ADMIN', '13800000000');
  insert.run('zhangwei', hash, '张伟', 'EMPLOYEE', '13800000001');
  insert.run('liming', hash, '李明', 'EMPLOYEE', '13800000002');
  insert.run('wangfang', hash, '王芳', 'EMPLOYEE', '13800000003');

  // Customers
  const insCust = db.prepare(`INSERT INTO customer (name,phone,email,gender,age,source,level,owner_id,status,industry) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const custs = [
    ['陈思雨','13910001111','chensy@qq.com','女',24,'门店','高价值',2,1,'零售'],
    ['刘建国','13910001112','liujg@163.com','男',42,'小程序','高价值',2,1,'企业服务'],
    ['张晓萌','13910001113','zxm@qq.com','女',19,'门店','高价值',3,1,'教育'],
    ['王大明','13910001114','wangdm@gmail.com','男',35,'门店','普通',2,1,'零售'],
    ['李佳琪','13910001115','lijiq@163.com','女',28,'小程序','高价值',3,1,'美妆'],
    ['赵铁柱','13910001116',null,'男',55,'地推','普通',2,1,'零售'],
    ['秦岚','13910001130','qinlan@qq.com','女',30,'门店','高价值',3,1,'企业服务'],
    ['蒋晓晓','13910001125','jiangxx@163.com','女',27,'门店','高价值',3,1,'零售'],
    ['孙美美','13910001117','sunmei@qq.com','女',31,'门店','普通',3,1,'教育'],
    ['郑浩','13910001120','zhengh@qq.com','男',29,'地推','普通',3,1,'健身'],
  ];
  for (const c of custs) insCust.run(...c);

  // Products
  const insProd = db.prepare('INSERT INTO crm_product (code,name,model,category,unit,price,cost_price,specification,status) VALUES (?,?,?,?,?,?,?,?,1)');
  const prods = [
    ['P001','面膜套装','MZ-100','美妆','盒',59.90,35,'10片装'],
    ['P002','手帐本','SZB-A5','文具','本',35,18,'A5'],
    ['P003','蓝牙耳机','BT-200','数码','个',156,89,'蓝牙5.3'],
    ['P004','收纳箱大号','SNX-L','家居','个',89,45,'60L'],
    ['P005','马克杯','MKB-350','家居','个',67,25,'350ml'],
    ['P006','洗面奶','XMN-120','美妆','支',37,22,'120g'],
    ['P007','中性笔套装','ZXB-12','文具','套',29,15,'12支装'],
    ['P008','香薰蜡烛','XXL-200','家居','个',128,68,'200g'],
  ];
  for (const p of prods) insProd.run(...p);

  // Leads
  const insLead = db.prepare(`INSERT INTO crm_lead (name,source,contact_name,contact_phone,owner_id,status,follow_count,created_at) VALUES (?,?,?,?,?,1,?,datetime('now'))`);
  insLead.run('陈思雨-美妆批发','转介','陈思雨','13910001111',2,2);
  insLead.run('刘建国-企业采购','展会','刘建国','13910001112',2,3);
  insLead.run('新锐科技-办公用品','网站','赵总','13920001111',2,1);
  insLead.run('星光百货-合作','地推','李总','13920002222',3,1);
  insLead.run('秦岚-行政采购','门店','秦岚','13910001130',3,1);

  // Opportunities
  const insOpp = db.prepare(`INSERT INTO crm_opportunity (name,customer_id,amount,stage,stage_order,probability,owner_id,expected_close_date) VALUES (?,?,?,?,?,?,?,?)`);
  insOpp.run('陈思雨年度美妆采购',1,50000,'需求确认',1,60,2,'2026-06-15');
  insOpp.run('刘建国企业办公用品年框',2,120000,'方案报价',2,40,2,'2026-06-30');
  insOpp.run('李佳琪美妆品牌合作',5,200000,'商务谈判',3,70,3,'2026-06-10');
  insOpp.run('蒋晓晓季节新品采购',8,80000,'需求确认',1,50,3,'2026-07-01');
  insOpp.run('秦岚公司季度采购',7,60000,'方案报价',2,45,3,'2026-06-20');

  // Campaigns
  const insCamp = db.prepare(`INSERT INTO marketing_campaign (name,type,description,status,target_group) VALUES (?,?,?,?,?)`);
  insCamp.run('五一狂欢节满减','满减','全场满200减50，会员额外9折','进行中','全部');
  insCamp.run('高价值客户专属福利','促销','高价值客户专享8折优惠券','进行中','高价值');
  insCamp.run('初夏新品首发','新品','新品上市限时优惠','进行中','全部');

  // Members
  const insMem = db.prepare('INSERT INTO member (customer_id,card_level,points) VALUES (?,?,?)');
  insMem.run(1,'金卡',6200);
  insMem.run(2,'金卡',7800);
  insMem.run(3,'银卡',2500);
  insMem.run(5,'金卡',9500);

  // Employee Performance
  const insPerf = db.prepare('INSERT INTO employee_performance (employee_id,month,sales_amount,new_customers,follow_up_count) VALUES (?,?,?,?,?)');
  insPerf.run(2,'2026-04',28000,12,25);
  insPerf.run(3,'2026-04',32000,15,28);
  insPerf.run(2,'2026-03',22000,10,22);
  insPerf.run(3,'2026-03',19500,9,20);

  // Todos
  const insTodo = db.prepare(`INSERT INTO todo_task (employee_id,type,content,customer_id,deadline,status) VALUES (?,?,?,?,datetime('now','+1 day'),'待办')`);
  insTodo.run(2,'跟进','跟进客户王大明，邀约到店',4);
  insTodo.run(2,'回访','回访客户陈思雨，了解使用体验',1);
  insTodo.run(3,'跟进','跟进客户韩梅梅',null);
  insTodo.run(3,'活动','通知高价值客户五一活动',null);

  // Schedules
  const insSched = db.prepare(`INSERT INTO crm_schedule (title,content,start_time,end_time,type,priority,owner_id,status) VALUES (?,?,datetime('now','+2 hours'),datetime('now','+3 hours'),?,?,?,'待办')`);
  insSched.run('团队周会','讨论本周销售目标','会议','高',1);
  insSched.run('客户拜访-陈思雨','到店拜访，推荐新品','拜访','高',2);
  insSched.run('方案评审','刘建国企业采购方案内审','任务','中',2);

  // Notices
  const insNotice = db.prepare(`INSERT INTO crm_notice (title,content,type,status,publisher_id,publish_time) VALUES (?,?,?,?,?,datetime('now'))`);
  insNotice.run('系统上线通知','CRM系统正式上线，请各位同事登录体验','通知','已发布',1);
  insNotice.run('五一促销活动','五一期间促销活动方案已确认，请各部门配合执行','活动','已发布',1);

  // Dict types
  const insDt = db.prepare('INSERT INTO sys_dict_type (dict_name,dict_type,status) VALUES (?,?,1)');
  insDt.run('客户来源','customer_source');
  insDt.run('客户等级','customer_level');
  insDt.run('商机阶段','opportunity_stage');

  // Dict data
  const insDd = db.prepare('INSERT INTO sys_dict_data (dict_type,dict_label,dict_value,sort_order,status) VALUES (?,?,?,?,1)');
  const dd = [
    ['customer_source','门店','store',1],['customer_source','小程序','miniapp',2],
    ['customer_source','地推','field',3],['customer_source','网站','web',4],
    ['customer_level','高价值','high',1],['customer_level','普通','normal',2],
    ['customer_level','沉睡','sleep',3],
    ['opportunity_stage','初步接触','initial',1],['opportunity_stage','需求确认','need',2],
    ['opportunity_stage','方案报价','proposal',3],['opportunity_stage','商务谈判','negotiate',4],
    ['opportunity_stage','合同签约','contract',5],['opportunity_stage','赢单','won',6],
    ['opportunity_stage','输单','lost',7],
  ];
  for (const d of dd) insDd.run(...d);

  console.log('Database initialized with seed data.');
}

export default _db;
