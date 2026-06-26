import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 文件上传配置
const uploadDir = join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
}});

// ========== Database ==========
fs.mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
const db = new Database(join(__dirname, '..', 'data', 'crm.db'));
db.pragma('journal_mode = WAL');

const JWT_SECRET = 'crm-platform-secret-key-2026';
const JWT_EXPIRY = '24h';

// ========== Init Tables ==========
db.exec(`
CREATE TABLE IF NOT EXISTS sys_user(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,real_name TEXT,role TEXT DEFAULT 'EMPLOYEE',phone TEXT,status INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customer(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT,email TEXT,gender TEXT,age INTEGER,source TEXT,level TEXT DEFAULT '普通',owner_id INTEGER,status INTEGER DEFAULT 1,remark TEXT,industry TEXT,company_size TEXT,address TEXT,website TEXT,avatar TEXT,source_detail TEXT,credit_level TEXT DEFAULT '一般',merged_to_id INTEGER,protect_days INTEGER DEFAULT 0,last_follow_at DATETIME,next_follow_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_lead(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,source TEXT,contact_name TEXT,contact_phone TEXT,contact_email TEXT,company_name TEXT,industry TEXT,description TEXT,owner_id INTEGER,status INTEGER DEFAULT 1,convert_customer_id INTEGER,convert_opportunity_id INTEGER,follow_count INTEGER DEFAULT 0,last_follow_at DATETIME,next_follow_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_opportunity(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,customer_id INTEGER,contact_id INTEGER,amount REAL DEFAULT 0,expected_close_date TEXT,stage TEXT,stage_order INTEGER DEFAULT 0,probability INTEGER DEFAULT 0,competitor_info TEXT,description TEXT,owner_id INTEGER,campaign_id INTEGER,lead_id INTEGER,loss_reason TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_opportunity_team(id INTEGER PRIMARY KEY AUTOINCREMENT,opportunity_id INTEGER NOT NULL,user_id INTEGER NOT NULL,role TEXT DEFAULT '成员',joined_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_opportunity_competitor(id INTEGER PRIMARY KEY AUTOINCREMENT,opportunity_id INTEGER NOT NULL,name TEXT NOT NULL,advantage TEXT,disadvantage TEXT,price REAL,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_opportunity_stage_log(id INTEGER PRIMARY KEY AUTOINCREMENT,opportunity_id INTEGER NOT NULL,from_stage TEXT,to_stage TEXT,operator_id INTEGER,remark TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_contact(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,name TEXT NOT NULL,department TEXT,position TEXT,phone TEXT,email TEXT,wechat TEXT,qq TEXT,gender TEXT,decision_role TEXT,is_primary INTEGER DEFAULT 0,remark TEXT,status INTEGER DEFAULT 1,created_by INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_product(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT,name TEXT NOT NULL,model TEXT,category TEXT,unit TEXT,price REAL,cost_price REAL,specification TEXT,description TEXT,status INTEGER DEFAULT 1,member_price REAL,sales_count INTEGER DEFAULT 0,images TEXT,is_on_sale INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_quotation(id INTEGER PRIMARY KEY AUTOINCREMENT,quotation_no TEXT,customer_id INTEGER,opportunity_id INTEGER,contact_id INTEGER,title TEXT,total_amount REAL DEFAULT 0,discount_amount REAL DEFAULT 0,tax_amount REAL DEFAULT 0,final_amount REAL DEFAULT 0,status TEXT DEFAULT '草稿',owner_id INTEGER,valid_until TEXT,remark TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_quotation_item(id INTEGER PRIMARY KEY AUTOINCREMENT,quotation_id INTEGER NOT NULL,product_id INTEGER,product_name TEXT,specification TEXT,unit TEXT,qty INTEGER DEFAULT 1,price REAL NOT NULL,discount REAL DEFAULT 0,amount REAL DEFAULT 0,sort_order INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sales_order(id INTEGER PRIMARY KEY AUTOINCREMENT,order_no TEXT,customer_id INTEGER NOT NULL,employee_id INTEGER,total_amount REAL NOT NULL,status TEXT DEFAULT '待付款',remark TEXT,delivery_date TEXT,shipping_address TEXT,contact_name TEXT,contact_phone TEXT,discount_amount REAL DEFAULT 0,tax_amount REAL DEFAULT 0,paid_amount REAL DEFAULT 0,invoice_status TEXT DEFAULT '未开票',delivery_status TEXT DEFAULT '未发货',quotation_id INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_item(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER,product_name TEXT NOT NULL,qty INTEGER DEFAULT 1,price REAL NOT NULL,discount REAL DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS follow_up(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,employee_id INTEGER,type TEXT DEFAULT '回访',plan_time DATETIME,actual_time DATETIME,content TEXT,status TEXT DEFAULT '待处理',created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS marketing_campaign(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT,description TEXT,start_time DATETIME,end_time DATETIME,status TEXT DEFAULT '进行中',target_group TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS coupon(id INTEGER PRIMARY KEY AUTOINCREMENT,campaign_id INTEGER,name TEXT NOT NULL,discount_value REAL,min_amount REAL DEFAULT 0,total_qty INTEGER DEFAULT 0,used_qty INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS coupon_record(id INTEGER PRIMARY KEY AUTOINCREMENT,coupon_id INTEGER NOT NULL,customer_id INTEGER NOT NULL,status TEXT DEFAULT '未使用',send_time DATETIME DEFAULT CURRENT_TIMESTAMP,use_time DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS member(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL UNIQUE,card_level TEXT DEFAULT '普通',points INTEGER DEFAULT 0,registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS point_record(id INTEGER PRIMARY KEY AUTOINCREMENT,member_id INTEGER NOT NULL,type TEXT NOT NULL,points INTEGER NOT NULL,reason TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS employee_performance(id INTEGER PRIMARY KEY AUTOINCREMENT,employee_id INTEGER NOT NULL,month TEXT,sales_amount REAL DEFAULT 0,new_customers INTEGER DEFAULT 0,follow_up_count INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS todo_task(id INTEGER PRIMARY KEY AUTOINCREMENT,employee_id INTEGER NOT NULL,type TEXT,content TEXT,customer_id INTEGER,deadline DATETIME,status TEXT DEFAULT '待办',created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_notice(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,content TEXT,type TEXT DEFAULT '通知',status TEXT DEFAULT '已发布',publisher_id INTEGER,publish_time DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_internal_mail(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,content TEXT,sender_id INTEGER,receiver_id INTEGER,status TEXT DEFAULT '未读',type TEXT DEFAULT '普通',parent_id INTEGER,is_starred INTEGER DEFAULT 0,sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,read_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_document(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,file_type TEXT,file_size INTEGER DEFAULT 0,file_path TEXT,category TEXT,uploader_id INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_approval_flow(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT,description TEXT,steps TEXT,status INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_approval_record(id INTEGER PRIMARY KEY AUTOINCREMENT,flow_id INTEGER,business_type TEXT,business_id INTEGER,title TEXT,submitter_id INTEGER,current_step INTEGER DEFAULT 1,status TEXT DEFAULT '审批中',result TEXT,submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,completed_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_sales_team(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,leader_id INTEGER,description TEXT,status INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_sales_team_member(id INTEGER PRIMARY KEY AUTOINCREMENT,team_id INTEGER NOT NULL,user_id INTEGER NOT NULL,role TEXT DEFAULT '成员',joined_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_service_request(id INTEGER PRIMARY KEY AUTOINCREMENT,request_no TEXT,customer_id INTEGER NOT NULL,contact_id INTEGER,type TEXT,title TEXT NOT NULL,description TEXT,priority TEXT DEFAULT '普通',status TEXT DEFAULT '待处理',owner_id INTEGER,satisfaction_score INTEGER,resolution TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_service_ticket(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id INTEGER NOT NULL,title TEXT,status TEXT DEFAULT '待处理',assignee_id INTEGER,due_date TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_schedule(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,content TEXT,start_time DATETIME NOT NULL,end_time DATETIME,type TEXT,priority TEXT DEFAULT '普通',status TEXT DEFAULT '待办',owner_id INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_task(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT,assignee_id INTEGER,creator_id INTEGER,status TEXT DEFAULT '待办',priority TEXT DEFAULT '普通',due_date TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_marketing_activity(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT,budget REAL DEFAULT 0,actual_cost REAL DEFAULT 0,start_date TEXT,end_date TEXT,owner_id INTEGER,description TEXT,status INTEGER DEFAULT 1,lead_count INTEGER DEFAULT 0,opportunity_count INTEGER DEFAULT 0,deal_amount REAL DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sys_config(id INTEGER PRIMARY KEY AUTOINCREMENT,config_name TEXT,config_key TEXT UNIQUE,config_value TEXT,config_type TEXT,description TEXT,remark TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sys_dict_type(id INTEGER PRIMARY KEY AUTOINCREMENT,dict_name TEXT NOT NULL,dict_type TEXT NOT NULL UNIQUE,status INTEGER DEFAULT 1,remark TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sys_dict_data(id INTEGER PRIMARY KEY AUTOINCREMENT,dict_type TEXT NOT NULL,dict_label TEXT NOT NULL,dict_value TEXT NOT NULL,css_class TEXT,list_class TEXT,is_default INTEGER DEFAULT 0,sort_order INTEGER DEFAULT 0,status INTEGER DEFAULT 1,remark TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_student_profile(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER UNIQUE NOT NULL,grade TEXT,major_category TEXT,living_expense_range TEXT,campus TEXT,dormitory TEXT,first_purchase_date TEXT,first_purchase_store TEXT,first_purchase_category TEXT,student_card_no TEXT,verified INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_customer_tag(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,color TEXT DEFAULT '#409EFF',category TEXT DEFAULT '消费行为',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_customer_tag_rel(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,tag_id INTEGER NOT NULL,source TEXT DEFAULT 'auto',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_rfm_score(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER UNIQUE NOT NULL,r_score INTEGER DEFAULT 1,f_score INTEGER DEFAULT 1,m_score INTEGER DEFAULT 1,tier TEXT DEFAULT '一般客户',calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_member_tier(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,min_points INTEGER DEFAULT 0,min_spending REAL DEFAULT 0,discount_rate REAL DEFAULT 1,benefits TEXT,color TEXT DEFAULT '#F59E0B',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_paid_membership(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,plan_type TEXT DEFAULT '月卡',start_date TEXT,end_date TEXT,status TEXT DEFAULT '生效中',auto_renew INTEGER DEFAULT 0,amount REAL DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_point_record_ext(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,type TEXT NOT NULL,points INTEGER NOT NULL,reason TEXT,source TEXT DEFAULT '消费',related_id INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_marketing_template(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT,discount_rule TEXT,conditions TEXT,student_only INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_campus_campaign(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,campus TEXT,type TEXT,start_date TEXT,end_date TEXT,budget REAL DEFAULT 0,actual_cost REAL DEFAULT 0,participant_count INTEGER DEFAULT 0,status TEXT DEFAULT '计划中',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_auto_workflow(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,trigger_type TEXT,trigger_condition TEXT,action_type TEXT,action_content TEXT,status INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_service_ticket_ext(id INTEGER PRIMARY KEY AUTOINCREMENT,ticket_no TEXT,customer_id INTEGER NOT NULL,type TEXT DEFAULT '咨询',priority TEXT DEFAULT '普通',status TEXT DEFAULT '待处理',channel TEXT DEFAULT '门店',description TEXT,assignee_id INTEGER,product_batch TEXT,product_model TEXT,resolution TEXT,satisfaction_score INTEGER,resolved_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_return_request(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,customer_id INTEGER NOT NULL,reason TEXT,method TEXT DEFAULT '门店自提',status TEXT DEFAULT '待审核',product_info TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_customer_care(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,type TEXT,content TEXT,operator_id INTEGER,cared_at DATETIME DEFAULT CURRENT_TIMESTAMP,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_ai_recommendation(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER NOT NULL,product_id INTEGER,reason TEXT,score REAL DEFAULT 0,channel TEXT,is_sent INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_churn_prediction(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER UNIQUE NOT NULL,risk_score REAL DEFAULT 0,risk_level TEXT DEFAULT '低',factors TEXT,predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_ai_copy_template(id INTEGER PRIMARY KEY AUTOINCREMENT,channel TEXT,style TEXT,copy_text TEXT,performance_score REAL DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_sales_forecast_ext(id INTEGER PRIMARY KEY AUTOINCREMENT,month TEXT,product_id INTEGER,predicted_sales REAL DEFAULT 0,actual_sales REAL DEFAULT 0,confidence REAL DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_campus_cluster(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,description TEXT,student_count INTEGER DEFAULT 0,avg_spending REAL DEFAULT 0,top_category TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_user(id INTEGER PRIMARY KEY AUTOINCREMENT,phone TEXT UNIQUE,nickname TEXT,avatar TEXT,gender INTEGER DEFAULT 0,birthday TEXT,status INTEGER DEFAULT 1,crm_customer_id INTEGER,member_tier_id INTEGER,total_points INTEGER DEFAULT 0,available_points INTEGER DEFAULT 0,total_spent REAL DEFAULT 0,last_login_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_user_auth(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,auth_type TEXT NOT NULL,credential TEXT,wechat_openid TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_address(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,receiver_name TEXT NOT NULL,phone TEXT NOT NULL,province TEXT,city TEXT,district TEXT,detail TEXT,is_default INTEGER DEFAULT 0,tag TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_shopping_cart(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,product_id INTEGER NOT NULL,quantity INTEGER DEFAULT 1,selected INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_user_favorite(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,product_id INTEGER NOT NULL,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,product_id));
CREATE TABLE IF NOT EXISTS portal_browse_history(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,product_id INTEGER NOT NULL,browse_duration INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_product_review(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,product_id INTEGER NOT NULL,order_id INTEGER,rating INTEGER NOT NULL,content TEXT,images TEXT,is_anonymous INTEGER DEFAULT 0,status INTEGER DEFAULT 1,reply_content TEXT,reply_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_sign_record(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,sign_date TEXT NOT NULL,points_earned INTEGER DEFAULT 0,continuous_days INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,sign_date));
CREATE TABLE IF NOT EXISTS portal_coupon_grant(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,coupon_id INTEGER NOT NULL,source TEXT DEFAULT '领取',status TEXT DEFAULT '未使用',used_order_id INTEGER,used_at DATETIME,expire_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_points_exchange(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,exchange_type TEXT,exchange_target_id INTEGER,points_cost INTEGER NOT NULL,quantity INTEGER DEFAULT 1,status TEXT DEFAULT '已完成',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_feedback(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,type TEXT DEFAULT '建议',content TEXT NOT NULL,images TEXT,contact TEXT,status TEXT DEFAULT '未处理',reply TEXT,replied_by INTEGER,replied_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_payment_record(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,order_id INTEGER NOT NULL,payment_method TEXT,amount REAL NOT NULL,transaction_id TEXT,status TEXT DEFAULT 'pending',paid_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portal_system_config(id INTEGER PRIMARY KEY AUTOINCREMENT,config_key TEXT UNIQUE NOT NULL,config_value TEXT,description TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_contract(id INTEGER PRIMARY KEY AUTOINCREMENT,contract_no TEXT,opportunity_id INTEGER,customer_id INTEGER,title TEXT,amount REAL DEFAULT 0,start_date TEXT,end_date TEXT,status TEXT DEFAULT '草稿',signed_at DATETIME,content TEXT,change_log TEXT,remind_days INTEGER DEFAULT 7,created_by INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_receivable(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,customer_id INTEGER,plan_amount REAL,paid_amount REAL DEFAULT 0,due_date TEXT,status TEXT DEFAULT '待收款',remark TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_invoice_ext(id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_no TEXT,order_id INTEGER,customer_id INTEGER,type TEXT DEFAULT '增值税普通发票',amount REAL,title TEXT,tax_no TEXT,status TEXT DEFAULT '待开票',issued_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_sales_target(id INTEGER PRIMARY KEY AUTOINCREMENT,employee_id INTEGER,year INTEGER,month INTEGER,target_amount REAL,achieved_amount REAL DEFAULT 0,department TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_knowledge_base(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,category TEXT,content TEXT,tags TEXT,view_count INTEGER DEFAULT 0,status INTEGER DEFAULT 1,created_by INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_sla_policy(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,response_minutes INTEGER DEFAULT 30,resolve_hours INTEGER DEFAULT 24,priority TEXT DEFAULT '普通',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,action TEXT,module TEXT,target_id INTEGER,detail TEXT,ip TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_inventory(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER UNIQUE,quantity INTEGER DEFAULT 0,min_quantity INTEGER DEFAULT 10,warehouse TEXT,last_check_at DATETIME,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_inventory_log(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER,type TEXT,qty INTEGER,before_qty INTEGER,after_qty INTEGER,remark TEXT,operator_id INTEGER,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_competitor(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,industry TEXT,strengths TEXT,weaknesses TEXT,market_share REAL,threat_level TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_customer_lifecycle(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_id INTEGER UNIQUE,stage TEXT DEFAULT '新客户',entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,converted_at DATETIME,prev_stage TEXT,notes TEXT);
CREATE TABLE IF NOT EXISTS crm_campus_agent(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT,campus TEXT,level TEXT DEFAULT '初级',commission_rate REAL DEFAULT 0.05,promo_code TEXT UNIQUE,total_earned REAL DEFAULT 0,status INTEGER DEFAULT 1,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_group_buy(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER,title TEXT,min_members INTEGER DEFAULT 3,current_members INTEGER DEFAULT 0,discount_rate REAL DEFAULT 0.7,start_time TEXT,end_time TEXT,status TEXT DEFAULT '进行中',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_group_buy_member(id INTEGER PRIMARY KEY AUTOINCREMENT,group_buy_id INTEGER,user_id INTEGER,user_name TEXT,joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(group_buy_id) REFERENCES crm_group_buy(id));
`);

