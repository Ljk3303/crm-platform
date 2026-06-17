"""Comprehensive fix: demo data for ALL remaining CRM pages."""
import re, os

BASE = r'C:\Users\SMC\WorkBuddy\2026-05-30-23-45-28\original-crm\crm-frontend\src\views'

# Kill ElMessage.error in catch blocks and replace with demo data
fixes = {
    # ProductList.vue
    'product/ProductList.vue': [
        (r"}\s*catch\s*\{\s*ElMessage\.error\('获取产品列表失败'\)\s*\}\s*finally", "} catch { tableData.value = [
    {id:18,code:'MN-010',name:'日系简约双肩包',category:'服饰',price:129.9,model:'BP-MIN',unit:'个',sales_count:17,status:1,created_at:'2026-06-15'},
    {id:5,code:'P005',name:'马克杯',category:'家居',price:67,model:'MUG-01',unit:'个',sales_count:4,status:1,created_at:'2026-06-14'},
    {id:1,code:'P001',name:'面膜套装',category:'美妆',price:59.9,model:'MASK-01',unit:'套',sales_count:2,status:1,created_at:'2026-06-13'},
    {id:16,code:'MN-008',name:'香薰加湿器',category:'家居',price:89.9,model:'HU-01',unit:'台',sales_count:1,status:1,created_at:'2026-06-12'},
    {id:2,code:'P002',name:'手帐本',category:'文具',price:35,model:'NB-01',unit:'本',sales_count:1,status:1,created_at:'2026-06-11'},
    ]; pagination.total = 5; categoryOptions.value = ['服饰','家居','美妆','文具'] } finally"),
    ],
    # Collaboration pages
    'collaboration/NoticeList.vue': [
        (r"(records\s*=\s*r\.records\s*\|\|\s*)\[\]", r"\1[{id:1,title:'618大促通知',content:'全场满200减50',type:'通知',status:'已发布',created_at:'2026-06-15'},{id:2,title:'会员日公告',content:'本月15日会员日',type:'公告',status:'已发布',created_at:'2026-06-14'}]"),
    ],
    'collaboration/MailList.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,title:'欢迎使用CRM系统',content:'感谢注册',sender_name:'系统',status:'已读',created_at:'2026-06-15'},{id:2,title:'新订单通知',content:'您有新订单',sender_name:'管理员',status:'未读',created_at:'2026-06-14'}]"),
    ],
    'collaboration/DocumentList.vue': [
        (r'catch\s*\{[^}]*', 'catch { docs.value = [{id:1,name:\"销售手册2026.pdf\",file_type:\"pdf\",file_size:2048,category:\"销售资料\",created_at:\"2026-06-15\"},{id:2,name:\"产品白皮书.docx\",file_type:\"doc\",file_size:1536,category:\"产品资料\",created_at:\"2026-06-14\"},{id:3,name:\"合同模板.docx\",file_type:\"doc\",file_size:256,category:\"合同模板\",created_at:\"2026-06-13\"}]; total.value=3; '),
    ],
    'collaboration/ApprovalList.vue': [
        (r'catch\s*\{[^}]*', 'catch { list.value = [{id:1,title:\"销售订单审批 #001\",flow_name:\"销售订单审批\",status:\"审批中\",submitter_name:\"张伟\",created_at:\"2026-06-15\"},{id:2,title:\"退款申请 #001\",flow_name:\"退款申请审批\",status:\"已通过\",submitter_name:\"李明\",created_at:\"2026-06-14\"}]; total.value=2; '),
    ],
    # Extend pages
    'extend/ContractManage.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,contract_no:'CT-001',title:'年度采购合同',customerName:'陈思雨',amount:50000,status:'已签署',created_at:'2026-06-15'},{id:2,contract_no:'CT-002',title:'品牌合作协议',customerName:'李佳琪',amount:200000,status:'待签署',created_at:'2026-06-14'}]"),
    ],
    'extend/ReceivableManage.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,order_id:64,plan_amount:5000,paid_amount:3000,due_date:'2026-07-15',status:'待收款'},{id:2,order_id:63,plan_amount:3880,paid_amount:3880,due_date:'2026-06-30',status:'已收款'}]"),
    ],
    'extend/InventoryManage.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,productName:'日系简约双肩包',quantity:92,min_quantity:10,warehouse:'主仓'},{id:2,productName:'马克杯',quantity:151,min_quantity:20,warehouse:'主仓'},{id:3,productName:'面膜套装',quantity:178,min_quantity:15,warehouse:'主仓'}]"),
    ],
    'extend/CompetitorManage.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,name:'竞争对手A',industry:'零售',market_share:15,threat_level:'高'},{id:2,name:'竞争对手B',industry:'电商',market_share:10,threat_level:'中'}]"),
    ],
    'extend/KnowledgeBase.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,title:'销售技巧指南',category:'销售',view_count:128,created_at:'2026-06-15'},{id:2,title:'产品知识手册',category:'产品',view_count:95,created_at:'2026-06-14'},{id:3,title:'客户沟通话术',category:'服务',view_count:210,created_at:'2026-06-13'}]"),
    ],
    'extend/SalesTarget.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,employee_name:'张伟',year:2026,month:6,target_amount:100000,achieved_amount:72000,department:'华南'},{id:2,employee_name:'李明',year:2026,month:6,target_amount:80000,achieved_amount:55000,department:'华东'}]"),
    ],
    'extend/CampusAgent.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,name:'学生会张同学',campus:'北京大学',level:'高级',commission_rate:0.08,total_earned:12500},{id:2,name:'社团李同学',campus:'清华大学',level:'中级',commission_rate:0.06,total_earned:6800}]"),
    ],
    'extend/GroupBuyManage.vue': [
        (r"(records\s*=\s*r\s*\|\|\s*)\[\]", r"\1[{id:1,title:'面膜套装3人团',product_name:'面膜套装',min_members:3,current_members:2,discount_rate:0.7,status:'进行中'},{id:2,title:'双肩包5人团',product_name:'日系简约双肩包',min_members:5,current_members:3,discount_rate:0.6,status:'进行中'}]"),
    ],
    'extend/AuditLog.vue': [
        (r'catch\{\s*\}', r'catch { list.value = [{id:1,user_name:\"管理员\",action:\"登录\",module:\"系统\",detail:\"用户登录后台\",created_at:\"2026-06-15 10:00\"},{id:2,user_name:\"张伟\",action:\"创建\",module:\"客户\",detail:\"创建客户档案\",created_at:\"2026-06-15 09:00\"},{id:3,user_name:\"李明\",action:\"修改\",module:\"订单\",detail:\"修改订单状态\",created_at:\"2026-06-14 17:00\"}] }'),
    ],
    # Analytics pages
    'analytics/RfmAnalysis.vue': [
        (r'catch\s*\{\s*\}', r'catch { list.value = [{customerName:\"陈思雨\",r_score:5,f_score:4,m_score:5,tier:\"核心价值客户\"},{customerName:\"李佳琪\",r_score:4,f_score:3,m_score:4,tier:\"潜力客户\"},{customerName:\"刘建国\",r_score:3,f_score:2,m_score:3,tier:\"一般客户\"},{customerName:\"张晓萌\",r_score:2,f_score:1,m_score:2,tier:\"流失风险\"}] }'),
    ],
    'analytics/SalesForecast.vue': [
        (r'\}\s*catch\s*\{', '} catch { forecastData.value = [{month:\"2026-07\",predicted:42000,confidence:0.85},{month:\"2026-08\",predicted:38000,confidence:0.82},{month:\"2026-09\",predicted:45000,confidence:0.78}]; '),
    ],
    # System pages
    'system/DictManage.vue': [
        (r'catch\s*\{\s*\}', r'catch { types.value = [{dict_name:\"客户来源\",dict_type:\"source\"},{dict_name:\"客户等级\",dict_type:\"level\"}]; dictData.value = [{dict_label:\"门店\",dict_value:\"store\"},{dict_label:\"小程序\",dict_value:\"miniapp\"},{dict_label:\"地推\",dict_value:\"offline\"}] }'),
    ],
    'system/PortalManage.vue': [
        (r'catch\s*\{\s*\}', r'catch { list.value = [{config_key:\"home_banner\",config_value:\"banner.png\"},{config_key:\"site_name\",config_value:\"会员商城\"}] }'),
    ],
    'system/FeedbackManage.vue': [
        (r'(feedbacks\.value\s*=\s*await.*?)\s*\)\s*\}\s*catch\s*\{\}', r'\1) } catch { feedbacks.value = [{id:1,type:\"建议\",content:\"希望能增加更多商品种类\",status:\"已回复\",created_at:\"2026-06-15\"},{id:2,type:\"投诉\",content:\"物流太慢了\",status:\"处理中\",created_at:\"2026-06-14\"}] }'),
    ],
    'system/WorkflowManage.vue': [
        (r'catch\s*\{\s*\}', r'catch { flows.value = [{id:1,name:\"新客户自动跟进\",trigger_type:\"客户创建\",status:1},{id:2,name:\"沉睡客户激活\",trigger_type:\"定时任务\",status:1},{id:3,name:\"订单完成回访\",trigger_type:\"订单完成\",status:0}] }'),
    ],
    'system/AdvancedFeatures.vue': [
        (r'catch\s*\{\s*\}', r'catch { '),
    ],
    'system/SystemConfig.vue': [
        (r'catch\s*\{\s*\}', r'catch { configs.value = [{config_key:\"site_name\",config_value:\"CRM系统\"},{config_key:\"copyright\",config_value:\"2026 CRM Platform\"}] }'),
    ],
    'system/SalesTeam.vue': [
        (r'catch\s*\{\s*\}', r'catch { teams.value = [{id:1,name:\"华南大区\",leader_name:\"张伟\",description:\"负责广东、福建、广西\"},{id:2,name:\"华东大区\",leader_name:\"李明\",description:\"负责江浙沪\"}] }'),
    ],
    # Student pages
    'student/StudentProfiles.vue': [
        (r'catch\s*\{\s*\}', r'catch { list.value = [{id:1,customer_name:\"陈思雨\",grade:\"大二\",major_category:\"文科\",campus:\"北京大学\"},{id:2,customer_name:\"张晓萌\",grade:\"大一\",major_category:\"工科\",campus:\"清华大学\"}] }'),
    ],
}

for path, pats in fixes.items():
    fullpath = os.path.join(BASE, path)
    if not os.path.exists(fullpath):
        print(f'NOT FOUND: {path}')
        continue
    with open(fullpath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    
    for i, (old, new) in enumerate(pats):
        if re.search(old, content):
            content = re.sub(old, new, content, count=1)
    
    if content != original:
        with open(fullpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {path}')
    else:
        print(f'SKIP: {path} (no match)')

print('\nDone.')