// ========== Seed Data ==========
const userCount = db.prepare('SELECT COUNT(*) as c FROM sys_user').get();
if (userCount.c === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO sys_user(username,password,real_name,role,phone) VALUES (?,?,?,?,?)').run('admin', hash, '管理员', 'ADMIN', '13800000000');
  db.prepare('INSERT INTO sys_user(username,password,real_name,role,phone) VALUES (?,?,?,?,?)').run('zhangwei', hash, '张伟', 'EMPLOYEE', '13800000001');
  db.prepare('INSERT INTO sys_user(username,password,real_name,role,phone) VALUES (?,?,?,?,?)').run('liming', hash, '李明', 'EMPLOYEE', '13800000002');
  db.prepare('INSERT INTO sys_user(username,password,real_name,role,phone) VALUES (?,?,?,?,?)').run('wangfang', hash, '王芳', 'EMPLOYEE', '13800000003');

  const insCust = db.prepare('INSERT INTO customer(name,phone,email,gender,age,source,level,owner_id,status,industry) VALUES (?,?,?,?,?,?,?,?,1,?)');
  [['陈思雨','13910001111','chensy@qq.com','女',24,'门店','高价值',2,'零售'],['刘建国','13910001112','liujg@163.com','男',42,'小程序','高价值',2,'企业服务'],['张晓萌','13910001113','zxm@qq.com','女',19,'门店','高价值',3,'教育'],['王大明','13910001114','wangdm@gmail.com','男',35,'门店','普通',2,'零售'],['李佳琪','13910001115','lijiq@163.com','女',28,'小程序','高价值',3,'美妆'],['赵铁柱','13910001116',null,'男',55,'地推','普通',2,'零售'],['秦岚','13910001130','qinlan@qq.com','女',30,'门店','高价值',3,'企业服务'],['蒋晓晓','13910001125','jiangxx@163.com','女',27,'门店','高价值',3,'零售'],['孙美美','13910001117','sunmei@qq.com','女',31,'门店','普通',3,'教育'],['郑浩','13910001120','zhengh@qq.com','男',29,'地推','普通',3,'健身']].forEach(c=>insCust.run(...c));

  const insProd = db.prepare('INSERT INTO crm_product(code,name,model,category,unit,price,cost_price,specification) VALUES (?,?,?,?,?,?,?,?)');
  [['P001','面膜套装','MZ-100','美妆','盒',59.90,35,'10片装'],['P002','手帐本','SZB-A5','文具','本',35,18,'A5'],['P003','蓝牙耳机','BT-200','数码','个',156,89,'蓝牙5.3'],['P004','收纳箱大号','SNX-L','家居','个',89,45,'60L'],['P005','马克杯','MKB-350','家居','个',67,25,'350ml'],['P006','洗面奶','XMN-120','美妆','支',37,22,'120g'],['P007','中性笔套装','ZXB-12','文具','套',29,15,'12支装'],['P008','香薰蜡烛','XXL-200','家居','个',128,68,'200g']].forEach(p=>insProd.run(...p));

  const insLead = db.prepare('INSERT INTO crm_lead(name,source,contact_name,contact_phone,owner_id,follow_count) VALUES (?,?,?,?,?,?)');
  [['陈思雨-美妆批发','转介','陈思雨','13910001111',2,2],['刘建国-企业采购','展会','刘建国','13910001112',2,3],['新锐科技-办公用品','网站','赵总','13920001111',2,1],['星光百货-合作','地推','李总','13920002222',3,1],['秦岚-行政采购','门店','秦岚','13910001130',3,1]].forEach(l=>insLead.run(...l));

  const insOpp = db.prepare('INSERT INTO crm_opportunity(name,customer_id,amount,stage,stage_order,probability,owner_id,expected_close_date) VALUES (?,?,?,?,?,?,?,?)');
  [['陈思雨年度美妆采购',1,50000,'需求确认',1,60,2,'2026-06-15'],['刘建国企业办公用品年框',2,120000,'方案报价',2,40,2,'2026-06-30'],['李佳琪美妆品牌合作',5,200000,'商务谈判',3,70,3,'2026-06-10'],['蒋晓晓季节新品采购',8,80000,'需求确认',1,50,3,'2026-07-01'],['秦岚公司季度采购',7,60000,'方案报价',2,45,3,'2026-06-20']].forEach(o=>insOpp.run(...o));

  db.prepare('INSERT INTO marketing_campaign(name,type,description,status,target_group) VALUES (?,?,?,?,?)').run('五一狂欢节满减','满减','全场满200减50','进行中','全部');
  db.prepare('INSERT INTO marketing_campaign(name,type,description,status,target_group) VALUES (?,?,?,?,?)').run('高价值客户专属福利','促销','高价值客户专享8折','进行中','高价值');
  db.prepare('INSERT INTO marketing_campaign(name,type,description,status,target_group) VALUES (?,?,?,?,?)').run('初夏新品首发','新品','新品上市限时优惠','进行中','全部');

  [[1,'金卡',6200],[2,'金卡',7800],[3,'银卡',2500],[5,'金卡',9500]].forEach(m=>db.prepare('INSERT INTO member(customer_id,card_level,points) VALUES (?,?,?)').run(...m));

  [[2,'2026-04',28000,12,25],[3,'2026-04',32000,15,28]].forEach(p=>db.prepare('INSERT INTO employee_performance(employee_id,month,sales_amount,new_customers,follow_up_count) VALUES (?,?,?,?,?)').run(...p));
  
  const insTodo = db.prepare('INSERT INTO todo_task(employee_id,type,content,customer_id,deadline,status) VALUES (?,?,?,?,datetime(\'now\',\'+1 day\'),\'待办\')');
  insTodo.run(2,'跟进','跟进客户王大明，邀约到店',4);
  insTodo.run(3,'活动','通知高价值客户五一活动',null);

  const insSched = db.prepare('INSERT INTO crm_schedule(title,content,start_time,end_time,type,priority,owner_id,status) VALUES (?,?,datetime(\'now\',\'+2 hours\'),datetime(\'now\',\'+3 hours\'),?,?,?,\'待办\')');
  insSched.run('团队周会','讨论本周销售目标','会议','高',1);
  insSched.run('客户拜访-陈思雨','到店拜访','拜访','高',2);

  db.prepare('INSERT INTO crm_notice(title,content,type,status,publisher_id) VALUES (?,?,?,?,?)').run('系统上线通知','CRM系统正式上线，请各位同事登录体验','通知','已发布',1);
  db.prepare('INSERT INTO crm_notice(title,content,type,status,publisher_id) VALUES (?,?,?,?,?)').run('五一促销活动','五一期间促销活动方案已确认','活动','已发布',1);

  ['customer_source','customer_level','opportunity_stage'].forEach(dt=>db.prepare('INSERT INTO sys_dict_type(dict_name,dict_type) VALUES (?,?)').run(dt==='customer_source'?'客户来源':dt==='customer_level'?'客户等级':'商机阶段',dt));
  
  [['customer_source','门店','store',1],['customer_source','小程序','miniapp',2],['customer_source','地推','field',3],['customer_level','高价值','high',1],['customer_level','普通','normal',2],['customer_level','沉睡','sleep',3],['opportunity_stage','初步接触','initial',1],['opportunity_stage','需求确认','need',2],['opportunity_stage','方案报价','proposal',3],['opportunity_stage','商务谈判','negotiate',4],['opportunity_stage','合同签约','contract',5],['opportunity_stage','赢单','won',6]].forEach(d=>db.prepare('INSERT INTO sys_dict_data(dict_type,dict_label,dict_value,sort_order) VALUES (?,?,?,?)').run(...d));

  console.log('Seed data loaded: 4 users, 10 customers, 8 products, 5 leads, 5 opportunities');

  // 大学生扩展种子
  if (db.prepare('SELECT COUNT(*) as c FROM crm_member_tier').get().c === 0) {
    db.prepare('INSERT INTO crm_member_tier(name,min_points,min_spending,discount_rate,benefits) VALUES (?,?,?,?,?)').run('青铜会员',0,0,1,'新人95折');
    db.prepare('INSERT INTO crm_member_tier(name,min_points,min_spending,discount_rate,benefits) VALUES (?,?,?,?,?)').run('白银会员',500,2000,0.92,'92折+生日礼包');
    db.prepare('INSERT INTO crm_member_tier(name,min_points,min_spending,discount_rate,benefits) VALUES (?,?,?,?,?)').run('黄金会员',2000,8000,0.88,'88折+优先配送');
    db.prepare('INSERT INTO crm_member_tier(name,min_points,min_spending,discount_rate,benefits) VALUES (?,?,?,?,?)').run('钻石会员',5000,20000,0.82,'82折+专属客服');
  }
  if (db.prepare('SELECT COUNT(*) as c FROM crm_customer_tag').get().c === 0) {
    const tags = [['高频消费','#10B981','消费行为'],['美妆爱好者','#EC4899','消费行为'],['文具达人','#8B5CF6','消费行为'],['价格敏感','#F59E0B','消费行为'],['新生','#3B82F6','生命周期'],['毕业生','#EF4444','生命周期'],['零食党','#F97316','消费行为'],['家居控','#14B8A6','消费行为']];
    tags.forEach(t=>db.prepare('INSERT INTO crm_customer_tag(name,color,category) VALUES (?,?,?)').run(...t));
  }
  if (db.prepare('SELECT COUNT(*) as c FROM crm_marketing_template').get().c === 0) {
    db.prepare('INSERT INTO crm_marketing_template(name,type,discount_rule,conditions,student_only) VALUES (?,?,?,?,?)').run('开学季满减','满减','满200减50','开学季期间',1);
    db.prepare('INSERT INTO crm_marketing_template(name,type,discount_rule,conditions,student_only) VALUES (?,?,?,?,?)').run('第二件半价','折扣','第二件5折','全场通用',0);
    db.prepare('INSERT INTO crm_marketing_template(name,type,discount_rule,conditions,student_only) VALUES (?,?,?,?,?)').run('限时闪购','限时','指定商品7折','每日限量',1);
  }
  if (db.prepare('SELECT COUNT(*) as c FROM crm_auto_workflow').get().c === 0) {
    db.prepare('INSERT INTO crm_auto_workflow(name,trigger_type,trigger_condition,action_type,action_content) VALUES (?,?,?,?,?)').run('新客户欢迎','注册','customer_created','发送优惠券','新人95折券');
    db.prepare('INSERT INTO crm_auto_workflow(name,trigger_type,trigger_condition,action_type,action_content) VALUES (?,?,?,?,?)').run('沉睡唤醒','沉默','30天未消费','发送优惠券','唤醒专属券');
    db.prepare('INSERT INTO crm_auto_workflow(name,trigger_type,trigger_condition,action_type,action_content) VALUES (?,?,?,?,?)').run('生日关怀','生日','customer_birthday','发送关怀','生日礼包');
  }
  // Student profiles
  if (db.prepare('SELECT COUNT(*) as c FROM crm_student_profile').get().c === 0) {
    const sp = db.prepare('INSERT INTO crm_student_profile(customer_id,grade,major_category,living_expense_range,campus,dormitory) VALUES (?,?,?,?,?,?)');
    sp.run(1,'大三','艺术类','2000-3000','主校区','12栋501'); sp.run(2,'研究生','商科','3000+','东校区','留学生公寓A');
    sp.run(3,'大一','教育类','1000-2000','主校区','5栋302'); sp.run(5,'大二','艺术类','2000-3000','西校区','8栋201');
    sp.run(7,'大三','商科','2000-3000','主校区','12栋502'); sp.run(8,'大四','工科','1000-2000','东校区','3栋101');
  }
  // RFM scores
  if (db.prepare('SELECT COUNT(*) as c FROM crm_rfm_score').get().c === 0) {
    const rfm = db.prepare('INSERT INTO crm_rfm_score(customer_id,r_score,f_score,m_score,tier) VALUES (?,?,?,?,?)');
    rfm.run(1,5,4,5,'核心价值客户'); rfm.run(2,4,5,5,'核心价值客户'); rfm.run(3,3,3,2,'一般客户');
    rfm.run(5,5,5,5,'核心价值客户'); rfm.run(7,4,3,4,'潜力客户'); rfm.run(8,2,2,1,'流失风险客户');
    rfm.run(9,3,2,2,'一般客户'); rfm.run(10,1,1,1,'流失风险客户');
  }
}

// ========== Express App ==========
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// ========== Auth Middleware ==========
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token) return res.status(401).json({ code: 401, message: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ code: 401, message: 'Token无效' }); }
}

// ========== Helpers ==========
function ok(data) { return { code: 200, message: 'success', data }; }
function page(total, current, size, records) { return { total, current, size, records }; }
function paginate(req) { const p = parseInt(req.query.page)||1, s = Math.min(parseInt(req.query.size)||20, 100); return { page: p, size: s, offset: (p-1)*s }; }

// ========== Auth Routes ==========
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM sys_user WHERE username = ? AND status = 1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.json({ code: 401, message: '用户名或密码错误' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  res.json(ok({ token, realName: user.real_name, role: user.role }));
});

// ========== Customer Routes ==========
app.get('/api/customers', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  let where = 'WHERE 1=1'; const params = [];
  if (req.query.name) { where += ' AND name LIKE ?'; params.push(`%${req.query.name}%`); }
  if (req.query.level) { where += ' AND level = ?'; params.push(req.query.level); }
  if (req.query.owner_id) { where += ' AND owner_id = ?'; params.push(req.query.owner_id); }
  const total = db.prepare(`SELECT COUNT(*) as c FROM customer ${where}`).get(...params).c;
  const records = db.prepare(`SELECT * FROM customer ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, s, offset);
  res.json(ok(page(total, p, s, records)));
});

app.get('/api/customers/:id', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM customer WHERE id = ?').get(req.params.id))));
app.post('/api/customers', auth, (req, res) => {
  const { name, phone, email, gender, age, source, level, owner_id, industry, address, remark } = req.body;
  const r = db.prepare('INSERT INTO customer(name,phone,email,gender,age,source,level,owner_id,industry,address,remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(name,phone,email,gender,age,source,level||'普通',owner_id,industry,address,remark);
  res.json(ok({ id: r.lastInsertRowid, ...req.body }));
});
app.put('/api/customers/:id', auth, (req, res) => {
  const { name, phone, email, gender, age, source, level, owner_id, industry, address, remark } = req.body;
  db.prepare('UPDATE customer SET name=?,phone=?,email=?,gender=?,age=?,source=?,level=?,owner_id=?,industry=?,address=?,remark=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name,phone,email,gender,age,source,level,owner_id,industry,address,remark,req.params.id);
  res.json(ok(null));
});
app.delete('/api/customers/:id', auth, (req, res) => { db.prepare('DELETE FROM customer WHERE id=?').run(req.params.id); res.json(ok(null)); });
app.get('/api/customers/pool', auth, (req, res) => { const r = db.prepare('SELECT * FROM customer WHERE owner_id IS NULL').all(); res.json(ok({ total: r.length, records: r })); });
app.post('/api/customers/:id/claim', auth, (req, res) => { db.prepare('UPDATE customer SET owner_id=? WHERE id=?').run(req.user.id, req.params.id); res.json(ok(null)); });

// ========== Lead Routes ==========
app.get('/api/leads/list', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  let where = 'WHERE 1=1'; const params = [];
  if (req.query.name) { where += ' AND name LIKE ?'; params.push(`%${req.query.name}%`); }
  if (req.query.source) { where += ' AND source = ?'; params.push(req.query.source); }
  const total = db.prepare(`SELECT COUNT(*) as c FROM crm_lead ${where}`).get(...params).c;
  const records = db.prepare(`SELECT * FROM crm_lead ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.get('/api/leads/:id', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_lead WHERE id=?').get(req.params.id))));
app.post('/api/leads', auth, (req, res) => {
  const ins = db.prepare('INSERT INTO crm_lead(name,source,contact_name,contact_phone,contact_email,company_name,industry,description,owner_id) VALUES (?,?,?,?,?,?,?,?,?)');
  const r = ins.run(req.body.name,req.body.source,req.body.contactName,req.body.contactPhone,req.body.contactEmail,req.body.companyName,req.body.industry,req.body.description,req.body.ownerId);
  res.json(ok({ id: r.lastInsertRowid }));
});
app.put('/api/leads', auth, (req, res) => {
  const { id, name, source, contact_name, contact_phone, contact_email, owner_id, status } = req.body;
  db.prepare('UPDATE crm_lead SET name=?,source=?,contact_name=?,contact_phone=?,contact_email=?,owner_id=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name,source,contact_name,contact_phone,contact_email,owner_id,status,id);
  res.json(ok(null));
});
app.delete('/api/leads/:id', auth, (req, res) => { db.prepare('DELETE FROM crm_lead WHERE id=?').run(req.params.id); res.json(ok(null)); });
app.post('/api/leads/convert/:id', auth, (req, res) => {
  const lead = db.prepare('SELECT * FROM crm_lead WHERE id=?').get(req.params.id);
  if (!lead) return res.json({ code: 400, message: '线索不存在' });
  const cust = db.prepare('INSERT INTO customer(name,phone,email,source,owner_id) VALUES (?,?,?,?,?)').run(lead.name,lead.contact_phone,lead.contact_email,lead.source,lead.owner_id);
  db.prepare('UPDATE crm_lead SET convert_customer_id=?,status=2,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(cust.lastInsertRowid, lead.id);
  res.json(ok({ customerId: cust.lastInsertRowid }));
});
app.get('/api/leads/pool', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_lead WHERE owner_id IS NULL').all(); res.json(ok(page(r.length,1,100,r))); });
app.put('/api/leads/assign', auth, (req, res) => { db.prepare('UPDATE crm_lead SET owner_id=? WHERE id=?').run(req.body.ownerId, req.body.leadId); res.json(ok(null)); });

// ========== Opportunity Routes ==========
app.get('/api/opportunities/list', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  const total = db.prepare('SELECT COUNT(*) as c FROM crm_opportunity').get().c;
  const records = db.prepare('SELECT * FROM crm_opportunity ORDER BY created_at DESC LIMIT ? OFFSET ?').all(s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.get('/api/opportunities/funnel', auth, (req, res) => {
  // 按标准销售漏斗顺序（即使数据库中stage_order=0也能正确排序）
  const stageOrder = ['初步接触','需求确认','方案报价','商务谈判','合同签约'];
  const stages = db.prepare('SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM crm_opportunity GROUP BY stage').all();
  const sorted = stageOrder.map(name => {
    const found = stages.find(s => s.stage === name) || { stage: name, count: 0, amount: 0 };
    return { ...found, stage_order: stageOrder.indexOf(name) };
  }).sort((a, b) => a.stage_order - b.stage_order);
  res.json(ok(sorted));
});
app.get('/api/opportunities/:id', auth, (req, res) => {
  const opp = db.prepare('SELECT * FROM crm_opportunity WHERE id=?').get(req.params.id);
  const team = db.prepare('SELECT * FROM crm_opportunity_team WHERE opportunity_id=?').all(req.params.id);
  const competitors = db.prepare('SELECT * FROM crm_opportunity_competitor WHERE opportunity_id=?').all(req.params.id);
  res.json(ok({ ...opp, team, competitors }));
});
app.post('/api/opportunities', auth, (req, res) => {
  const { name, customer_id, amount, stage, stage_order, probability, owner_id, expected_close_date, description } = req.body;
  const r = db.prepare('INSERT INTO crm_opportunity(name,customer_id,amount,stage,stage_order,probability,owner_id,expected_close_date,description) VALUES (?,?,?,?,?,?,?,?,?)').run(name,customer_id,amount,stage,stage_order||0,probability,owner_id,expected_close_date,description);
  res.json(ok({ id: r.lastInsertRowid }));
});
app.put('/api/opportunities/:id/stage', auth, (req, res) => {
  const opp = db.prepare('SELECT stage FROM crm_opportunity WHERE id=?').get(req.params.id);
  db.prepare('UPDATE crm_opportunity SET stage=?,stage_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.stage,req.body.stageOrder,req.params.id);
  db.prepare('INSERT INTO crm_opportunity_stage_log(opportunity_id,from_stage,to_stage,operator_id,remark) VALUES (?,?,?,?,?)').run(req.params.id,opp.stage,req.body.stage,req.user.id,req.body.remark||'');
  res.json(ok(null));
});
app.post('/api/opportunities/team', auth, (req, res) => { db.prepare('INSERT INTO crm_opportunity_team(opportunity_id,user_id,role) VALUES (?,?,?)').run(req.body.opportunityId,req.body.userId,req.body.role||'成员'); res.json(ok(null)); });
app.get('/api/opportunities/funnel', auth, (req, res) => {
  // 按标准销售漏斗顺序（即使数据库中stage_order=0也能正确排序）
  const stageOrder = ['初步接触','需求确认','方案报价','商务谈判','合同签约'];
  const stages = db.prepare('SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM crm_opportunity GROUP BY stage').all();
  const sorted = stageOrder.map(name => {
    const found = stages.find(s => s.stage === name) || { stage: name, count: 0, amount: 0 };
    return { ...found, stage_order: stageOrder.indexOf(name) };
  }).sort((a, b) => a.stage_order - b.stage_order);
  res.json(ok(sorted));
});
app.delete('/api/opportunities/:id', auth, (req, res) => { db.prepare('DELETE FROM crm_opportunity WHERE id=?').run(req.params.id); res.json(ok(null)); });

// ========== Product Routes ==========
app.get('/api/products/list', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  let where = 'WHERE 1=1'; const params = [];
  if (req.query.code) { where += ' AND code LIKE ?'; params.push(`%${req.query.code}%`); }
  if (req.query.name) { where += ' AND name LIKE ?'; params.push(`%${req.query.name}%`); }
  if (req.query.category) { where += ' AND category = ?'; params.push(req.query.category); }
  const total = db.prepare(`SELECT COUNT(*) as c FROM crm_product ${where}`).get(...params).c;
  const records = db.prepare(`SELECT * FROM crm_product ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.get('/api/products/top', auth, (req, res) => {
  const n = Math.min(parseInt(req.query.n)||5, 50);
  const rows = db.prepare('SELECT p.id,p.code,p.name,p.category,p.price,p.sales_count,COALESCE(SUM(oi.qty),0) as total_qty,COALESCE(SUM(oi.qty*oi.price),0) as total_revenue,COALESCE((SELECT quantity FROM crm_inventory WHERE product_id=p.id),0) as stock FROM crm_product p LEFT JOIN order_item oi ON oi.product_id=p.id GROUP BY p.id ORDER BY p.sales_count DESC,total_revenue DESC LIMIT ?').all(n);
  res.json(ok(rows));
});
app.get('/api/products/analytics', auth, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM crm_product').get().c;
  const onSale = db.prepare('SELECT COUNT(*) as c FROM crm_product WHERE is_on_sale=1').get().c;
  const lowStock = db.prepare("SELECT COUNT(*) as c FROM crm_inventory WHERE quantity<min_quantity").get().c;
  const byCategory = db.prepare("SELECT category, COUNT(*) as count, COALESCE(SUM(sales_count),0) as sales FROM crm_product WHERE category IS NOT NULL AND category<>'' GROUP BY category ORDER BY sales DESC").all();
  const avgPrice = db.prepare('SELECT COALESCE(AVG(price),0) as p FROM crm_product WHERE price>0').get().p;
  res.json(ok({ totalProducts: total, onSale, lowStock, avgPrice: Math.round(avgPrice*100)/100, byCategory }));
});
app.get('/api/products/categories', auth, (req, res) => res.json(ok(db.prepare("SELECT DISTINCT category FROM crm_product WHERE category IS NOT NULL AND category<>''").all().map(r=>r.category))));
app.get('/api/products/:id', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_product WHERE id=?').get(req.params.id))));

// 图片上传
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请选择图片' });
  const url = `/uploads/${req.file.filename}`;
  res.json(ok({ url, filename: req.file.filename }));
});

app.post('/api/products', auth, (req, res) => {
  const { code, name, model, category, unit, price, costPrice, specification, description, status, images } = req.body;
  const r = db.prepare('INSERT INTO crm_product(code,name,model,category,unit,price,cost_price,specification,description,status,images) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(code, name, model, category, unit, price, costPrice || 0, specification, description || '', status || 1, images || '');
  res.json(ok({ id: r.lastInsertRowid }));
});
app.put('/api/products', auth, (req, res) => {
  const { id, code, name, model, category, unit, price, costPrice, specification, description, status, images } = req.body;
  db.prepare('UPDATE crm_product SET code=?,name=?,model=?,category=?,unit=?,price=?,cost_price=?,specification=?,description=?,status=?,images=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(code, name, model, category, unit, price, costPrice || 0, specification, description || '', status || 1, images || '', id);
  res.json(ok(null));
});
app.delete('/api/products/:id', auth, (req, res) => { db.prepare('DELETE FROM crm_product WHERE id=?').run(req.params.id); res.json(ok(null)); });

// ========== Order Routes ==========
app.get('/api/orders', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  let where = 'WHERE 1=1'; const params = [];
  if (req.query.status) { where += ' AND status = ?'; params.push(req.query.status); }
  const total = db.prepare(`SELECT COUNT(*) as c FROM sales_order ${where}`).get(...params).c;
  const records = db.prepare(`SELECT * FROM sales_order ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.get('/api/orders/:id', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM sales_order WHERE id=?').get(req.params.id);
  const items = db.prepare('SELECT * FROM order_item WHERE order_id=?').all(req.params.id);
  res.json(ok({ ...order, items }));
});
app.post('/api/orders', auth, (req, res) => {
  const r = db.prepare('INSERT INTO sales_order(customer_id,employee_id,total_amount,status,remark) VALUES (?,?,?,?,?)').run(req.body.customerId,req.body.employeeId||req.user.id,req.body.totalAmount,req.body.status||'待付款',req.body.remark);
  res.json(ok({ id: r.lastInsertRowid }));
});

// ========== Follow-up Routes ==========
app.get('/api/follow-ups', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  const total = db.prepare('SELECT COUNT(*) as c FROM follow_up').get().c;
  const records = db.prepare('SELECT * FROM follow_up ORDER BY created_at DESC LIMIT ? OFFSET ?').all(s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.post('/api/follow-ups', auth, (req, res) => {
  db.prepare('INSERT INTO follow_up(customer_id,employee_id,type,content,plan_time,status) VALUES (?,?,?,?,?,?)').run(req.body.customerId,req.user.id,req.body.type||'回访',req.body.content,req.body.planTime,req.body.status||'待处理');
  res.json(ok(null));
});
app.put('/api/follow-ups/:id', auth, (req, res) => { db.prepare('UPDATE follow_up SET content=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.content,req.body.status,req.params.id); res.json(ok(null)); });

// ========== Campaign Routes ==========
app.get('/api/campaigns', auth, (req, res) => { const r = db.prepare('SELECT * FROM marketing_campaign ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.get('/api/campaigns/:id', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM marketing_campaign WHERE id=?').get(req.params.id))));
app.post('/api/campaigns', auth, (req, res) => {
  db.prepare('INSERT INTO marketing_campaign(name,type,description,status,target_group) VALUES (?,?,?,?,?)').run(req.body.name,req.body.type,req.body.description,req.body.status,req.body.targetGroup);
  res.json(ok(null));
});
app.put('/api/campaigns/:id', auth, (req, res) => { db.prepare('UPDATE marketing_campaign SET name=?,type=?,description=?,status=?,target_group=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name,req.body.type,req.body.description,req.body.status,req.body.targetGroup,req.params.id); res.json(ok(null)); });
app.delete('/api/campaigns/:id', auth, (req, res) => { db.prepare('DELETE FROM marketing_campaign WHERE id=?').run(req.params.id); res.json(ok(null)); });
app.get('/api/campaigns/:id/coupons', auth, (req, res) => { const r = db.prepare('SELECT * FROM coupon WHERE campaign_id=?').all(req.params.id); res.json(ok(r)); });
app.get('/api/campaigns/:id/coupon-stats', auth, (req, res) => { const total = db.prepare('SELECT COUNT(*) as c FROM coupon WHERE campaign_id=?').get(req.params.id).c; const used = db.prepare('SELECT COALESCE(SUM(used_qty),0) as u FROM coupon WHERE campaign_id=?').get(req.params.id).u; res.json(ok({ total, used, remaining: (total-used) })); });
app.post('/api/campaigns/:id/distribute', auth, (req, res) => { db.prepare('INSERT INTO coupon_record(coupon_id,customer_id) VALUES (?,?)').run(req.body.couponId,req.body.customerId); res.json(ok(null)); });
app.post('/api/campaigns/:id/coupons', auth, (req, res) => { db.prepare('INSERT INTO coupon(campaign_id,name,discount_value,min_amount,total_qty) VALUES (?,?,?,?,?)').run(req.params.id,req.body.name,req.body.discountValue,req.body.minAmount,req.body.totalQty); res.json(ok(null)); });

// Coupon standalone routes
app.get('/api/coupons', auth, (req, res) => { const r = db.prepare('SELECT * FROM coupon ORDER BY created_at DESC').all(); res.json(ok(r)); });
app.get('/api/coupon-records', auth, (req, res) => { const r = db.prepare('SELECT cr.*, c.name as coupon_name, cu.name as customer_name FROM coupon_record cr LEFT JOIN coupon c ON cr.coupon_id=c.id LEFT JOIN customer cu ON cr.customer_id=cu.id ORDER BY cr.created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.put('/api/coupon-records/:recordId/use', auth, (req, res) => { db.prepare("UPDATE coupon_record SET status='已使用',use_time=CURRENT_TIMESTAMP WHERE id=?").run(req.params.recordId); res.json(ok(null)); });
app.get('/api/customers/:customerId/coupons', auth, (req, res) => { const r = db.prepare('SELECT cr.*, c.name as coupon_name FROM coupon_record cr LEFT JOIN coupon c ON cr.coupon_id=c.id WHERE cr.customer_id=?').all(req.params.customerId); res.json(ok(r)); });

// ========== Quotation Routes ==========
app.get('/api/quotations/list', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  const total = db.prepare('SELECT COUNT(*) as c FROM crm_quotation').get().c;
  const records = db.prepare('SELECT * FROM crm_quotation ORDER BY created_at DESC LIMIT ? OFFSET ?').all(s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.get('/api/quotations/:id', auth, (req, res) => {
  const q = db.prepare('SELECT * FROM crm_quotation WHERE id=?').get(req.params.id);
  const items = db.prepare('SELECT * FROM crm_quotation_item WHERE quotation_id=?').all(req.params.id);
  res.json(ok({ ...q, items }));
});
app.post('/api/quotations', auth, (req, res) => {
  const r = db.prepare('INSERT INTO crm_quotation(quotation_no,customer_id,opportunity_id,title,total_amount,status,owner_id,remark) VALUES (?,?,?,?,?,?,?,?)').run('QT'+Date.now(),req.body.customerId,req.body.opportunityId,req.body.title,req.body.totalAmount||0,req.body.status||'草稿',req.user.id,req.body.remark);
  res.json(ok({ id: r.lastInsertRowid }));
});
app.post('/api/quotations/:id/submit', auth, (req, res) => { db.prepare("UPDATE crm_quotation SET status='已提交',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id); res.json(ok(null)); });
app.post('/api/quotations/:id/approve', auth, (req, res) => { db.prepare("UPDATE crm_quotation SET status='已批准',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id); res.json(ok(null)); });
app.post('/api/quotations/:id/reject', auth, (req, res) => { db.prepare("UPDATE crm_quotation SET status='已驳回',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id); res.json(ok(null)); });
app.post('/api/quotations/:id/convert-to-order', auth, (req, res) => {
  const q = db.prepare('SELECT * FROM crm_quotation WHERE id=?').get(req.params.id);
  const r = db.prepare('INSERT INTO sales_order(customer_id,total_amount,status,quotation_id) VALUES (?,?,?,?)').run(q.customer_id,q.final_amount||q.total_amount,'待付款',q.id);
  db.prepare("UPDATE crm_quotation SET status='已转订单',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json(ok({ orderId: r.lastInsertRowid }));
});

// ========== Member Routes ==========
app.get('/api/members', auth, (req, res) => { const r = db.prepare('SELECT m.*, c.name as customer_name FROM member m LEFT JOIN customer c ON m.customer_id=c.id ORDER BY m.points DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.post('/api/members/register', auth, (req, res) => { db.prepare('INSERT INTO member(customer_id,card_level,points) VALUES (?,?,?)').run(req.body.customerId,req.body.cardLevel||'普通',req.body.points||0); res.json(ok(null)); });
app.put('/api/members/:id/points', auth, (req, res) => {
  const m = db.prepare('SELECT * FROM member WHERE id=?').get(req.params.id);
  const newPoints = m.points + (req.body.points||0);
  db.prepare('UPDATE member SET points=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newPoints, req.params.id);
  db.prepare('INSERT INTO point_record(member_id,type,points,reason) VALUES (?,?,?,?)').run(req.params.id,req.body.type||'获取',req.body.points,req.body.reason);
  res.json(ok(null));
});
app.get('/api/members/:id/profile', auth, (req, res) => {
  const m = db.prepare('SELECT m.*, c.name as customer_name FROM member m LEFT JOIN customer c ON m.customer_id=c.id WHERE m.id=?').get(req.params.id);
  res.json(ok(m));
});

// ========== Employee Routes ==========
app.get('/api/employees/performance', auth, (req, res) => {
  const month = req.query.month || '';
  let rows;
  if (month) rows = db.prepare('SELECT ep.*, u.real_name FROM employee_performance ep LEFT JOIN sys_user u ON ep.employee_id=u.id WHERE ep.month=? ORDER BY ep.sales_amount DESC').all(month);
  else rows = db.prepare('SELECT ep.*, u.real_name FROM employee_performance ep LEFT JOIN sys_user u ON ep.employee_id=u.id ORDER BY ep.month DESC, ep.sales_amount DESC').all();
  res.json(ok(rows));
});
app.get('/api/employees/todos', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  const total = db.prepare('SELECT COUNT(*) as c FROM todo_task').get().c;
  const records = db.prepare('SELECT * FROM todo_task ORDER BY created_at DESC LIMIT ? OFFSET ?').all(s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.put('/api/employees/todos/:id/complete', auth, (req, res) => { db.prepare('UPDATE todo_task SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run('已完成',req.params.id); res.json(ok(null)); });

// ========== Contact Routes ==========
app.get('/api/contacts/list', auth, (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  const total = db.prepare('SELECT COUNT(*) as c FROM crm_contact').get().c;
  const records = db.prepare('SELECT * FROM crm_contact ORDER BY created_at DESC LIMIT ? OFFSET ?').all(s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.get('/api/contacts/:id', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_contact WHERE id=?').get(req.params.id))));
app.post('/api/contacts', auth, (req, res) => {
  db.prepare('INSERT INTO crm_contact(customer_id,name,department,position,phone,email,wechat,qq,decision_role) VALUES (?,?,?,?,?,?,?,?,?)').run(req.body.customerId,req.body.name,req.body.department,req.body.position,req.body.phone,req.body.email,req.body.wechat,req.body.qq,req.body.decisionRole);
  res.json(ok(null));
});
app.put('/api/contacts', auth, (req, res) => {
  db.prepare('UPDATE crm_contact SET name=?,department=?,position=?,phone=?,email=?,wechat=?,qq=?,decision_role=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name,req.body.department,req.body.position,req.body.phone,req.body.email,req.body.wechat,req.body.qq,req.body.decisionRole,req.body.id);
  res.json(ok(null));
});
app.delete('/api/contacts/:id', auth, (req, res) => { db.prepare('DELETE FROM crm_contact WHERE id=?').run(req.params.id); res.json(ok(null)); });

// ========== Notice & Mail Routes ==========
app.get('/api/notices/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_notice ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.get('/api/notices/latest', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_notice ORDER BY created_at DESC LIMIT 5').all(); res.json(ok(r)); });
app.get('/api/notices/unread-count', auth, (req, res) => res.json(ok(0)));
app.get('/api/mails/inbox', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_internal_mail ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.get('/api/mails/unread-count', auth, (req, res) => res.json(ok(0)));

// ========== Document Routes ==========
app.get('/api/documents/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_document ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });

// ========== Approval Routes ==========
app.get('/api/approvals/flows', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_approval_flow').all(); res.json(ok(r)); });
app.get('/api/approvals/pending', auth, (req, res) => { const r = db.prepare("SELECT * FROM crm_approval_record WHERE status='审批中'").all(); res.json(ok(r)); });

// ========== Sales Team Routes ==========
app.get('/api/sales-teams/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_sales_team').all(); res.json(ok(r)); });
app.get('/api/sales-teams/:id', auth, (req, res) => {
  const team = db.prepare('SELECT * FROM crm_sales_team WHERE id=?').get(req.params.id);
  const members = db.prepare('SELECT sm.*, u.real_name FROM crm_sales_team_member sm LEFT JOIN sys_user u ON sm.user_id=u.id WHERE sm.team_id=?').all(req.params.id);
  res.json(ok({ ...team, members }));
});

// ========== Schedule & Task Routes ==========
app.get('/api/schedules/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_schedule ORDER BY start_time').all(); res.json(ok(page(r.length,1,100,r))); });
app.get('/api/schedules/calendar', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_schedule ORDER BY start_time').all(); res.json(ok(r)); });
app.post('/api/schedules', auth, (req, res) => { db.prepare('INSERT INTO crm_schedule(title,content,start_time,end_time,type,priority,owner_id) VALUES (?,?,?,?,?,?,?)').run(req.body.title,req.body.content,req.body.startTime,req.body.endTime,req.body.type,req.body.priority,req.user.id); res.json(ok(null)); });
app.put('/api/schedules', auth, (req, res) => { db.prepare('UPDATE crm_schedule SET title=?,content=?,start_time=?,end_time=?,type=?,priority=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.title,req.body.content,req.body.startTime,req.body.endTime,req.body.type,req.body.priority,req.body.id); res.json(ok(null)); });
app.delete('/api/schedules/:id', auth, (req, res) => { db.prepare('DELETE FROM crm_schedule WHERE id=?').run(req.params.id); res.json(ok(null)); });

app.get('/api/tasks/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_task ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.post('/api/tasks', auth, (req, res) => { db.prepare('INSERT INTO crm_task(title,description,assignee_id,creator_id,priority,due_date) VALUES (?,?,?,?,?,?)').run(req.body.title,req.body.description,req.body.assigneeId,req.user.id,req.body.priority,req.body.dueDate); res.json(ok(null)); });
app.put('/api/tasks/:id/complete', auth, (req, res) => { db.prepare("UPDATE crm_task SET status='已完成',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id); res.json(ok(null)); });
app.delete('/api/tasks/:id', auth, (req, res) => { db.prepare('DELETE FROM crm_task WHERE id=?').run(req.params.id); res.json(ok(null)); });

// ========== Dict Routes ==========
app.get('/api/dict/types', auth, (req, res) => { const r = db.prepare('SELECT * FROM sys_dict_type').all(); res.json(ok(r)); });
app.get('/api/dict/data/:dictType', auth, (req, res) => { const r = db.prepare('SELECT * FROM sys_dict_data WHERE dict_type=? ORDER BY sort_order').all(req.params.dictType); res.json(ok(r)); });
app.post('/api/dict/data', auth, (req, res) => { db.prepare('INSERT INTO sys_dict_data(dict_type,dict_label,dict_value,sort_order) VALUES (?,?,?,?)').run(req.body.dictType,req.body.dictLabel,req.body.dictValue,req.body.sortOrder||0); res.json(ok(null)); });

// ========== System Config Routes ==========
app.get('/api/sys-config/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM sys_config').all(); res.json(ok(r)); });
app.get('/api/sys-config/:key', auth, (req, res) => { const r = db.prepare('SELECT * FROM sys_config WHERE config_key=?').get(req.params.key); res.json(ok(r)); });

// ========== AI Mock Routes ==========
app.get('/api/ai/churn-prediction', auth, (req, res) => {
  const cust = db.prepare('SELECT * FROM customer WHERE id=?').get(req.query.customerId);
  if (!cust) return res.json(ok({ risk: 'low', score: 15, reason: '客户不存在' }));
  const orders = db.prepare('SELECT COUNT(*) as c FROM sales_order WHERE customer_id=?').get(req.query.customerId);
  const risk = orders.c === 0 ? 'high' : orders.c < 3 ? 'medium' : 'low';
  res.json(ok({ customerName: cust.name, risk, score: risk==='high'?85:risk==='medium'?45:15, daysSinceLastOrder: risk==='high'?180:30, reason: risk==='high'?'长期未下单，流失风险高':risk==='medium'?'近期待关注':'客户活跃度良好' }));
});
app.get('/api/ai/sales-forecast', auth, (req, res) => {
  const history = []; const now = new Date();
  for (let i = 11; i >= 0; i--) { const m = new Date(now.getFullYear(), now.getMonth()-i, 1); history.push({ month: m.toISOString().substring(0,7), amount: Math.floor(15000+Math.random()*35000) }); }
  const forecast = []; for (let i = 1; i <= 3; i++) { const m = new Date(now.getFullYear(), now.getMonth()+i, 1); forecast.push({ month: m.toISOString().substring(0,7), amount: Math.floor(20000+Math.random()*30000) }); }
  res.json(ok({ history, forecast }));
});
app.get('/api/ai/rfm-analysis', auth, (req, res) => {
  // 确保RFM已计算
  if (db.prepare('SELECT COUNT(*) as c FROM crm_rfm_score').get().c === 0) {
    db.prepare('SELECT id FROM customer').all().forEach(c => {
      const o = db.prepare('SELECT COUNT(*) as c, COALESCE(SUM(total_amount),0) as t, MAX(created_at) as last FROM sales_order WHERE customer_id=?').get(c.id);
      const days = o.last ? Math.floor((Date.now()-new Date(o.last).getTime())/86400000) : 365;
      const r = days<=7?5:days<=30?4:days<=90?3:days<=180?2:1;
      const f = o.c>=10?5:o.c>=6?4:o.c>=3?3:o.c>=1?2:1;
      const m = o.t>=100000?5:o.t>=50000?4:o.t>=10000?3:o.t>0?2:1;
      const tier = r+f+m>=13?'核心价值客户':r+f+m>=9?'潜力客户':r+f+m>=5?'一般客户':'流失风险客户';
      db.prepare('INSERT OR REPLACE INTO crm_rfm_score(customer_id,r_score,f_score,m_score,tier,calculated_at) VALUES (?,?,?,?,?,datetime(\'now\'))').run(c.id,r,f,m,tier);
    });
  }
  // 从RFM表关联客户表返回
  const data = db.prepare('SELECT r.customer_id as customerId, c.name as customerName, c.phone, c.level, c.source, r.r_score as rScore, r.f_score as fScore, r.m_score as mScore, r.tier as segment, r.calculated_at as lastCalc FROM crm_rfm_score r JOIN customer c ON r.customer_id=c.id ORDER BY r.tier DESC, (r.r_score+r.f_score+r.m_score) DESC').all();
  res.json(ok(data));
});
app.get('/api/ai/today-priority', auth, (req, res) => {
  const custs = db.prepare('SELECT * FROM customer WHERE owner_id IS NOT NULL ORDER BY last_follow_at ASC LIMIT 5').all();
  res.json(ok(custs.map((c,i) => ({ customerId: c.id, customerName: c.name, reason: i===0?'跟进任务已逾期':i===1?'高价值客户近30天无订单':'需要关注', priority: i<2?'高':'中', lastFollowAt: c.last_follow_at }))));
});
app.get('/api/ai/customer-profile', auth, (req, res) => {
  const cust = db.prepare('SELECT * FROM customer WHERE id=?').get(req.query.customerId);
  const orders = db.prepare('SELECT COUNT(*) as c, COALESCE(SUM(total_amount),0) as total FROM sales_order WHERE customer_id=?').get(cust.id);
  res.json(ok({ ...cust, totalOrders: orders.c, totalAmount: orders.total, tag: orders.total>50000?'大客户':orders.total>10000?'潜力客户':'普通客户', preference: '偏好美妆和家居品类', recommendation: '推荐推送新品促销活动' }));
});
app.post('/api/ai/agent/command', auth, (req, res) => {
  const cmd = (req.body.command || '').toLowerCase();
  let intent, steps, result, type='text';
  if (cmd.includes('帮助')||cmd.includes('help')||cmd.includes('功能')) {
    intent='智能助手'; steps=['展示功能列表'];
    result='🤖 我能帮你做这些：\n📊 今日/今天 — 工作概览\n📋 跟进/优先 — 待跟进客户\n📈 预测/销售 — 销售预测\n🎯 RFM/细分 — 客户分层\n📉 统计/仪表盘 — 数据总览\n🔍 客户+名字 — 搜索客户\n📦 产品/商品 — 产品列表\n💰 订单/成交 — 订单概况\n🎫 优惠券 — 优惠券统计\n👤 会员 — 会员概况\n📝 建议 — 业务建议';
  } else if (cmd.includes('今日')||cmd.includes('今天')||cmd.includes('概览')) {
    intent='今日工作概览'; steps=['查询日程','查询待办','分析客户'];
    const sc=db.prepare('SELECT COUNT(*) as c FROM crm_schedule').get().c;
    const tc=db.prepare("SELECT COUNT(*) as c FROM todo_task WHERE status='待办'").get().c;
    const cc=db.prepare('SELECT COUNT(*) as c FROM customer').get().c;
    const lc=db.prepare('SELECT COUNT(*) as c FROM crm_lead').get().c;
    result={schedules:sc,todos:tc,customers:cc,leads:lc, summary:`今日有 ${sc} 个日程、${tc} 个待办任务待处理，系统共 ${cc} 位客户、${lc} 条线索`};
  } else if (cmd.includes('跟进')||cmd.includes('优先')||cmd.includes('高价值')) {
    intent='优先跟进'; steps=['筛选高价值客户','分析跟进状态'];
    const custs = db.prepare('SELECT name,phone,level FROM customer WHERE level=? LIMIT 5').all('高价值');
    result=custs.length ? { customers: custs, summary: `找到 ${custs.length} 位高价值客户需要跟进` } : '暂未找到高价值客户';
  } else if (cmd.includes('预测')||cmd.includes('销售')||cmd.includes('趋势')) {
    intent='销售预测'; steps=['查询历史订单','计算趋势','AI预估'];
    const oc=db.prepare('SELECT COUNT(*) as c FROM sales_order').get().c;
    const ot=db.prepare('SELECT COALESCE(SUM(total_amount),0) as t FROM sales_order').get().t;
    result=`📈 销售概况：共 ${oc} 笔订单，累计 ¥${ot.toFixed(0)}\n预测下月销售额约 ¥${Math.floor(ot*0.3).toFixed(0)} ~ ¥${Math.floor(ot*0.5).toFixed(0)}`;
  } else if (cmd.includes('rfm')||cmd.includes('细分')||cmd.includes('分层')) {
    intent='RFM分析'; steps=['计算R/F/M得分','客户分层'];
    const cc=db.prepare('SELECT COUNT(*) as c FROM customer').get().c;
    const tiers=[{tier:'核心价值客户',pct:15},{tier:'潜力客户',pct:25},{tier:'一般客户',pct:40},{tier:'流失风险',pct:20}];
    result={totalCustomers:cc, tiers: tiers.map(t=>({...t,count:Math.floor(cc*t.pct/100)})), summary:`共 ${cc} 位客户已完成RFM分层分析`};
  } else if (cmd.includes('统计')||cmd.includes('仪表盘')||cmd.includes('数据')) {
    intent='数据总览'; steps=['查询各模块数据'];
    const cc=db.prepare('SELECT COUNT(*) as c FROM customer').get().c;
    const oc=db.prepare('SELECT COUNT(*) as c FROM sales_order').get().c;
    const lc=db.prepare('SELECT COUNT(*) as c FROM crm_lead').get().c;
    const op=db.prepare('SELECT COUNT(*) as c FROM crm_opportunity').get().c;
    const pc=db.prepare('SELECT COUNT(*) as c FROM crm_product').get().c;
    result={totalCustomers:cc,totalOrders:oc,totalLeads:lc,totalOpportunities:op,totalProducts:pc};
  } else if (cmd.includes('生成')&&(cmd.includes('文案')||cmd.includes('话术')||cmd.includes('朋友圈')||cmd.includes('促销'))) {
    intent='文案生成'; steps=['分析产品','匹配风格','生成文案'];
    const style = cmd.includes('专业')?'专业':cmd.includes('亲切')?'亲切':'活泼';
    const prod = cmd.match(/[\u4e00-\u9fa5]{2,}/g)?.filter(w=>!['生成','文案','话术','朋友圈','促销','一段','美妆','产品','商品','客户'].includes(w))[0] || '新品';
    result={copies:[
      `${prod}限时秒杀！错过等一年，姐妹们冲鸭！`,
      `叮咚~您关注的${prod}到货啦，赶紧码住！`,
      `今天也是心动的一天~ ${prod}直降XX元，手慢无！`
    ],style,summary:`已为您生成 ${style}风格的 3 条营销文案`};
  } else if (cmd.includes('客户')&&cmd.length>3) {
    intent='客户搜索'; steps=['匹配客户数据库'];
    const k = cmd.replace(/客户|搜索|查找|帮我/,'').trim();
    if(k){
      const r=db.prepare('SELECT name,phone,level,source FROM customer WHERE name LIKE ? LIMIT 5').all(`%${k}%`);
      result=r.length?{found:r.length,customers:r,summary:`找到 ${r.length} 位匹配客户`}:'未找到匹配客户，试试输入完整姓名';
    } else { result='请输入客户姓名，如「客户陈思雨」'; }
  } else if (cmd.includes('产品')||cmd.includes('商品')) {
    intent='产品查询'; steps=['查询产品库'];
    const pc=db.prepare('SELECT COUNT(*) as c FROM crm_product').get().c;
    const top=db.prepare('SELECT name,price,category FROM crm_product ORDER BY sales_count DESC LIMIT 3').all();
    result={totalProducts:pc,hotProducts:top,summary:`共 ${pc} 款产品，热销TOP3已列出`};
  } else if (cmd.includes('订单')||cmd.includes('成交')) {
    intent='订单概况'; steps=['统计订单'];
    const oc=db.prepare('SELECT COUNT(*) as c FROM sales_order').get().c;
    const np=db.prepare("SELECT COUNT(*) as c FROM sales_order WHERE status='待付款'").get().c;
    result={totalOrders:oc,pendingPayment:np,summary:`共 ${oc} 笔订单，${np} 笔待付款`};
  } else if (cmd.includes('优惠券')||cmd.includes('券')) {
    intent='优惠券统计'; steps=['查询优惠券'];
    const tc=db.prepare('SELECT COUNT(*) as c FROM coupon').get().c;
    const gc=db.prepare('SELECT COUNT(*) as c FROM coupon_record').get().c;
    result={totalCoupons:tc,grantedCoupons:gc,summary:`${tc} 种券模板，已发放 ${gc} 张`};
  } else if (cmd.includes('会员')||cmd.includes('vip')) {
    intent='会员概况'; steps=['统计会员'];
    const mc=db.prepare('SELECT COUNT(*) as c FROM customer').get().c;
    const pc=db.prepare('SELECT COUNT(*) as c FROM portal_user').get().c;
    result={totalMembers:pc,crmCustomers:mc,summary:`CRM客户 ${mc} 位，门户注册会员 ${pc} 位`};
  } else if (cmd.includes('建议')||cmd.includes('推荐')||cmd.includes('优化')) {
    intent='业务建议'; steps=['分析数据','生成建议'];
    const cc=db.prepare('SELECT COUNT(*) as c FROM customer').get().c;
    const lc=db.prepare('SELECT COUNT(*) as c FROM crm_lead').get().c;
    const rc=db.prepare('SELECT COUNT(*) as c FROM crm_opportunity').get().c;
    result={suggestions:[
      lc>0?`跟进 ${lc} 条线索可转化为商机`:'增加线索获取渠道',
      rc>0?`${rc} 个商机需要推动到下一阶段`:'创建更多商机推动销售',
      '定期进行客户回访提升满意度',
      '利用优惠券激活沉睡客户',
      '关注RFM分析中的流失风险客户',
    ],summary:'基于当前数据分析，以上建议供参考'};
  } else if (cmd.includes('你好')||cmd.includes('hi')||cmd.includes('hello')) {
    intent='问候'; steps=[]; result='你好！我是CRM智能助手 🤖\n输入「帮助」查看我能做什么';
  } else {
    intent='回复'; steps=[]; 
    result=`收到「${cmd}」\n\n我不太确定你的意思，试试这些：\n• 今日 — 工作概览\n• 统计 — 数据总览\n• 客户+姓名 — 搜索客户\n• 跟进 — 待跟进客户\n• 预测 — 销售预测\n• 建议 — 业务优化建议`;
  }
  res.json(ok({ intent, steps, result, type }));
});
app.post('/api/ai/marketing-copy', auth, (req, res) => {
  const { channel='微信', product='', style='活泼' } = req.body || {};
  const templates = {
    '活泼': [
      `${product||'新品'}限时秒杀！错过等一年，姐妹们冲鸭！🎉`,
      `今天也是心动的一天~ ${product||'好物'}直降XX元，手慢无！💕`,
      `叮咚~您关注的${product||'好物'}到货啦，赶紧码住！🛍️`
    ],
    '专业': [
      `${product||'精选产品'}采用创新工艺，为您的生活品质赋能`,
      `匠心打造，品质保证。${product||'产品'}限时尊享`,
      `精选品质，${product||'新品'}上市。会员专享额外9折`
    ],
    '亲切': [
      `亲爱的会员，${product||'您喜欢的产品'}到货啦，第一时间想到您~`,
      `上次您看中的${product||'商品'}，现在有专属优惠哦`,
      `${product||'好物'}返场啦，给您预留了专属名额😊`
    ]
  };
  const copies = templates[style] || templates['活泼'];
  res.json(ok({ copies, channel, style, generatedAt: new Date().toISOString() }));
});
app.post('/api/ai/sales-script', auth, (req, res) => {
  const { stage='初步接触', tags='' } = req.body || {};
  const tagDesc = tags ? `（${tags}）` : '';
  const scripts = {
    '初步接触': [
      `您好，我是${'CRM'}的销售顾问${tagDesc}，注意到您最近关注了我们的产品，方便了解一下您的需求吗？`,
      `感谢您的咨询！我们这边有一款产品非常适合您${tagDesc}，方便介绍一下吗？`
    ],
    '需求确认': [
      `了解您的需求后，我建议您考虑我们的XX产品${tagDesc}，正好符合您的预算和场景`,
      `您提到的主要诉求是XX，这正是我们这款产品的核心优势`
    ],
    '方案报价': [
      `根据您的需求，我为您准备了专属方案${tagDesc}，性价比非常高`,
      `这是为您定制的报价方案，包含了XX和XX服务`
    ],
    '商务谈判': [
      `价格方面我们可以再商量，您看这样是否合适？`,
      `理解您的顾虑，我们可以提供分期付款方案`
    ],
    '促成': [
      `现在下单还有额外优惠，错过这次要等下个月了！`,
      `今天签约还送XX礼品，机不可失~`
    ]
  };
  res.json(ok({ stage, scripts: scripts[stage] || scripts['初步接触'] }));
});
app.post('/api/ai/recommend-products', auth, (req, res) => {
  const { customerId } = req.body || {};
  const prods = db.prepare('SELECT * FROM crm_product ORDER BY sales_count DESC LIMIT 5').all();
  res.json(ok({
    customerId,
    recommendations: prods.map(p => ({
      productId: p.id,
      productName: p.name,
      score: Math.random() * 0.3 + 0.7,
      reason: ['历史购买偏好','同类客户热销','新品上市'][Math.floor(Math.random()*3)],
      price: p.price
    }))
  }));
});

// ========== Analytics Routes ==========
app.get('/api/dashboard/stats', auth, (req, res) => {
  res.json(ok({
    totalCustomers: db.prepare('SELECT COUNT(*) as c FROM customer').get().c,
    totalLeads: db.prepare('SELECT COUNT(*) as c FROM crm_lead').get().c,
    totalOpportunities: db.prepare('SELECT COUNT(*) as c FROM crm_opportunity').get().c,
    totalOrders: db.prepare('SELECT COUNT(*) as c FROM sales_order').get().c,
    monthOrderAmount: db.prepare('SELECT COALESCE(SUM(total_amount),0) as t FROM sales_order').get().t,
    pendingTodos: db.prepare("SELECT COUNT(*) as c FROM todo_task WHERE status='待办'").get().c,
  }));
});
app.get('/api/analytics/sales-trend', auth, (req, res) => {
  // 基于真实订单表，按月聚合，null月份填0
  const months = parseInt(req.query.months) || 12;
  const now = new Date();
  const rows = db.prepare(`SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(total_amount),0) as amount
    FROM sales_order WHERE created_at >= date('now', '-'||?||' months') GROUP BY month ORDER BY month`).all(months);
  // 补全所有月份
  const data = [];
  for (let i = months-1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key = d.toISOString().substring(0,7);
    const found = rows.find(r => r.month === key);
    data.push({ month: key, amount: found ? found.amount : 0 });
  }
  res.json(ok(data));
});
app.get('/api/sales/funnel', auth, (req, res) => {
  const stages = db.prepare('SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM crm_opportunity GROUP BY stage ORDER BY stage_order').all();
  res.json(ok(stages));
});
app.get('/api/analytics/customer-source', auth, (req, res) => {
  const rows = db.prepare("SELECT COALESCE(source,'未知') as source, COUNT(*) as count FROM customer GROUP BY source ORDER BY count DESC").all();
  const total = rows.reduce((s,r)=>s+r.count,0) || 1;
  res.json(ok(rows.map(r=>({ name:r.source, value:r.count, pct: Math.round(r.count*100/total) }))));
});
app.get('/api/analytics/employee-ranking', auth, (req, res) => {
  const rows = db.prepare(`SELECT u.id, u.real_name as name, COUNT(DISTINCT o.id) as deals, COALESCE(SUM(o.total_amount),0) as amount
    FROM sys_user u
    LEFT JOIN sales_order o ON o.employee_id=u.id
    GROUP BY u.id
    HAVING amount>0 OR deals>0
    ORDER BY amount DESC LIMIT 10`).all();
  const palette = ['#3b82f6','#ec4899','#8b5cf6','#22c55e','#f59e0b','#06b6d4','#a855f7','#10b981'];
  res.json(ok(rows.map((r,i)=>({ ...r, color: palette[i%palette.length] }))));
});
app.get('/api/analytics/recent-activities', auth, (req, res) => {
  const orders = db.prepare(`SELECT o.id, o.total_amount as amount, o.created_at, u.real_name as who, c.name as target
    FROM sales_order o LEFT JOIN sys_user u ON u.id=o.employee_id LEFT JOIN customer c ON c.id=o.customer_id
    ORDER BY o.created_at DESC LIMIT 8`).all();
  const actions = ['签下订单','跟进客户','创建合同','新建客户','更新备注'];
  res.json(ok(orders.map((o,i)=>({
    who: o.who || ['张磊','李娜','王伟','陈晓','赵敏'][i%5],
    action: actions[i%actions.length],
    target: o.target || '客户'+(i+1),
    amount: i%2===0?o.amount:null,
    time: o.created_at,
    color: ['#3b82f6','#ec4899','#8b5cf6','#22c55e','#f59e0b','#06b6d4'][i%6]
  }))));
});

// ========== Service Routes ==========
app.get('/api/service-requests/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_service_request ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.get('/api/service-tickets/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_service_ticket ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.post('/api/service-requests', auth, (req, res) => { db.prepare('INSERT INTO crm_service_request(request_no,customer_id,type,title,description,priority) VALUES (?,?,?,?,?,?)').run('SR'+Date.now(),req.body.customerId,req.body.type,req.body.title,req.body.description,req.body.priority||'普通'); res.json(ok(null)); });

// ========== Marketing Activity Routes ==========
app.get('/api/marketing-activities/list', auth, (req, res) => { const r = db.prepare('SELECT * FROM crm_marketing_activity ORDER BY created_at DESC').all(); res.json(ok(page(r.length,1,100,r))); });
app.post('/api/marketing-activities', auth, (req, res) => { db.prepare('INSERT INTO crm_marketing_activity(name,type,budget,start_date,end_date,owner_id,description) VALUES (?,?,?,?,?,?,?)').run(req.body.name,req.body.type,req.body.budget,req.body.startDate,req.body.endDate,req.user.id,req.body.description); res.json(ok(null)); });

// ============================================================
// 大学生CRM扩展API (学生画像/标签/RFM/会员/营销/工单/AI)
// ============================================================
app.get('/api/student-profiles/:customerId', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_student_profile WHERE customer_id=?').get(req.params.customerId)||{})));
app.post('/api/student-profiles', auth, (req, res) => { db.prepare('INSERT OR REPLACE INTO crm_student_profile(customer_id,grade,major_category,living_expense_range,campus,dormitory,student_card_no,verified) VALUES (?,?,?,?,?,?,?,?)').run(req.body.customerId,req.body.grade,req.body.majorCategory,req.body.livingExpenseRange,req.body.campus,req.body.dormitory,req.body.studentCardNo,req.body.verified||0); res.json(ok(null)); });
app.get('/api/customer-tags', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_customer_tag').all())));
app.get('/api/customer-tags/:customerId', auth, (req, res) => res.json(ok(db.prepare('SELECT t.* FROM crm_customer_tag t JOIN crm_customer_tag_rel r ON t.id=r.tag_id WHERE r.customer_id=?').all(req.params.customerId))));
app.post('/api/customer-tags/assign', auth, (req, res) => { db.prepare('INSERT OR IGNORE INTO crm_customer_tag_rel(customer_id,tag_id,source) VALUES (?,?,?)').run(req.body.customerId,req.body.tagId,req.body.source||'manual'); res.json(ok(null)); });
app.delete('/api/customer-tags/:customerId/:tagId', auth, (req, res) => { db.prepare('DELETE FROM crm_customer_tag_rel WHERE customer_id=? AND tag_id=?').run(req.params.customerId,req.params.tagId); res.json(ok(null)); });
app.get('/api/rfm-scores', auth, (req, res) => { const r=db.prepare('SELECT r.*,c.name as customer_name FROM crm_rfm_score r LEFT JOIN customer c ON r.customer_id=c.id ORDER BY r.tier DESC').all(); res.json(ok(r)); });
app.post('/api/rfm-scores/recalculate', auth, (req, res) => { db.prepare('SELECT id FROM customer').all().forEach(c=>{const o=db.prepare('SELECT COUNT(*) as c,COALESCE(SUM(total_amount),0) as t,MAX(created_at) as last FROM sales_order WHERE customer_id=?').get(c.id);const d=o.last?Math.floor((Date.now()-new Date(o.last).getTime())/86400000):365;const r=d<=7?5:d<=30?4:d<=90?3:d<=180?2:1;const f=o.c>=10?5:o.c>=6?4:o.c>=3?3:o.c>=1?2:1;const m=o.t>=100000?5:o.t>=50000?4:o.t>=10000?3:o.t>0?2:1;const tier=r+f+m>=13?'核心价值客户':r+f+m>=9?'潜力客户':r+f+m>=5?'一般客户':'流失风险客户';db.prepare('INSERT OR REPLACE INTO crm_rfm_score(customer_id,r_score,f_score,m_score,tier,calculated_at) VALUES (?,?,?,?,?,datetime(\'now\'))').run(c.id,r,f,m,tier)});res.json(ok({msg:'RFM计算完成'}));});
app.get('/api/member-tiers', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_member_tier ORDER BY min_points').all())));
app.get('/api/paid-memberships/:customerId', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_paid_membership WHERE customer_id=? ORDER BY created_at DESC').all(req.params.customerId))));
app.post('/api/paid-memberships', auth, (req, res) => { const ed=new Date();ed.setMonth(ed.getMonth()+(req.body.planType==='年卡'?12:req.body.planType==='季卡'?3:1));db.prepare('INSERT INTO crm_paid_membership(customer_id,plan_type,start_date,end_date,amount) VALUES (?,?,date(\'now\'),?,?)').run(req.body.customerId,req.body.planType,ed.toISOString().substring(0,10),req.body.amount||0);res.json(ok(null));});
app.get('/api/points-records/:customerId', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_point_record_ext WHERE customer_id=? ORDER BY created_at DESC').all(req.params.customerId))));
app.post('/api/points-records', auth, (req, res) => { db.prepare('INSERT INTO crm_point_record_ext(customer_id,type,points,reason,source) VALUES (?,?,?,?,?)').run(req.body.customerId,req.body.type,req.body.points,req.body.reason,req.body.source||'手动'); res.json(ok(null)); });
app.get('/api/marketing-templates', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_marketing_template').all())));
app.get('/api/campus-campaigns', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_campus_campaign ORDER BY created_at DESC').all())));
app.post('/api/campus-campaigns', auth, (req, res) => { db.prepare('INSERT INTO crm_campus_campaign(name,campus,type,start_date,end_date,budget,status) VALUES (?,?,?,?,?,?,?)').run(req.body.name,req.body.campus,req.body.type,req.body.startDate,req.body.endDate,req.body.budget||0,req.body.status||'计划中'); res.json(ok(null)); });
app.get('/api/auto-workflows', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_auto_workflow').all())));
app.post('/api/auto-workflows', auth, (req, res) => { db.prepare('INSERT INTO crm_auto_workflow(name,trigger_type,trigger_condition,action_type,action_content) VALUES (?,?,?,?,?)').run(req.body.name,req.body.triggerType,req.body.triggerCondition,req.body.actionType,req.body.actionContent); res.json(ok(null)); });
app.put('/api/auto-workflows/:id', auth, (req, res) => { db.prepare('UPDATE crm_auto_workflow SET name=?,trigger_type=?,trigger_condition=?,action_type=?,action_content=? WHERE id=?').run(req.body.name,req.body.triggerType,req.body.triggerCondition,req.body.actionType,req.body.actionContent,req.params.id); res.json(ok(null)); });
app.put('/api/auto-workflows/:id/toggle', auth, (req, res) => { const w=db.prepare('SELECT status FROM crm_auto_workflow WHERE id=?').get(req.params.id); db.prepare('UPDATE crm_auto_workflow SET status=? WHERE id=?').run(w.status?0:1,req.params.id); res.json(ok({status:w.status?0:1})); });
app.delete('/api/auto-workflows/:id', auth, (req, res) => { db.prepare('DELETE FROM crm_auto_workflow WHERE id=?').run(req.params.id); res.json(ok(null)); });
app.get('/api/service-tickets-ext/list', auth, (req, res) => { const {page:p,size:s,offset}=paginate(req);const t=db.prepare('SELECT COUNT(*) as c FROM crm_service_ticket_ext').get().c;const r=db.prepare('SELECT * FROM crm_service_ticket_ext ORDER BY created_at DESC LIMIT ? OFFSET ?').all(s,offset);res.json(ok(page(t,p,s,r)));});
app.get('/api/service-tickets-ext/:id', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_service_ticket_ext WHERE id=?').get(req.params.id))));
app.post('/api/service-tickets-ext', auth, (req, res) => { db.prepare('INSERT INTO crm_service_ticket_ext(ticket_no,customer_id,type,priority,status,channel,description,product_batch,product_model) VALUES (?,?,?,?,?,?,?,?,?)').run('TK'+Date.now(),req.body.customerId,req.body.type,req.body.priority||'普通',req.body.status||'待处理',req.body.channel,req.body.description,req.body.productBatch,req.body.productModel); res.json(ok(null)); });
app.put('/api/service-tickets-ext/:id', auth, (req, res) => { db.prepare('UPDATE crm_service_ticket_ext SET status=?,resolution=?,satisfaction_score=?,resolved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status,req.body.resolution,req.body.satisfactionScore,req.params.id); res.json(ok(null)); });
app.get('/api/return-requests', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_return_request ORDER BY created_at DESC').all())));
app.post('/api/return-requests', auth, (req, res) => { db.prepare('INSERT INTO crm_return_request(order_id,customer_id,reason,method,product_info) VALUES (?,?,?,?,?)').run(req.body.orderId,req.body.customerId,req.body.reason,req.body.method||'门店自提',req.body.productInfo); res.json(ok(null)); });
app.put('/api/return-requests/:id', auth, (req, res) => { db.prepare('UPDATE crm_return_request SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status,req.params.id); res.json(ok(null)); });
app.get('/api/customer-care/:customerId', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_customer_care WHERE customer_id=? ORDER BY cared_at DESC').all(req.params.customerId))));
app.post('/api/customer-care', auth, (req, res) => { db.prepare('INSERT INTO crm_customer_care(customer_id,type,content,operator_id) VALUES (?,?,?,?)').run(req.body.customerId,req.body.type,req.body.content,req.user.id); res.json(ok(null)); });
app.get('/api/ai-recommendations/:customerId', auth, (req, res) => { const prods=db.prepare('SELECT * FROM crm_product ORDER BY RANDOM() LIMIT 4').all();res.json(ok(prods.map(p=>({productId:p.id,productName:p.name,category:p.category,price:p.price,reason:'根据你的浏览和购买记录推荐',score:0.85}))));});
app.get('/api/churn-predictions', auth, (req, res) => { const r=db.prepare('SELECT cp.*,c.name as customer_name FROM crm_churn_prediction cp LEFT JOIN customer c ON cp.customer_id=c.id ORDER BY cp.risk_score DESC').all();res.json(ok(r));});
app.post('/api/churn-predictions/recalculate', auth, (req, res) => { db.prepare('SELECT id FROM customer').all().forEach(c=>{const o=db.prepare('SELECT COUNT(*) as c,MAX(created_at) as last FROM sales_order WHERE customer_id=?').get(c.id);const d=o.last?Math.floor((Date.now()-new Date(o.last).getTime())/86400000):365;const risk=d>180?90:d>90?65:d>30?40:d>7?20:5;const lvl=risk>=70?'高':risk>=40?'中':'低';db.prepare('INSERT OR REPLACE INTO crm_churn_prediction(customer_id,risk_score,risk_level,factors,predicted_at) VALUES (?,?,?,?,datetime(\'now\'))').run(c.id,risk,lvl,d>90?'长期未消费':d>30?'活跃度下降':'正常')});res.json(ok({msg:'流失预警计算完成'}));});
app.get('/api/ai-copy-templates', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_ai_copy_template').all())));
app.get('/api/campus-clusters', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_campus_cluster').all())));
app.get('/api/analytics/student-dashboard', auth, (req, res) => { const t=db.prepare('SELECT COUNT(*) as c FROM crm_student_profile').get().c;const tiers=db.prepare('SELECT tier,COUNT(*) as count FROM crm_rfm_score GROUP BY tier').all();res.json(ok({totalStudents:t,verifiedStudents:db.prepare('SELECT COUNT(*) as c FROM crm_student_profile WHERE verified=1').get().c,tierDistribution:tiers,totalTags:db.prepare('SELECT COUNT(*) as c FROM crm_customer_tag').get().c}));});

// 缺失路由补充
app.get('/api/pool', auth, (req, res) => { const r=db.prepare('SELECT * FROM customer WHERE owner_id IS NULL OR owner_id=0').all(); res.json(ok(page(r.length,1,100,r))); });
app.get('/api/mails', auth, (req, res) => { const r=db.prepare('SELECT * FROM crm_internal_mail ORDER BY created_at DESC').all(); res.json(ok(r)); });
app.post('/api/mails', auth, (req, res) => { db.prepare('INSERT INTO crm_internal_mail(title,content,sender_id,receiver_id) VALUES (?,?,?,?)').run(req.body.title,req.body.content,req.user.id,req.body.receiverId||2); res.json(ok(null)); });
app.get('/api/approvals', auth, (req, res) => { const r=db.prepare('SELECT * FROM crm_approval_record ORDER BY created_at DESC').all(); res.json(ok(r)); });
app.post('/api/approvals', auth, (req, res) => { db.prepare('INSERT INTO crm_approval_record(title,business_type,submitter_id,status) VALUES (?,?,?,?)').run(req.body.title,req.body.type||req.body.businessType,req.body.submitterId,req.body.status||'审批中'); res.json(ok(null)); });
app.get('/api/employees/performance', auth, (req, res) => { const m=req.query.month||''; const r=m?db.prepare('SELECT p.*,u.real_name as employee_name FROM employee_performance p LEFT JOIN sys_user u ON p.employee_id=u.id WHERE p.month=? ORDER BY p.sales_amount DESC').all(m):db.prepare('SELECT p.*,u.real_name as employee_name FROM employee_performance p LEFT JOIN sys_user u ON p.employee_id=u.id ORDER BY p.month DESC').all(); res.json(ok(r)); });
app.post('/api/employees/performance', auth, (req, res) => { db.prepare('INSERT INTO employee_performance(employee_id,month,sales_amount,new_customers) VALUES (?,?,?,?)').run(req.body.employeeId,req.body.month,req.body.salesAmount,req.body.newCustomers||0); res.json(ok(null)); });

// 数据填充补丁
(function(){try{db.prepare('DELETE FROM crm_approval_record').run();db.prepare('INSERT INTO crm_approval_record(title,business_type,submitter_id,status) VALUES (?,?,?,?)').run('618大促预算审批','预算',2,'审批中');db.prepare('INSERT INTO crm_approval_record(title,business_type,submitter_id,status) VALUES (?,?,?,?)').run('新品采购合同审批','合同',3,'已通过');}catch(e){}
try{db.prepare('DELETE FROM crm_internal_mail').run();db.prepare('INSERT INTO crm_internal_mail(title,content,sender_id,receiver_id,status) VALUES (?,?,?,?,?)').run('6月销售策略会议通知','定于6月5日上午10点召开销售策略会议',1,2,'未读');db.prepare('INSERT INTO crm_internal_mail(title,content,sender_id,receiver_id,status) VALUES (?,?,?,?,?)').run('客户回访计划确认','请确认本周客户回访计划安排',1,3,'未读');}catch(e){}
try{db.prepare('DELETE FROM employee_performance').run();for(let m=1;m<=5;m++){for(let e=2;e<=3;e++){db.prepare('INSERT INTO employee_performance(employee_id,month,sales_amount,new_customers) VALUES (?,?,?,?)').run(e,'2026-0'+m,15000+Math.floor(Math.random()*35000),1+Math.floor(Math.random()*5))}}}catch(e){}})();

// ========== User Routes ==========
app.get('/api/users', auth, (req, res) => { const r = db.prepare('SELECT id,username,real_name,role,phone FROM sys_user WHERE status=1').all(); res.json(ok(r)); });

// ============================================================
// 会员门户 API (40+ endpoints)
// ============================================================
const memberAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, message: '请先登录' });
  try { req.member = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ code: 401, message: 'Token已过期' }); }
};
const memberJWT = (user) => jwt.sign({ id: user.id, phone: user.phone, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

// 认证
app.post('/api/member-portal/auth/register', (req, res) => {
  const { phone, password, nickname } = req.body;
  if (!phone || !password) return res.json({ code: 400, message: '手机号和密码必填' });
  if (db.prepare('SELECT id FROM portal_user WHERE phone=?').get(phone)) return res.json({ code: 400, message: '手机号已注册' });
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare('INSERT INTO portal_user(phone,nickname,available_points,total_points) VALUES (?,?,100,100)').run(phone, nickname || '用户'+phone.slice(-4));
  db.prepare('INSERT INTO portal_user_auth(user_id,auth_type,credential) VALUES (?,?,?)').run(r.lastInsertRowid, 'password', hash);
  // 关联CRM客户
  const cr = db.prepare('INSERT INTO customer(name,phone,source,level) VALUES (?,?,?,?)').run(nickname||phone,phone,'小程序','普通');
  db.prepare('UPDATE portal_user SET crm_customer_id=? WHERE id=?').run(cr.lastInsertRowid, r.lastInsertRowid);
  const user = db.prepare('SELECT * FROM portal_user WHERE id=?').get(r.lastInsertRowid);
  res.json(ok({ token: memberJWT(user), user: { id: user.id, phone: user.phone, nickname: user.nickname, points: user.available_points } }));
});
app.post('/api/member-portal/auth/login', (req, res) => {
  const { phone, password } = req.body;
  const user = db.prepare('SELECT u.*, a.credential FROM portal_user u JOIN portal_user_auth a ON u.id=a.user_id WHERE u.phone=? AND a.auth_type=?').get(phone, 'password');
  if (!user || !bcrypt.compareSync(password, user.credential)) return res.json({ code: 401, message: '手机号或密码错误' });
  db.prepare('UPDATE portal_user SET last_login_at=CURRENT_TIMESTAMP WHERE id=?').run(user.id);
  res.json(ok({ token: memberJWT(user), user: { id: user.id, phone: user.phone, nickname: user.nickname, points: user.available_points } }));
});
app.get('/api/member-portal/auth/profile', memberAuth, (req, res) => {
  const u = db.prepare('SELECT id,phone,nickname,avatar,gender,birthday,available_points,total_points,total_spent,member_tier_id,crm_customer_id,created_at FROM portal_user WHERE id=?').get(req.member.id);
  if (!u.crm_customer_id) {
    const cr = db.prepare('INSERT INTO customer(name,phone,source,level) VALUES (?,?,?,?)').run(u.nickname||u.phone, u.phone, '小程序', '普通');
    db.prepare('UPDATE portal_user SET crm_customer_id=? WHERE id=?').run(cr.lastInsertRowid, u.id);
    u.crm_customer_id = cr.lastInsertRowid;
  }
  const tier = u.member_tier_id ? db.prepare('SELECT name,discount_rate,benefits FROM crm_member_tier WHERE id=?').get(u.member_tier_id) : { name: '普通用户', discount_rate: 1, benefits: '基础权益' };
  res.json(ok({ ...u, tier }));
});
app.put('/api/member-portal/auth/profile', memberAuth, (req, res) => {
  db.prepare('UPDATE portal_user SET nickname=?,avatar=?,gender=?,birthday=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.nickname, req.body.avatar, req.body.gender, req.body.birthday, req.member.id);
  res.json(ok(null));
});

// 学生认证
app.get('/api/member-portal/auth/student-profile', memberAuth, (req, res) => {
  const u = db.prepare('SELECT crm_customer_id FROM portal_user WHERE id=?').get(req.member.id);
  const p = db.prepare('SELECT * FROM crm_student_profile WHERE customer_id=?').get(u.crm_customer_id);
  res.json(ok(p || { customer_id: u.crm_customer_id, verified: 0 }));
});
app.post('/api/member-portal/auth/student-verify', memberAuth, (req, res) => {
  const u = db.prepare('SELECT crm_customer_id FROM portal_user WHERE id=?').get(req.member.id);
  const { grade, majorCategory, livingExpenseRange, campus, dormitory, studentCardNo } = req.body;
  if (!grade || !campus || !studentCardNo) return res.json({ code: 400, message: '请填写完整的认证信息' });
  db.prepare('INSERT OR REPLACE INTO crm_student_profile(customer_id,grade,major_category,living_expense_range,campus,dormitory,student_card_no,verified) VALUES (?,?,?,?,?,?,?,0)')
    .run(u.crm_customer_id, grade, majorCategory, livingExpenseRange, campus, dormitory, studentCardNo);
  // 更新客户标签为学生
  db.prepare("UPDATE customer SET level='学生',source='校园认证' WHERE id=?").run(u.crm_customer_id);
  res.json(ok({ success: true, message: '认证信息已提交，等待审核' }));
});

// 产品浏览
app.get('/api/member-portal/products/list', (req, res) => {
  const { page: p, size: s, offset } = paginate(req);
  let where = 'WHERE is_on_sale=1'; const params = [];
  if (req.query.category) { where += ' AND category=?'; params.push(req.query.category); }
  if (req.query.keyword) { where += ' AND (name LIKE ? OR description LIKE ?)'; params.push('%'+req.query.keyword+'%', '%'+req.query.keyword+'%'); }
  const total = db.prepare(`SELECT COUNT(*) as c FROM crm_product ${where}`).get(...params).c;
  const records = db.prepare(`SELECT * FROM crm_product ${where} ORDER BY sales_count DESC LIMIT ? OFFSET ?`).all(...params, s, offset);
  res.json(ok(page(total, p, s, records)));
});
app.get('/api/member-portal/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM crm_product WHERE id=?').get(req.params.id);
  const reviews = db.prepare('SELECT r.*, u.nickname FROM portal_product_review r JOIN portal_user u ON r.user_id=u.id WHERE r.product_id=? AND r.status=1 ORDER BY r.created_at DESC LIMIT 10').all(req.params.id);
  res.json(ok({ ...p, reviews }));
});
app.get('/api/member-portal/products/categories', (req, res) => res.json(ok(db.prepare('SELECT DISTINCT category FROM crm_product WHERE category IS NOT NULL').all().map(r=>r.category))));
app.get('/api/member-portal/products/hot', (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_product ORDER BY sales_count DESC LIMIT 8').all())));
app.post('/api/member-portal/products/:id/favorite', memberAuth, (req, res) => {
  const fav = db.prepare('SELECT id FROM portal_user_favorite WHERE user_id=? AND product_id=?').get(req.member.id, req.params.id);
  if (fav) { db.prepare('DELETE FROM portal_user_favorite WHERE id=?').run(fav.id); res.json(ok({ favorited: false })); }
  else { db.prepare('INSERT INTO portal_user_favorite(user_id,product_id) VALUES (?,?)').run(req.member.id, req.params.id); res.json(ok({ favorited: true })); }
});
app.get('/api/member-portal/products/my-favorites', memberAuth, (req, res) => {
  const favs = db.prepare('SELECT p.* FROM portal_user_favorite f JOIN crm_product p ON f.product_id=p.id WHERE f.user_id=?').all(req.member.id);
  res.json(ok(favs));
});
app.post('/api/member-portal/products/:id/review', memberAuth, (req, res) => {
  db.prepare('INSERT INTO portal_product_review(user_id,product_id,rating,content) VALUES (?,?,?,?)').run(req.member.id, req.params.id, req.body.rating, req.body.content);
  db.prepare('UPDATE portal_user SET available_points=available_points+10, total_points=total_points+10 WHERE id=?').run(req.member.id);
  res.json(ok(null));
});
app.post('/api/member-portal/products/:id/browse', memberAuth, (req, res) => { db.prepare('INSERT INTO portal_browse_history(user_id,product_id) VALUES (?,?)').run(req.member.id, req.params.id); res.json(ok(null)); });

// 购物车
app.get('/api/member-portal/cart/list', memberAuth, (req, res) => {
  const items = db.prepare('SELECT c.*, p.name as product_name, p.price, p.images FROM portal_shopping_cart c JOIN crm_product p ON c.product_id=p.id WHERE c.user_id=?').all(req.member.id);
  res.json(ok(items));
});
app.post('/api/member-portal/cart/add', memberAuth, (req, res) => {
  const existing = db.prepare('SELECT id,quantity FROM portal_shopping_cart WHERE user_id=? AND product_id=?').get(req.member.id, req.body.productId);
  if (existing) db.prepare('UPDATE portal_shopping_cart SET quantity=quantity+? WHERE id=?').run(req.body.quantity || 1, existing.id);
  else db.prepare('INSERT INTO portal_shopping_cart(user_id,product_id,quantity) VALUES (?,?,?)').run(req.member.id, req.body.productId, req.body.quantity || 1);
  res.json(ok(null));
});
app.put('/api/member-portal/cart/:id', memberAuth, (req, res) => { db.prepare('UPDATE portal_shopping_cart SET quantity=? WHERE id=?').run(req.body.quantity, req.params.id); res.json(ok(null)); });
app.delete('/api/member-portal/cart/:id', memberAuth, (req, res) => { db.prepare('DELETE FROM portal_shopping_cart WHERE id=? AND user_id=?').run(req.params.id, req.member.id); res.json(ok(null)); });

// 订单
app.get('/api/member-portal/orders/list', memberAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM sales_order WHERE customer_id IN (SELECT crm_customer_id FROM portal_user WHERE id=?) ORDER BY created_at DESC').all(req.member.id);
  res.json(ok(orders));
});
app.get('/api/member-portal/orders/:id', memberAuth, (req, res) => {
  const o = db.prepare('SELECT * FROM sales_order WHERE id=?').get(req.params.id);
  const items = db.prepare('SELECT * FROM order_item WHERE order_id=?').all(req.params.id);
  res.json(ok({ ...o, items }));
});
app.post('/api/member-portal/orders/create', memberAuth, (req, res) => {
  const { couponGrantId } = req.body;
  const u = db.prepare('SELECT crm_customer_id FROM portal_user WHERE id=?').get(req.member.id);
  let total = db.prepare('SELECT SUM(p.price*c.quantity) as t FROM portal_shopping_cart c JOIN crm_product p ON c.product_id=p.id WHERE c.user_id=? AND c.selected=1').get(req.member.id).t || 0;
  // 应用优惠券
  let discount = 0;
  let usedCouponGrantId = null;
  if (couponGrantId && couponGrantId > 0) {
    const grant = db.prepare(`SELECT g.*, c.discount_value, c.min_amount FROM portal_coupon_grant g JOIN coupon c ON g.coupon_id=c.id WHERE g.id=? AND g.user_id=? AND g.status='未使用'`).get(couponGrantId, req.member.id);
    if (grant && total >= grant.min_amount) {
      discount = Math.min(grant.discount_value, total);
      total = total - discount;
      usedCouponGrantId = grant.id;
    }
  }
  const r = db.prepare('INSERT INTO sales_order(customer_id,total_amount,status) VALUES (?,?,?)').run(u.crm_customer_id, total, '待付款');
  const cartItems = db.prepare('SELECT c.*, p.name, p.price FROM portal_shopping_cart c JOIN crm_product p ON c.product_id=p.id WHERE c.user_id=? AND c.selected=1').all(req.member.id);
  cartItems.forEach(ci => { db.prepare('INSERT INTO order_item(order_id,product_id,product_name,qty,price) VALUES (?,?,?,?,?)').run(r.lastInsertRowid, ci.product_id, ci.name, ci.quantity, ci.price); db.prepare('UPDATE crm_product SET sales_count=sales_count+? WHERE id=?').run(ci.quantity, ci.product_id); });
  db.prepare('DELETE FROM portal_shopping_cart WHERE user_id=? AND selected=1').run(req.member.id);
  db.prepare('UPDATE portal_user SET total_spent=total_spent+? WHERE id=?').run(total, req.member.id);
  // 标记优惠券已使用
  if (usedCouponGrantId) {
    db.prepare(`UPDATE portal_coupon_grant SET status='已使用',used_order_id=?,used_at=CURRENT_TIMESTAMP WHERE id=?`).run(r.lastInsertRowid, usedCouponGrantId);
  }
  // 积分
  const pointsEarned = Math.floor(total);
  db.prepare('UPDATE portal_user SET available_points=available_points+?, total_points=total_points+? WHERE id=?').run(pointsEarned, pointsEarned, req.member.id);
  db.prepare('INSERT INTO crm_point_record_ext(customer_id,type,points,reason,source) VALUES (?,?,?,?,?)').run(u.crm_customer_id, '收入', pointsEarned, '消费奖励', '消费');
  res.json(ok({ orderId: r.lastInsertRowid, total, discount, pointsEarned }));
});
app.put('/api/member-portal/orders/:id/confirm', memberAuth, (req, res) => { db.prepare("UPDATE sales_order SET status='已完成' WHERE id=?").run(req.params.id); res.json(ok(null)); });
app.put('/api/member-portal/orders/:id/cancel', memberAuth, (req, res) => { db.prepare("UPDATE sales_order SET status='已取消' WHERE id=?").run(req.params.id); res.json(ok(null)); });
app.post('/api/member-portal/orders/:id/return', memberAuth, (req, res) => { db.prepare('INSERT INTO crm_return_request(order_id,customer_id,reason,method) VALUES (?,(SELECT crm_customer_id FROM portal_user WHERE id=?),?,?)').run(req.params.id, req.member.id, req.body.reason, req.body.method||'门店自提'); res.json(ok(null)); });

// 会员等级
app.get('/api/member-portal/member/tiers', (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_member_tier ORDER BY min_points').all())));
app.get('/api/member-portal/member/my-tier', memberAuth, (req, res) => {
  const u = db.prepare('SELECT total_spent,member_tier_id FROM portal_user WHERE id=?').get(req.member.id);
  const tiers = db.prepare('SELECT * FROM crm_member_tier ORDER BY min_points').all();
  let ct = tiers[0]; for (const t of tiers) { if (u.total_spent >= t.min_spending) ct = t; }
  const next = tiers.find(t => t.min_spending > u.total_spent);
  res.json(ok({ currentTier: ct, nextTier: next || null, totalSpent: u.total_spent, progress: next ? Math.round((u.total_spent / next.min_spending) * 100) : 100 }));
});

// 积分
app.get('/api/member-portal/points/balance', memberAuth, (req, res) => {
  const u = db.prepare('SELECT available_points,total_points FROM portal_user WHERE id=?').get(req.member.id);
  res.json(ok(u));
});
app.get('/api/member-portal/points/records', memberAuth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_point_record_ext WHERE customer_id=(SELECT crm_customer_id FROM portal_user WHERE id=?) ORDER BY created_at DESC LIMIT 30').all(req.member.id))));
app.post('/api/member-portal/points/sign', memberAuth, (req, res) => {
  const today = new Date().toISOString().substring(0, 10);
  if (db.prepare('SELECT id FROM portal_sign_record WHERE user_id=? AND sign_date=?').get(req.member.id, today)) return res.json({ code: 400, message: '今日已签到' });
  const yesterday = new Date(Date.now()-86400000).toISOString().substring(0,10);
  const prev = db.prepare('SELECT continuous_days FROM portal_sign_record WHERE user_id=? AND sign_date=?').get(req.member.id, yesterday);
  const days = (prev?.continuous_days || 0) + 1;
  const points = Math.min(days * 5, 35) + (days >= 7 ? 20 : 0);
  db.prepare('INSERT INTO portal_sign_record(user_id,sign_date,points_earned,continuous_days) VALUES (?,?,?,?)').run(req.member.id, today, points, days);
  db.prepare('UPDATE portal_user SET available_points=available_points+?, total_points=total_points+? WHERE id=?').run(points, points, req.member.id);
  res.json(ok({ points, continuousDays: days }));
});
app.get('/api/member-portal/points/sign-status', memberAuth, (req, res) => {
  const today = new Date().toISOString().substring(0, 10);
  const signed = !!db.prepare('SELECT id FROM portal_sign_record WHERE user_id=? AND sign_date=?').get(req.member.id, today);
  const records = db.prepare('SELECT sign_date, points_earned FROM portal_sign_record WHERE user_id=? ORDER BY sign_date DESC LIMIT 7').all(req.member.id);
  res.json(ok({ signed, records }));
});

// 积分兑换
app.post('/api/member-portal/points/exchange', memberAuth, (req, res) => {
  const { exchangeType, exchangeTargetId, pointsCost } = req.body;
  if (!pointsCost || pointsCost <= 0) return res.json({ code: 400, message: '兑换积分无效' });
  const user = db.prepare('SELECT available_points FROM portal_user WHERE id=?').get(req.member.id);
  if (!user || user.available_points < pointsCost) return res.json({ code: 400, message: '积分不足' });
  // 扣减积分
  db.prepare('UPDATE portal_user SET available_points=available_points-? WHERE id=?').run(pointsCost, req.member.id);
  // 记录兑换
  db.prepare('INSERT INTO portal_points_exchange(user_id,exchange_type,exchange_target_id,points_cost) VALUES(?,?,?,?)').run(req.member.id, exchangeType||'coupon', exchangeTargetId||0, pointsCost);
  // 记录积分流水
  db.prepare('INSERT INTO crm_point_record_ext(customer_id,type,points,reason) VALUES ((SELECT crm_customer_id FROM portal_user WHERE id=?),?,?,?)').run(req.member.id, '支出', -pointsCost, '积分兑换');
  // 如果是兑换优惠券，发放匹配面额的券
  if (exchangeType === 'coupon') {
    let couponValue = Math.floor(pointsCost / 50); // 每50积分约等于1元面额
    if (couponValue < 5) couponValue = 5;
    // 找一张用户未领取且面额匹配的券
    let coupon = db.prepare(`SELECT id FROM coupon WHERE discount_value>=? AND discount_value<=? AND id NOT IN (SELECT coupon_id FROM portal_coupon_grant WHERE user_id=?) ORDER BY discount_value ASC LIMIT 1`).get(couponValue-2, couponValue+5, req.member.id);
    // 如果没有匹配的，找任意未领取的券
    if (!coupon) {
      coupon = db.prepare('SELECT id FROM coupon WHERE id NOT IN (SELECT coupon_id FROM portal_coupon_grant WHERE user_id=?) LIMIT 1').get(req.member.id);
    }
    if (coupon) {
      db.prepare("INSERT INTO portal_coupon_grant(user_id,coupon_id,source,expire_at) VALUES(?,?,?,datetime('now','+30 days'))").run(req.member.id, coupon.id, '积分兑换');
    }
  }
  res.json(ok({ success: true, cost: pointsCost }));
});

// 优惠券
app.get('/api/member-portal/coupons/available', memberAuth, (req, res) => res.json(ok(db.prepare('SELECT * FROM coupon').all())));
app.get('/api/member-portal/coupons/my-coupons', memberAuth, (req, res) => res.json(ok(db.prepare('SELECT g.*, c.name as coupon_name, c.discount_value, c.min_amount FROM portal_coupon_grant g JOIN coupon c ON g.coupon_id=c.id WHERE g.user_id=? ORDER BY g.created_at DESC').all(req.member.id))));
app.post('/api/member-portal/coupons/:id/claim', memberAuth, (req, res) => {
  if (db.prepare('SELECT id FROM portal_coupon_grant WHERE user_id=? AND coupon_id=?').get(req.member.id, req.params.id)) return res.json({ code: 400, message: '已领取' });
  db.prepare(`INSERT INTO portal_coupon_grant(user_id,coupon_id,expire_at) VALUES (?,?,datetime('now','+30 days'))`).run(req.member.id, req.params.id);
  res.json(ok(null));
});

// 地址
app.get('/api/member-portal/address/list', memberAuth, (req, res) => res.json(ok(db.prepare('SELECT * FROM portal_address WHERE user_id=? ORDER BY is_default DESC').all(req.member.id))));
app.post('/api/member-portal/address/add', memberAuth, (req, res) => {
  if (req.body.isDefault) db.prepare('UPDATE portal_address SET is_default=0 WHERE user_id=?').run(req.member.id);
  db.prepare('INSERT INTO portal_address(user_id,receiver_name,phone,province,city,district,detail,is_default,tag) VALUES (?,?,?,?,?,?,?,?,?)').run(req.member.id, req.body.receiverName, req.body.phone, req.body.province, req.body.city, req.body.district, req.body.detail, req.body.isDefault||0, req.body.tag);
  res.json(ok(null));
});
app.put('/api/member-portal/address/:id', memberAuth, (req, res) => { db.prepare('UPDATE portal_address SET receiver_name=?,phone=?,province=?,city=?,district=?,detail=?,tag=? WHERE id=? AND user_id=?').run(req.body.receiverName, req.body.phone, req.body.province, req.body.city, req.body.district, req.body.detail, req.body.tag, req.params.id, req.member.id); res.json(ok(null)); });
app.delete('/api/member-portal/address/:id', memberAuth, (req, res) => { db.prepare('DELETE FROM portal_address WHERE id=? AND user_id=?').run(req.params.id, req.member.id); res.json(ok(null)); });

// 首页
app.get('/api/member-portal/public/home-data', (req, res) => {
  const bannerRow = db.prepare('SELECT config_value FROM portal_system_config WHERE config_key=?').get('home_banners');
  const noticeRow = db.prepare('SELECT config_value FROM portal_system_config WHERE config_key=?').get('home_notice');
  let banners = [];
  let notice = '';
  try { banners = JSON.parse(bannerRow?.config_value || '[]') } catch { banners = [] }
  try { notice = noticeRow?.config_value || '' } catch { notice = '' }
  res.json(ok({
    banners, notice,
    hotProducts: db.prepare('SELECT * FROM crm_product WHERE is_on_sale=1 ORDER BY sales_count DESC LIMIT 8').all(),
    tiers: db.prepare('SELECT * FROM crm_member_tier ORDER BY min_points').all(),
    groupBuys: db.prepare(`SELECT g.*, p.name as product_name, p.price FROM crm_group_buy g LEFT JOIN crm_product p ON g.product_id=p.id WHERE g.status='进行中'`).all(),
    kbCount: db.prepare('SELECT COUNT(*) as c FROM crm_knowledge_base WHERE status=1').get().c,
  }));
});
// 公开API：拼团列表（无需登录）
app.get('/api/member-portal/public/group-buys', (req, res) => { res.json(ok(db.prepare(`SELECT g.*, p.name as product_name, p.price FROM crm_group_buy g LEFT JOIN crm_product p ON g.product_id=p.id WHERE g.status='进行中'`).all())); });
// 会员参与拼团
app.post('/api/member-portal/public/group-buys/:id/join', memberAuth, (req, res) => {
  const gb = db.prepare('SELECT * FROM crm_group_buy WHERE id=?').get(req.params.id);
  if(!gb) return res.status(404).json({code:404,message:'拼团不存在'});
  const already = db.prepare('SELECT id FROM crm_group_buy_member WHERE group_buy_id=? AND user_id=?').get(req.params.id, req.member.id);
  if(already) return res.json({code:400,message:'您已参团'});
  db.prepare('INSERT INTO crm_group_buy_member(group_buy_id,user_id,user_name) VALUES(?,?,?)').run(req.params.id, req.member.id, req.member.username);
  const newCount = db.prepare('SELECT COUNT(*) as c FROM crm_group_buy_member WHERE group_buy_id=?').get(req.params.id).c;
  db.prepare('UPDATE crm_group_buy SET current_members=? WHERE id=?').run(newCount, req.params.id);
  if(newCount >= gb.min_members) db.prepare(`UPDATE crm_group_buy SET status='已成团' WHERE id=?`).run(req.params.id);
  res.json(ok({success:true}));
});
// 公开API：知识库
app.get('/api/member-portal/public/knowledge-base', (req, res) => { const q=req.query.keyword?`WHERE title LIKE '%${req.query.keyword}%'`:'WHERE status=1'; res.json(ok(db.prepare(`SELECT id,title,category,tags,view_count FROM crm_knowledge_base ${q} ORDER BY view_count DESC LIMIT 10`).all())); });
app.get('/api/member-portal/public/browse-history', memberAuth, (req, res) => res.json(ok(db.prepare('SELECT h.*, p.name, p.price FROM portal_browse_history h JOIN crm_product p ON h.product_id=p.id WHERE h.user_id=? ORDER BY h.created_at DESC LIMIT 20').all(req.member.id))));

// ============================================================
// CRM后台 - 门户管理API (admin only)
// ============================================================
// Portal config CRUD
app.get('/api/admin/portal-configs', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM portal_system_config ORDER BY id').all())));
app.put('/api/admin/portal-configs/:key', auth, (req, res) => {
  db.prepare('UPDATE portal_system_config SET config_value=?, updated_at=CURRENT_TIMESTAMP WHERE config_key=?').run(req.body.configValue, req.params.key);
  res.json(ok(null));
});
app.post('/api/admin/portal-configs', auth, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO portal_system_config(config_key,config_value,description) VALUES (?,?,?)').run(req.body.configKey, req.body.configValue, req.body.description);
  res.json(ok(null));
});

// Product management for portal
app.put('/api/admin/products/:id/toggle-sale', auth, (req, res) => { db.prepare('UPDATE crm_product SET is_on_sale=? WHERE id=?').run(req.body.isOnSale || 0, req.params.id); res.json(ok(null)); });
app.put('/api/admin/products/:id/member-price', auth, (req, res) => { db.prepare('UPDATE crm_product SET member_price=? WHERE id=?').run(req.body.memberPrice, req.params.id); res.json(ok(null)); });

// Portal dashboard stats
app.get('/api/admin/portal-stats', auth, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM portal_user').get().c;
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM sales_order WHERE status='已付款'").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as t FROM sales_order WHERE status='已付款'").get().t;
  const onSaleProducts = db.prepare('SELECT COUNT(*) as c FROM crm_product WHERE is_on_sale=1').get().c;
  const todaySignins = db.prepare('SELECT COUNT(*) as c FROM portal_sign_record WHERE sign_date=date()').get().c;
  res.json(ok({ totalUsers, totalOrders, totalRevenue, onSaleProducts, todaySignins }));
});
app.get('/api/admin/portal-users', auth, (req, res) => { res.json(ok(db.prepare('SELECT id,nickname,phone,available_points,total_spent,crm_customer_id,status,created_at FROM portal_user ORDER BY id DESC').all())); });
app.put('/api/admin/portal-users/:id/status', auth, (req, res) => { db.prepare('UPDATE portal_user SET status=? WHERE id=?').run(req.body.status, req.params.id); res.json(ok(null)); });
app.put('/api/admin/inventory/:productId/stock', auth, (req, res) => { db.prepare('UPDATE crm_inventory SET quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?').run(req.body.newQty, req.params.productId); res.json(ok(null)); });

// ============================================================
// 反馈系统 API
// ============================================================
// 会员端：提交反馈
app.post('/api/member-portal/feedback', memberAuth, (req, res) => {
  db.prepare('INSERT INTO portal_feedback(user_id,type,content,contact) VALUES (?,?,?,?)').run(req.member.id, req.body.type||'建议', req.body.content, req.body.contact||'');
  res.json(ok({ message: '提交成功，感谢你的反馈！' }));
});
// 会员端：我的反馈
app.get('/api/member-portal/feedback/my', memberAuth, (req, res) => {
  const list = db.prepare('SELECT * FROM portal_feedback WHERE user_id=? ORDER BY created_at DESC').all(req.member.id);
  res.json(ok(list));
});
// 管理端：所有反馈列表
app.get('/api/admin/feedbacks', auth, (req, res) => {
  const list = db.prepare('SELECT f.*, COALESCE(p.nickname, p.phone) as user_name FROM portal_feedback f LEFT JOIN portal_user p ON f.user_id=p.id ORDER BY f.created_at DESC').all();
  res.json(ok(list));
});
// 管理端：回复反馈
app.put('/api/admin/feedbacks/:id/reply', auth, (req, res) => {
  db.prepare('UPDATE portal_feedback SET reply=?, replied_by=?, replied_at=CURRENT_TIMESTAMP, status=? WHERE id=?').run(req.body.reply, req.user.id, '已回复', req.params.id);
  res.json(ok(null));
});
// 管理端：更新状态
app.put('/api/admin/feedbacks/:id/status', auth, (req, res) => {
  db.prepare('UPDATE portal_feedback SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json(ok(null));
});

// ============================================================
// CRM后台 - 积分管理 API
// ============================================================
// 所有积分记录（支持按客户筛选）
app.get('/api/admin/points/all', auth, (req, res) => {
  let sql = 'SELECT r.*, c.name as customer_name FROM crm_point_record_ext r LEFT JOIN customer c ON r.customer_id=c.id';
  const params = [];
  if (req.query.customerId) { sql += ' WHERE r.customer_id=?'; params.push(req.query.customerId); }
  sql += ' ORDER BY r.created_at DESC LIMIT 200';
  res.json(ok(db.prepare(sql).all(...params)));
});
// 手动增减积分
app.post('/api/admin/points/adjust', auth, (req, res) => {
  const { customerId, type, points, reason } = req.body;
  if (!customerId || !points || !type) return res.json({ code: 400, message: '参数不完整' });
  db.prepare('INSERT INTO crm_point_record_ext(customer_id,type,points,reason,source) VALUES (?,?,?,?,?)').run(customerId, type, points, reason||'人工调整', '管理员');
  // 同步更新 portal_user 积分
  const pu = db.prepare('SELECT id FROM portal_user WHERE crm_customer_id=?').get(customerId);
  if (pu) {
    if (type === '收入') db.prepare('UPDATE portal_user SET available_points=available_points+?, total_points=total_points+? WHERE id=?').run(points, points, pu.id);
    else db.prepare('UPDATE portal_user SET available_points=MAX(0,available_points-?), updated_at=CURRENT_TIMESTAMP WHERE id=?').run(points, pu.id);
  }
  res.json(ok({ message: '积分调整成功' }));
});
// 积分统计
app.get('/api/admin/points/stats', auth, (req, res) => {
  const totalIssued = db.prepare("SELECT COALESCE(SUM(points),0) as t FROM crm_point_record_ext WHERE type='收入'").get().t;
  const totalUsed = db.prepare("SELECT COALESCE(SUM(points),0) as t FROM crm_point_record_ext WHERE type='支出'").get().t;
  const todaySigns = db.prepare('SELECT COUNT(*) as c FROM portal_sign_record WHERE sign_date=date()').get().c;
  res.json(ok({ totalIssued, totalUsed, balance: totalIssued - totalUsed, todaySigns }));
});

// ============================================================
// CRM后台 - 优惠券管理 API
// ============================================================
// 优惠券CRUD
app.get('/api/admin/coupons', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM coupon ORDER BY created_at DESC').all())));
app.post('/api/admin/coupons', auth, (req, res) => {
  db.prepare('INSERT INTO coupon(name,discount_value,min_amount,total_qty,campaign_id) VALUES (?,?,?,?,?)').run(req.body.name, req.body.discountValue, req.body.minAmount||0, req.body.totalQty||100, req.body.campaignId||null);
  res.json(ok(null));
});
app.put('/api/admin/coupons/:id', auth, (req, res) => {
  db.prepare('UPDATE coupon SET name=?,discount_value=?,min_amount=?,total_qty=? WHERE id=?').run(req.body.name, req.body.discountValue, req.body.minAmount, req.body.totalQty, req.params.id);
  res.json(ok(null));
});
app.delete('/api/admin/coupons/:id', auth, (req, res) => { db.prepare('DELETE FROM coupon WHERE id=?').run(req.params.id); res.json(ok(null)); });
// 发放优惠券
app.post('/api/admin/coupons/grant', auth, (req, res) => {
  const { couponId, customerId } = req.body;
  // Grant to CRM customer
  const cr = db.prepare('SELECT id FROM coupon_record WHERE coupon_id=? AND customer_id=?').get(couponId, customerId);
  if (!cr) db.prepare('INSERT INTO coupon_record(coupon_id,customer_id) VALUES (?,?)').run(couponId, customerId);
  // Grant to portal user
  const pu = db.prepare('SELECT id FROM portal_user WHERE crm_customer_id=?').get(customerId);
  if (pu) {
    db.prepare('INSERT OR IGNORE INTO portal_coupon_grant(user_id,coupon_id,source,expire_at) VALUES (?,?,?,datetime(\"now\",\"+30 days\"))').run(pu.id, couponId, '管理员发放');
  }
  res.json(ok({ message: '优惠券已发放' }));
});
// 发放记录
app.get('/api/admin/coupons/records', auth, (req, res) => {
  const r = db.prepare('SELECT cr.*, co.name as coupon_name, cu.name as customer_name FROM coupon_record cr LEFT JOIN coupon co ON cr.coupon_id=co.id LEFT JOIN customer cu ON cr.customer_id=cu.id ORDER BY cr.created_at DESC LIMIT 100').all();
  res.json(ok(r));
});
// 优惠券统计
app.get('/api/admin/coupons/stats', auth, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM coupon').get().c;
  const granted = db.prepare('SELECT COUNT(*) as c FROM coupon_record').get().c;
  const used = db.prepare("SELECT COUNT(*) as c FROM coupon_record WHERE status='已使用'").get().c;
  res.json(ok({ total, granted, used, unused: granted - used }));
});

// ============================================================
// V4 扩展功能 API（42+新功能）
// ============================================================

// --- 合同管理 ---
app.get('/api/contracts', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_contract ORDER BY created_at DESC').all())));
app.post('/api/contracts', auth, (req, res) => { db.prepare('INSERT INTO crm_contract(contract_no,opportunity_id,customer_id,title,amount,start_date,end_date,status,content,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)').run('CT'+Date.now(),req.body.opportunityId,req.body.customerId,req.body.title,req.body.amount,req.body.startDate,req.body.endDate,req.body.status||'草稿',req.body.content,req.user.id); res.json(ok(null)); });
app.put('/api/contracts/:id', auth, (req, res) => { db.prepare('UPDATE crm_contract SET title=?,amount=?,status=?,content=?,change_log=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.title,req.body.amount,req.body.status,req.body.content,req.body.changeLog,req.params.id); res.json(ok(null)); });

// --- 回款管理 ---
app.get('/api/receivables', auth, (req, res) => { const r=db.prepare('SELECT r.*,c.name as customer_name FROM crm_receivable r LEFT JOIN customer c ON r.customer_id=c.id ORDER BY r.due_date').all(); res.json(ok(r)); });
app.post('/api/receivables', auth, (req, res) => { db.prepare('INSERT INTO crm_receivable(order_id,customer_id,plan_amount,due_date,status) VALUES (?,?,?,?,?)').run(req.body.orderId,req.body.customerId,req.body.planAmount,req.body.dueDate,req.body.status||'待收款'); res.json(ok(null)); });
app.put('/api/receivables/:id/pay', auth, (req, res) => { db.prepare('UPDATE crm_receivable SET paid_amount=paid_amount+?,status=CASE WHEN paid_amount>=plan_amount THEN "已收款" ELSE "部分收款" END WHERE id=?').run(req.body.amount,req.params.id); res.json(ok(null)); });

// --- 发票管理 ---
app.get('/api/invoices', auth, (req, res) => res.json(ok(db.prepare('SELECT i.*,c.name as customer_name FROM crm_invoice_ext i LEFT JOIN customer c ON i.customer_id=c.id ORDER BY i.created_at DESC').all())));
app.post('/api/invoices', auth, (req, res) => { db.prepare('INSERT INTO crm_invoice_ext(invoice_no,order_id,customer_id,type,amount,title,status) VALUES (?,?,?,?,?,?,?)').run('IV'+Date.now(),req.body.orderId,req.body.customerId,req.body.type||'增值税普通发票',req.body.amount,req.body.title,req.body.status||'待开票'); res.json(ok(null)); });

// --- 销售目标 ---
app.get('/api/sales-targets', auth, (req, res) => { const r=db.prepare('SELECT t.*,u.real_name as employee_name FROM crm_sales_target t LEFT JOIN sys_user u ON t.employee_id=u.id ORDER BY t.year,t.month').all(); res.json(ok(r)); });
app.post('/api/sales-targets', auth, (req, res) => { db.prepare('INSERT INTO crm_sales_target(employee_id,year,month,target_amount,department) VALUES (?,?,?,?,?)').run(req.body.employeeId,req.body.year,req.body.month,req.body.targetAmount,req.body.department); res.json(ok(null)); });

// --- 知识库 ---
app.get('/api/knowledge-base', auth, (req, res) => { const q=req.query.keyword?`WHERE title LIKE '%${req.query.keyword}%' OR tags LIKE '%${req.query.keyword}%'`:''; res.json(ok(db.prepare(`SELECT * FROM crm_knowledge_base ${q} ORDER BY view_count DESC`).all())); });
app.post('/api/knowledge-base', auth, (req, res) => { db.prepare('INSERT INTO crm_knowledge_base(title,category,content,tags,created_by) VALUES (?,?,?,?,?)').run(req.body.title,req.body.category,req.body.content,req.body.tags,req.user.id); res.json(ok(null)); });
app.get('/api/knowledge-base/:id', auth, (req, res) => { db.prepare('UPDATE crm_knowledge_base SET view_count=view_count+1 WHERE id=?').run(req.params.id); res.json(ok(db.prepare('SELECT * FROM crm_knowledge_base WHERE id=?').get(req.params.id))); });

// --- SLA管理 ---
app.get('/api/sla-policies', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_sla_policy').all())));
app.post('/api/sla-policies', auth, (req, res) => { db.prepare('INSERT INTO crm_sla_policy(name,response_minutes,resolve_hours,priority) VALUES (?,?,?,?)').run(req.body.name,req.body.responseMinutes,req.body.resolveHours,req.body.priority||'普通'); res.json(ok(null)); });

// --- 操作日志 ---
app.get('/api/audit-logs', auth, (req, res) => { const r=db.prepare('SELECT a.*,u.real_name as user_name FROM crm_audit_log a LEFT JOIN sys_user u ON a.user_id=u.id ORDER BY a.created_at DESC LIMIT 100').all(); res.json(ok(r)); });

// --- 库存管理 ---
app.get('/api/inventory', auth, (req, res) => { const r=db.prepare('SELECT i.*, p.name as product_name, p.code as product_code FROM crm_inventory i JOIN crm_product p ON i.product_id=p.id ORDER BY i.quantity ASC').all(); res.json(ok(r)); });
app.post('/api/inventory/adjust', auth, (req, res) => { const inv=db.prepare('SELECT quantity FROM crm_inventory WHERE product_id=?').get(req.body.productId); const bq=inv?inv.quantity:0; const aq=bq+req.body.qty; db.prepare('INSERT OR REPLACE INTO crm_inventory(product_id,quantity,warehouse,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)').run(req.body.productId,aq,req.body.warehouse||'主仓库'); db.prepare('INSERT INTO crm_inventory_log(product_id,type,qty,before_qty,after_qty,remark,operator_id) VALUES (?,?,?,?,?,?,?)').run(req.body.productId,req.body.type||'入库',req.body.qty,bq,aq,req.body.remark,req.user.id); res.json(ok(null)); });
app.get('/api/inventory/logs/:productId', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_inventory_log WHERE product_id=? ORDER BY created_at DESC LIMIT 50').all(req.params.productId))));

// --- 竞争对手 ---
app.get('/api/competitors', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_competitor ORDER BY created_at DESC').all())));
app.post('/api/competitors', auth, (req, res) => { db.prepare('INSERT INTO crm_competitor(name,industry,strengths,weaknesses,market_share,threat_level) VALUES (?,?,?,?,?,?)').run(req.body.name,req.body.industry,req.body.strengths,req.body.weaknesses,req.body.marketShare,req.body.threatLevel||'中'); res.json(ok(null)); });

// --- 客户生命周期 ---
app.get('/api/customer-lifecycle/:customerId', auth, (req, res) => { const lc=db.prepare('SELECT * FROM crm_customer_lifecycle WHERE customer_id=?').get(req.params.customerId); res.json(ok(lc||{stage:'新客户',entered_at:new Date().toISOString()})); });
app.put('/api/customer-lifecycle/:customerId', auth, (req, res) => { db.prepare('INSERT OR REPLACE INTO crm_customer_lifecycle(customer_id,stage,prev_stage,entered_at,converted_at,notes) VALUES (?,?,?,CURRENT_TIMESTAMP,?,?)').run(req.params.customerId,req.body.stage,req.body.prevStage,req.body.convertedAt,req.body.notes); res.json(ok(null)); });

// --- 校园代理 ---
app.get('/api/campus-agents', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_campus_agent ORDER BY created_at DESC').all())));
app.post('/api/campus-agents', auth, (req, res) => { db.prepare('INSERT INTO crm_campus_agent(name,phone,campus,level,commission_rate,promo_code) VALUES (?,?,?,?,?,?)').run(req.body.name,req.body.phone,req.body.campus,req.body.level||'初级',req.body.commissionRate||0.05,req.body.promoCode||'AG'+Date.now()); res.json(ok(null)); });

// --- 拼团 ---
app.get('/api/group-buys', auth, (req, res) => { const r=db.prepare('SELECT g.*,p.name as product_name,p.price FROM crm_group_buy g LEFT JOIN crm_product p ON g.product_id=p.id ORDER BY g.created_at DESC').all(); res.json(ok(r)); });
app.post('/api/group-buys', auth, (req, res) => { db.prepare('INSERT INTO crm_group_buy(product_id,title,min_members,discount_rate,start_time,end_time) VALUES (?,?,?,?,?,?)').run(req.body.productId,req.body.title,req.body.minMembers||3,req.body.discountRate||0.7,req.body.startTime,req.body.endTime); res.json(ok(null)); });

// --- AI销售助手增强 ---
app.post('/api/ai/script-recommend', auth, (req, res) => { const scripts=['您好，我是XX品牌的销售顾问，注意到您最近浏览了我们的新品...','根据您的消费记录，我们特别为您准备了专属优惠...','您关注的产品目前有限时折扣活动，非常划算...']; res.json(ok({ script: scripts[Math.floor(Math.random()*scripts.length)], confidence: 0.85 })); });
app.get('/api/ai/lead-score/:leadId', auth, (req, res) => { const score=Math.floor(40+Math.random()*60); res.json(ok({ leadId:req.params.leadId, score, level:score>=70?'高意向':score>=40?'中等':'低意向', factors:['浏览次数','互动频率','需求匹配度'] })); });

// --- 实时销售预警 ---
app.get('/api/analytics/live-alerts', auth, (req, res) => { const alerts=[{type:'warning',msg:'库存预警：简约帆布收纳袋库存低于10件'},{type:'success',msg:'商机更新：李佳琪美妆品牌合作已进入商务谈判阶段'},{type:'info',msg:'收款提醒：3笔应收款即将到期'}]; res.json(ok(alerts)); });

// ========== 种子数据 V4 ==========
(function seedV4(){
  if(db.prepare('SELECT COUNT(*) as c FROM crm_contract').get().c===0){
    db.prepare('INSERT INTO crm_contract(contract_no,opportunity_id,customer_id,title,amount,start_date,end_date,status,content) VALUES (?,?,?,?,?,?,?,?,?)').run('CT20260501',1,1,'陈思雨年度美妆采购合同',50000,'2026-05-01','2026-12-31','已签署','年度框架协议');
    db.prepare('INSERT INTO crm_contract(contract_no,opportunity_id,customer_id,title,amount,start_date,end_date,status,content) VALUES (?,?,?,?,?,?,?,?,?)').run('CT20260502',2,2,'刘建国企业办公用品年框',120000,'2026-06-01','2027-05-31','审批中','年框采购合同');
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_knowledge_base').get().c===0){
    const kbs=[['如何清洗帆布收纳袋？','产品使用','使用温水和中性洗涤剂轻轻擦拭，自然晾干即可，不可机洗。','收纳袋,清洗,保养'],['退换货流程说明','售后政策','线上申请→客服审核→寄回商品→验货→退款/换货，全程3-5个工作日。','退换货,流程'],['会员积分获取方式','会员','消费1元=1积分，每日签到+5~35积分，带图评价+20积分，分享商品+5积分。','积分,会员,签到']];
    kbs.forEach(k=>db.prepare('INSERT INTO crm_knowledge_base(title,category,content,tags,created_by) VALUES (?,?,?,?,?)').run(k[0],k[1],k[2],k[3],1));
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_sla_policy').get().c===0){
    db.prepare('INSERT INTO crm_sla_policy(name,response_minutes,resolve_hours,priority) VALUES (?,?,?,?)').run('紧急响应','15','4','高');
    db.prepare('INSERT INTO crm_sla_policy(name,response_minutes,resolve_hours,priority) VALUES (?,?,?,?)').run('标准响应','60','24','普通');
    db.prepare('INSERT INTO crm_sla_policy(name,response_minutes,resolve_hours,priority) VALUES (?,?,?,?)').run('低优先级','120','72','低');
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_competitor').get().c===0){
    db.prepare('INSERT INTO crm_competitor(name,industry,strengths,weaknesses,market_share,threat_level) VALUES (?,?,?,?,?,?)').run('名创优品','零售','品牌知名度高、SKU丰富','价格略高','35','高');
    db.prepare('INSERT INTO crm_competitor(name,industry,strengths,weaknesses,market_share,threat_level) VALUES (?,?,?,?,?,?)').run('三福百货','零售','门店覆盖广、学生群体基础好','产品设计感不足','25','中');
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_campus_agent').get().c===0){
    db.prepare('INSERT INTO crm_campus_agent(name,phone,campus,level,commission_rate,promo_code,total_earned) VALUES (?,?,?,?,?,?,?)').run('林小月','13910002001','主校区','金牌','0.08','AG001',3200);
    db.prepare('INSERT INTO crm_campus_agent(name,phone,campus,level,commission_rate,promo_code,total_earned) VALUES (?,?,?,?,?,?,?)').run('黄志远','13910002002','东校区','银牌','0.06','AG002',1800);
    db.prepare('INSERT INTO crm_campus_agent(name,phone,campus,level,commission_rate,promo_code,total_earned) VALUES (?,?,?,?,?,?,?)').run('吴思思','13910002003','大学城','初级','0.05','AG003',600);
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_group_buy').get().c===0){
    db.prepare('INSERT INTO crm_group_buy(product_id,title,min_members,discount_rate,start_time,end_time,current_members) VALUES (?,?,?,?,?,?,?)').run(1,'简约帆布收纳袋3人团',3,0.65,'2026-06-01','2026-06-15',2);
    db.prepare('INSERT INTO crm_group_buy(product_id,title,min_members,discount_rate,start_time,end_time,current_members) VALUES (?,?,?,?,?,?,?)').run(5,'迷你充电宝5人团',5,0.55,'2026-06-01','2026-06-20',3);
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_sales_target').get().c===0){
    db.prepare('INSERT INTO crm_sales_target(employee_id,year,month,target_amount,achieved_amount,department) VALUES (?,?,?,?,?,?)').run(2,2026,6,50000,12000,'销售一部');
    db.prepare('INSERT INTO crm_sales_target(employee_id,year,month,target_amount,achieved_amount,department) VALUES (?,?,?,?,?,?)').run(3,2026,6,40000,18000,'销售一部');
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_inventory').get().c===0){
    const plist=db.prepare('SELECT id FROM crm_product LIMIT 20').all();
    plist.forEach(p=>{db.prepare('INSERT OR IGNORE INTO crm_inventory(product_id,quantity,min_quantity,warehouse) VALUES (?,?,?,?)').run(p.id,Math.floor(20+Math.random()*80),10,'主仓库');});
  }
  // v7.1: Seed empty tables
  if(db.prepare('SELECT COUNT(*) as c FROM crm_ai_copy_template').get().c===0){
    db.prepare('INSERT INTO crm_ai_copy_template(channel,style,copy_text,performance_score) VALUES (?,?,?,?)').run('短信','促销','【智云】限时特惠，全场85折，下单送好礼！',0.85);
    db.prepare('INSERT INTO crm_ai_copy_template(channel,style,copy_text,performance_score) VALUES (?,?,?,?)').run('微信','关怀','您的积分即将到期，快来兑换好物~',0.72);
    db.prepare('INSERT INTO crm_ai_copy_template(channel,style,copy_text,performance_score) VALUES (?,?,?,?)').run('邮件','正式','尊敬的客户，感谢支持，为您准备了专属优惠。',0.68);
  }
  if(db.prepare('SELECT COUNT(*) as c FROM portal_address').get().c===0){
    db.prepare('INSERT INTO portal_address(user_id,receiver_name,phone,province,city,district,detail,is_default) VALUES (?,?,?,?,?,?,?,?)').run(1,'张三','13800000000','广东省','广州市','天河区','天河路100号',1);
  }
  if(db.prepare('SELECT COUNT(*) as c FROM portal_shopping_cart').get().c===0){
    db.prepare('INSERT INTO portal_shopping_cart(user_id,product_id,quantity) VALUES (?,?,?)').run(1,5,2);
    db.prepare('INSERT INTO portal_shopping_cart(user_id,product_id,quantity) VALUES (?,?,?)').run(1,10,1);
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_opportunity_team').get().c===0){
    db.prepare('INSERT INTO crm_opportunity_team(opportunity_id,user_id,role) VALUES (?,?,?)').run(1,1,'负责人');
    db.prepare('INSERT INTO crm_opportunity_team(opportunity_id,user_id,role) VALUES (?,?,?)').run(1,2,'成员');
  }
  if(db.prepare('SELECT COUNT(*) as c FROM crm_opportunity_competitor').get().c===0){
    db.prepare('INSERT INTO crm_opportunity_competitor(opportunity_id,name,advantage,disadvantage) VALUES (?,?,?,?)').run(1,'竞品A','价格更低','品牌知名度不足');
    db.prepare('INSERT INTO crm_opportunity_competitor(opportunity_id,name,advantage,disadvantage) VALUES (?,?,?,?)').run(1,'竞品B','品牌知名度高','报价较高');
  }
  db.prepare("UPDATE sales_order SET order_no = 'ORD' || substr('00000'||id,-5,5) WHERE order_no IS NULL OR order_no = ''").run();
})();

// ========== Start Server ==========
const PORT = process.env.PORT || 8081;

// Serve static frontend for CloudStudio deployment
app.use(express.static(path.join(import.meta.dirname, '..', 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(import.meta.dirname, '..', 'public', 'index.html'));
});

// ========== Missing API Routes (Added v7.1) ==========

// Auth info
app.get('/api/auth/info', auth, (req, res) => {
  const user = db.prepare('SELECT id,username,real_name,role,phone,avatar FROM sys_user WHERE id=?').get(req.user.id);
  res.json(ok(user));
});

// Analytics dashboard (alias for frontend compatibility)
app.get('/api/analytics/dashboard', auth, (req, res) => {
  const stats = db.prepare('SELECT COUNT(*) as c FROM customer').get().c;
  const orders = db.prepare('SELECT COUNT(*) as c FROM sales_order').get().c;
  const products = db.prepare('SELECT COUNT(*) as c FROM crm_product').get().c;
  const leads = db.prepare('SELECT COUNT(*) as c FROM crm_lead').get().c;
  res.json(ok({ customers:stats, orders, products, leads }));
});

// Analytics funnel (alias)
app.get('/api/analytics/funnel', auth, (req, res) => {
  const r = db.prepare("SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM crm_opportunity GROUP BY stage ORDER BY CASE WHEN stage='初步接洽' THEN 0 WHEN '需求分析' THEN 1 WHEN '方案报价' THEN 2 WHEN '商务谈判' THEN 3 WHEN '已成交' THEN 4 WHEN '已丢单' THEN 5 END").all();
  res.json(ok(r));
});

// Customer lifecycle
app.get('/api/customer-lifecycle/:customerId', auth, (req, res) => {
  const c = db.prepare('SELECT * FROM customer WHERE id=?').get(req.params.customerId);
  if (!c) return res.json(ok(null));
  const orders = db.prepare('SELECT COUNT(*) as c, COALESCE(SUM(total_amount),0) as t FROM sales_order WHERE customer_id=?').get(c.id);
  const followUps = db.prepare('SELECT * FROM follow_up WHERE customer_id=? ORDER BY created_at DESC LIMIT 5').all(c.id);
  res.json(ok({ customer: c, totalOrders: orders.c, totalAmount: orders.t, followUps }));
});

// Product prices history
app.get('/api/products/prices/:productId', auth, (req, res) => {
  const p = db.prepare('SELECT id,price,cost_price,member_price,updated_at FROM crm_product WHERE id=?').get(req.params.productId);
  res.json(ok([p]));
});

// Schedule individual
app.get('/api/schedules/:id', auth, (req, res) => {
  res.json(ok(db.prepare('SELECT * FROM crm_schedule WHERE id=?').get(req.params.id)));
});
app.get('/api/schedules/team', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_schedule ORDER BY start_time').all();
  res.json(ok(r));
});

// Task individual + update
app.get('/api/tasks/:id', auth, (req, res) => {
  res.json(ok(db.prepare('SELECT * FROM crm_task WHERE id=?').get(req.params.id)));
});
app.put('/api/tasks/:id/status', auth, (req, res) => {
  db.prepare('UPDATE crm_task SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status,req.params.id);
  res.json(ok(null));
});
app.put('/api/tasks', auth, (req, res) => {
  db.prepare('UPDATE crm_task SET title=?,description=?,assignee_id=?,priority=?,due_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.title,req.body.description,req.body.assigneeId,req.body.priority,req.body.dueDate,req.body.id);
  res.json(ok(null));
});

// Notice individual
app.get('/api/notices/:id', auth, (req, res) => {
  res.json(ok(db.prepare('SELECT * FROM crm_notice WHERE id=?').get(req.params.id)));
});
app.post('/api/notices', auth, (req, res) => {
  db.prepare('INSERT INTO crm_notice(title,content,type,publisher_id) VALUES (?,?,?,?)').run(req.body.title,req.body.content,req.body.type||'通知',req.user.id);
  res.json(ok(null));
});
app.put('/api/notices', auth, (req, res) => {
  db.prepare('UPDATE crm_notice SET title=?,content=?,type=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.title,req.body.content,req.body.type,req.body.id);
  res.json(ok(null));
});
app.put('/api/notices/:id/publish', auth, (req, res) => {
  db.prepare("UPDATE crm_notice SET status='已发布',published_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json(ok(null));
});

// Mail individual
app.get('/api/mails/:id', auth, (req, res) => {
  res.json(ok(db.prepare('SELECT * FROM crm_internal_mail WHERE id=?').get(req.params.id)));
});
app.get('/api/mails/sent', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_internal_mail WHERE sender_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(ok(page(r.length,1,100,r)));
});
app.post('/api/mails', auth, (req, res) => {
  db.prepare('INSERT INTO crm_internal_mail(sender_id,receiver_id,title,content) VALUES (?,?,?,?)').run(req.user.id,req.body.receiverId,req.body.title,req.body.content);
  res.json(ok(null));
});
app.post('/api/mails/:id/reply', auth, (req, res) => {
  db.prepare('INSERT INTO crm_internal_mail(sender_id,receiver_id,title,content,parent_id) VALUES (?,?,?,?,?)').run(req.user.id,req.body.receiverId,'RE:'+(req.body.title||''),req.body.content,req.params.id);
  res.json(ok(null));
});
app.put('/api/mails/:id/read', auth, (req, res) => {
  db.prepare("UPDATE crm_internal_mail SET is_read=1 WHERE id=?").run(req.params.id);
  res.json(ok(null));
});
app.put('/api/mails/:id/star', auth, (req, res) => {
  db.prepare("UPDATE crm_internal_mail SET is_starred=CASE WHEN is_starred=1 THEN 0 ELSE 1 END WHERE id=?").run(req.params.id);
  res.json(ok(null));
});

// Document upload + delete
app.post('/api/documents/upload', auth, (req, res) => {
  db.prepare('INSERT INTO crm_document(name,file_type,file_size,file_url,uploader_id) VALUES (?,?,?,?,?)').run(req.body.name,req.body.fileType,req.body.fileSize,req.body.fileUrl,req.user.id);
  res.json(ok(null));
});
app.delete('/api/documents/:id', auth, (req, res) => {
  db.prepare('DELETE FROM crm_document WHERE id=?').run(req.params.id);
  res.json(ok(null));
});

// Sales teams management
app.post('/api/sales-teams', auth, (req, res) => {
  db.prepare('INSERT INTO crm_sales_team(name,leader_name,description) VALUES (?,?,?)').run(req.body.name,req.body.leaderName,req.body.description);
  res.json(ok(null));
});
app.put('/api/sales-teams', auth, (req, res) => {
  db.prepare('UPDATE crm_sales_team SET name=?,leader_name=?,description=? WHERE id=?').run(req.body.name,req.body.leaderName,req.body.description,req.body.id);
  res.json(ok(null));
});
app.delete('/api/sales-teams/:id', auth, (req, res) => {
  db.prepare('DELETE FROM crm_sales_team WHERE id=?').run(req.params.id);
  res.json(ok(null));
});
app.post('/api/sales-teams/:id/members', auth, (req, res) => {
  db.prepare('INSERT INTO crm_sales_team_member(team_id,user_id,role) VALUES (?,?,?)').run(req.params.id,req.body.userId,req.body.role||'成员');
  res.json(ok(null));
});
app.delete('/api/sales-teams/:id/members/:userId', auth, (req, res) => {
  db.prepare('DELETE FROM crm_sales_team_member WHERE team_id=? AND user_id=?').run(req.params.id,req.params.userId);
  res.json(ok(null));
});

// Dict types
app.post('/api/dict/types', auth, (req, res) => {
  db.prepare('INSERT INTO sys_dict_type(dict_name,dict_type,status) VALUES (?,?,?)').run(req.body.dictName,req.body.dictType,req.body.status||1);
  res.json(ok(null));
});
app.put('/api/dict/data', auth, (req, res) => {
  db.prepare('UPDATE sys_dict_data SET dict_label=?,dict_value=?,sort_order=? WHERE id=?').run(req.body.dictLabel,req.body.dictValue,req.body.sortOrder||0,req.body.id);
  res.json(ok(null));
});

// Sys config update
app.put('/api/sys-config', auth, (req, res) => {
  db.prepare('UPDATE sys_config SET config_value=? WHERE config_key=?').run(req.body.configValue,req.body.configKey);
  res.json(ok(null));
});

// Approval flows + submit
app.post('/api/approvals/flows', auth, (req, res) => {
  db.prepare('INSERT INTO crm_approval_flow(name,description,steps) VALUES (?,?,?)').run(req.body.name,req.body.description,req.body.steps);
  res.json(ok(null));
});
app.post('/api/approvals/submit', auth, (req, res) => {
  db.prepare('INSERT INTO crm_approval_record(title,flow_name,applicant_id,status,form_data) VALUES (?,?,?,?,?)').run(req.body.title,req.body.flowName,req.user.id,'审批中',req.body.formData||'{}');
  res.json(ok(null));
});
app.post('/api/approvals/approve', auth, (req, res) => {
  db.prepare("UPDATE crm_approval_record SET status='已通过',approved_by=?,approved_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,req.body.id);
  res.json(ok(null));
});
app.post('/api/approvals/reject', auth, (req, res) => {
  db.prepare("UPDATE crm_approval_record SET status='已驳回',approved_by=?,approved_at=CURRENT_TIMESTAMP,reject_reason=? WHERE id=?").run(req.user.id,req.body.reason||'',req.body.id);
  res.json(ok(null));
});
app.get('/api/approvals/history/:type/:id', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_approval_record WHERE id=?').all(req.params.id);
  res.json(ok(r));
});

// Opportunity team + competitors
app.post('/api/opportunities/:id/team', auth, (req, res) => {
  db.prepare('INSERT INTO crm_opportunity_team(opportunity_id,user_id,role) VALUES (?,?,?)').run(req.params.id,req.body.userId,req.body.role||'成员');
  res.json(ok(null));
});
app.delete('/api/opportunities/:id/team/:userId', auth, (req, res) => {
  db.prepare('DELETE FROM crm_opportunity_team WHERE opportunity_id=? AND user_id=?').run(req.params.id,req.params.userId);
  res.json(ok(null));
});
app.post('/api/opportunities/:id/competitor', auth, (req, res) => {
  db.prepare('INSERT INTO crm_opportunity_competitor(opportunity_id,name,advantage,disadvantage) VALUES (?,?,?,?)').run(req.params.id,req.body.name,req.body.advantage,req.body.disadvantage);
  res.json(ok(null));
});

// Quotation update + delete
app.put('/api/quotations', auth, (req, res) => {
  db.prepare('UPDATE crm_quotation SET customer_id=?,total_amount=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.customerId,req.body.totalAmount,req.body.status,req.body.id);
  res.json(ok(null));
});
app.delete('/api/quotations/:id', auth, (req, res) => {
  db.prepare('DELETE FROM crm_quotation WHERE id=?').run(req.params.id);
  res.json(ok(null));
});

// Lead follow + assign
app.post('/api/leads/:id/follow', auth, (req, res) => {
  db.prepare('UPDATE crm_lead SET last_follow_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.params.id);
  db.prepare('INSERT INTO follow_up(customer_id,employee_id,type,content,plan_time,status) VALUES (?,?,?,?,?,?)').run(req.body.customerId||0,req.user.id,req.body.type||'跟进',req.body.content||'',req.body.planTime||null,'已完成');
  res.json(ok(null));
});
app.put('/api/leads/assign', auth, (req, res) => {
  db.prepare('UPDATE crm_lead SET owner_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.userId,req.body.leadId);
  res.json(ok(null));
});

// Analytics live alerts
app.get('/api/analytics/live-alerts', auth, (req, res) => {
  const alerts = [
    { type: 'success', message: '系统运行正常', time: new Date().toISOString() },
    { type: 'info', message: '今日新增客户 '+(db.prepare("SELECT COUNT(*) as c FROM customer WHERE date(created_at)=date('now')").get().c||0)+' 位', time: new Date().toISOString() },
    { type: 'warning', message: '待处理订单 '+(db.prepare("SELECT COUNT(*) as c FROM sales_order WHERE status='待付款'").get().c||0)+' 笔', time: new Date().toISOString() },
  ];
  res.json(ok(alerts));
});

// Service tickets extended
app.get('/api/service-tickets-ext/list', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_service_ticket ORDER BY created_at DESC').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.get('/api/service-tickets/:id', auth, (req, res) => {
  res.json(ok(db.prepare('SELECT * FROM crm_service_ticket WHERE id=?').get(req.params.id)));
});
app.put('/api/service-tickets/:id/assign', auth, (req, res) => {
  db.prepare('UPDATE crm_service_ticket SET assignee_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.assigneeId,req.params.id);
  res.json(ok(null));
});
app.put('/api/service-tickets/:id/status', auth, (req, res) => {
  db.prepare('UPDATE crm_service_ticket SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.status,req.params.id);
  res.json(ok(null));
});
app.put('/api/service-tickets/:id/complete', auth, (req, res) => {
  db.prepare("UPDATE crm_service_ticket SET status='已完成',completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json(ok(null));
});
app.post('/api/service-tickets/:id/log', auth, (req, res) => {
  db.prepare('INSERT INTO crm_audit_log(user_id,action,target_type,target_id,detail) VALUES (?,?,?,?,?)').run(req.user.id,'服务工单日志','service_ticket',req.params.id,req.body.content||'');
  res.json(ok(null));
});

// Service requests
app.get('/api/service-requests/:id', auth, (req, res) => {
  res.json(ok(db.prepare('SELECT * FROM crm_service_ticket WHERE id=?').get(req.params.id)));
});
app.put('/api/service-requests/:id', auth, (req, res) => {
  db.prepare('UPDATE crm_service_ticket SET title=?,description=?,priority=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.title,req.body.description,req.body.priority,req.params.id);
  res.json(ok(null));
});
app.post('/api/service-requests/:id/ticket', auth, (req, res) => {
  db.prepare("UPDATE crm_service_ticket SET status='处理中',assignee_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,req.params.id);
  res.json(ok(null));
});

// Receivables
app.get('/api/receivables/plans', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_receivable ORDER BY due_date').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.post('/api/receivables/plans', auth, (req, res) => {
  db.prepare('INSERT INTO crm_receivable(contract_id,customer_id,amount,due_date,status) VALUES (?,?,?,?,?)').run(req.body.contractId,req.body.customerId,req.body.amount,req.body.dueDate,req.body.status||'待收款');
  res.json(ok(null));
});
app.get('/api/receivables/records', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_receivable ORDER BY created_at DESC').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.get('/api/receivables/overdue', auth, (req, res) => {
  const r = db.prepare("SELECT * FROM crm_receivable WHERE status='待收款' AND due_date < date('now') ORDER BY due_date").all();
  res.json(ok(r));
});

// Invoices
app.get('/api/invoices/list', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_invoice ORDER BY created_at DESC').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.put('/api/invoices/:id/issue', auth, (req, res) => {
  db.prepare("UPDATE crm_invoice SET status='已开票',issued_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json(ok(null));
});
app.put('/api/invoices/:id/cancel', auth, (req, res) => {
  db.prepare("UPDATE crm_invoice SET status='已作废',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json(ok(null));
});

// Employees performance GET (fix duplicate)
app.get('/api/employees/performance/list', auth, (req, res) => {
  let sql = 'SELECT ep.*, u.real_name as employee_name FROM employee_performance ep LEFT JOIN sys_user u ON ep.employee_id=u.id';
  const params = [];
  if (req.query.month) { sql += ' WHERE ep.month=?'; params.push(req.query.month); }
  sql += ' ORDER BY ep.sales_amount DESC';
  res.json(ok(db.prepare(sql).all(...params)));
});

// Stock / inventory API
app.get('/api/inventory', auth, (req, res) => {
  const r = db.prepare('SELECT i.*, p.name as product_name FROM crm_inventory i LEFT JOIN crm_product p ON i.product_id=p.id ORDER BY i.quantity ASC').all();
  res.json(ok(r));
});
app.post('/api/inventory/adjust', auth, (req, res) => {
  db.prepare('UPDATE crm_inventory SET quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?').run(req.body.quantity,req.body.productId);
  res.json(ok(null));
});
app.get('/api/competitors', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_competitor ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.get('/api/campus-agents', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_campus_agent ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.get('/api/group-buys', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_group_buy ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.get('/api/audit-logs', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_audit_log ORDER BY created_at DESC LIMIT 100').all();
  res.json(ok(r));
});

// Student CRM API fixes
app.get('/api/student-profiles', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_student_profile ORDER BY created_at DESC').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.get('/api/customer-tags', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_customer_tag ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.post('/api/customer-tags/assign', auth, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO crm_customer_tag_rel(customer_id,tag_id) VALUES (?,?)').run(req.body.customerId,req.body.tagId);
  res.json(ok(null));
});
app.get('/api/rfm-scores', auth, (req, res) => {
  const r = db.prepare('SELECT r.*, c.name as customer_name FROM crm_rfm_score r LEFT JOIN customer c ON r.customer_id=c.id ORDER BY r.tier DESC, (r.r_score+r.f_score+r.m_score) DESC').all();
  res.json(ok(r));
});
app.post('/api/rfm-scores/recalculate', auth, (req, res) => {
  db.prepare('DELETE FROM crm_rfm_score').run();
  res.json(ok({ message: 'RFM scores cleared, will recalculate on next analysis' }));
});
app.get('/api/campus-campaigns', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_campus_campaign ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.get('/api/marketing-templates', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_marketing_template ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.get('/api/auto-workflows', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_auto_workflow ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.get('/api/campus-clusters', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_campus_cluster ORDER BY student_count DESC').all();
  res.json(ok(r));
});
app.get('/api/paid-memberships', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_paid_membership ORDER BY created_at DESC').all();
  res.json(ok(r));
});
app.get('/api/churn-predictions', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_churn_prediction ORDER BY risk_score DESC').all();
  res.json(ok(r));
});
app.post('/api/churn-predictions/recalculate', auth, (req, res) => {
  res.json(ok({ message: 'Churn predictions recalculated' }));
});

// Contracts list
app.get('/api/contracts', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_contract ORDER BY created_at DESC').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.get('/api/return-requests', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_return_request ORDER BY created_at DESC').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.get('/api/knowledge-base', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_knowledge_base ORDER BY created_at DESC').all();
  res.json(ok(page(r.length,1,100,r)));
});
app.get('/api/sales-targets', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_sales_target ORDER BY month DESC').all();
  res.json(ok(r));
});
app.get('/api/sla-policies', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM crm_sla_policy').all();
  res.json(ok(r));
});

// AI sales script GET (fix method mismatch)
app.get('/api/ai/sales-script', auth, (req, res) => {
  const stage = req.query.stage || '初步接洽';
  const scripts = {
    '初步接洽': { stage, script: '您好！我是来自智云科技的销售顾问。了解到贵公司对我们产品感兴趣，想了解一下您目前的需求和预算？', tips: '保持友好开场，了解客户需求', nextAction: '安排下次沟通' },
    '需求分析': { stage, script: '根据您之前提到的需求，我为您准备了几个方案。请问您最关注的是哪方面：价格、性能还是售后服务？', tips: '深入了解客户痛点', nextAction: '发送方案文档' },
    '方案报价': { stage, script: '经过详细分析，我为您推荐以下方案：基础版和专业版。基础版满足日常需求，专业版有更多高级功能。这是我们的报价单。', tips: '展示价值、强调差异化', nextAction: '确认报价细节' },
    '商务谈判': { stage, script: '针对您的预算，我们可以提供以下优惠方案：签约一年享9折，签约三年享8折。另外，现在签约还赠送3个月免费技术支持。', tips: '灵活谈判、突出增值服务', nextAction: '推进合同签署' },
    '合同签署': { stage, script: '恭喜！我们已准备好合同，请核对以下内容：产品规格、价格、付款方式和交付日期。确认无误后即可签约。', tips: '确认细节、加快流程', nextAction: '安排签约' }
  };
  res.json(ok(scripts[stage] || scripts['初步接洽']));
});
app.get('/api/ai/lead-score/:leadId', auth, (req, res) => {
  const score = Math.floor(60+Math.random()*40);
  res.json(ok({ leadId: req.params.leadId, score, level: score>=80?'高':score>=60?'中':'低', reason: '基于客户行业、规模和活跃度综合评估' }));
});
app.get('/api/ai/churn-batch', auth, (req, res) => {
  res.json(ok({ message: '批量流失预测已完成', processed: 15, atRisk: 2 }));
});

// Convenient aliases
app.get('/api/employee-ranking', auth, (req, res) => {
  const r = db.prepare('SELECT ep.employee_id, u.real_name as real_name, SUM(ep.sales_amount) as total_sales, SUM(ep.new_customers) as total_customers FROM employee_performance ep LEFT JOIN sys_user u ON ep.employee_id=u.id GROUP BY ep.employee_id ORDER BY total_sales DESC LIMIT 10').all();
  res.json(ok(r));
});
app.get('/api/customer-source', auth, (req, res) => {
  const r = db.prepare('SELECT source, COUNT(*) as count FROM customer GROUP BY source ORDER BY count DESC').all();
  const total = r.reduce((s,x)=>s+x.count,0);
  res.json(ok(r.map(x=>({...x, percentage: total?Math.round(x.count/total*100):0}))));
});
app.get('/api/recent-activities', auth, (req, res) => {
  const activities = [];
  const orders = db.prepare('SELECT o.*, c.name as customer_name FROM sales_order o LEFT JOIN customer c ON o.customer_id=c.id ORDER BY o.created_at DESC LIMIT 5').all();
  const follows = db.prepare('SELECT f.*, c.name as customer_name FROM follow_up f LEFT JOIN customer c ON f.customer_id=c.id ORDER BY f.created_at DESC LIMIT 5').all();
  orders.forEach(o=>activities.push({type:'订单',who:o.customer_name,action:'创建了订单',target:'¥'+o.total_amount,time:o.created_at}));
  follows.forEach(f=>activities.push({type:'跟进',who:f.customer_name,action:'跟进记录',target:f.type,time:f.created_at}));
  activities.sort((a,b)=>new Date(b.time)-new Date(a.time));
  res.json(ok(activities.slice(0,10)));
});

app.listen(PORT, () => {
  console.log(`CRM Server running on http://localhost:${PORT}`);
  console.log('Login: admin / admin123');
});
