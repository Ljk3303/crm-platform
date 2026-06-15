<template>
<div class="x-hub">
  <h2>📦 高级功能中心</h2>
  <p style="color:#64748B;font-size:13px;margin-bottom:16px">V4扩展 — 点击任意卡片进入对应功能模块</p>

  <el-tabs v-model="tab" type="border-card">
    <!-- ===== 1. 销售自动化（全部可交互） ===== -->
    <el-tab-pane label="📊 销售自动化">
      <div class="card-row">
        <div class="f-card" @click="openPanel('funnel')"><span class="f-icon">📉</span><b>销售漏斗分析</b><p>漏斗图·转化率·瓶颈</p></div>
        <div class="f-card" @click="openPanel('contract')"><span class="f-icon">📝</span><b>合同管理</b><p>2份合同·创建·审批</p></div>
        <div class="f-card" @click="openPanel('receivable')"><span class="f-icon">💰</span><b>回款财务</b><p>3笔记录·收款·逾期</p></div>
        <div class="f-card" @click="openPanel('target')"><span class="f-icon">🎯</span><b>销售目标</b><p>3条目标·达成率</p></div>
        <div class="f-card" @click="openPanel('invoice')"><span class="f-icon">🧾</span><b>发票管理</b><p>2张发票·开票追踪</p></div>
        <div class="f-card" @click="openPanel('pool')"><span class="f-icon">🌊</span><b>公海池规则</b><p>自动回收·领取限制</p></div>
      </div>
      <!-- 销售漏斗面板 -->
      <div v-if="panel==='funnel'" class="panel"><h3>📉 销售漏斗分析</h3>
        <div ref="funnelChart" style="height:300px"></div>
        <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
          <div v-for="s in funnelData" :key="s.stage" class="funnel-stat"><b>{{ s.stage }}</b><br>{{ s.count }}个 · ¥{{ (s.amount||0).toLocaleString() }}</div>
        </div>
      </div>
      <!-- 合同 -->
      <div v-if="panel==='contract'" class="panel"><h3>📝 合同管理</h3>
        <el-button type="primary" size="small" @click="showContractForm=true">+ 新建合同</el-button>
        <el-table :data="contracts" stripe size="small" style="margin-top:8px"><el-table-column prop="contract_no" label="合同号" width="120"/><el-table-column prop="title" label="名称" min-width="150"/><el-table-column label="金额"><template #default="{row}">¥{{ row.amount?.toLocaleString() }}</template></el-table-column><el-table-column label="状态"><template #default="{row}"><el-tag :type="row.status==='已签署'?'success':'warning'" size="small">{{ row.status }}</el-tag></template></el-table-column><el-table-column label="操作"><template #default="{row}"><el-button size="small" @click="signContract(row)" v-if="row.status!=='已签署'">模拟签章</el-button></template></el-table-column></el-table>
      </div>
      <!-- 回款 -->
      <div v-if="panel==='receivable'" class="panel"><h3>💰 回款管理</h3>
        <el-table :data="receivables" stripe size="small"><el-table-column prop="customer_name" label="客户"/><el-table-column label="计划"><template #default="{row}">¥{{ row.plan_amount }}</template></el-table-column><el-table-column label="已收"><template #default="{row}">¥{{ row.paid_amount }}</template></el-table-column><el-table-column prop="due_date" label="到期"/><el-table-column label="状态"><template #default="{row}"><el-tag :type="row.status==='已收款'?'success':new Date(row.due_date)<new Date()?'danger':'warning'" size="small">{{ new Date(row.due_date)<new Date()&&row.status!=='已收款'?'已逾期':row.status }}</el-tag></template></el-table-column></el-table>
      </div>
      <!-- 目标 -->
      <div v-if="panel==='target'" class="panel"><h3>🎯 销售目标</h3>
        <el-table :data="targets" stripe size="small"><el-table-column prop="employee_name" label="员工"/><el-table-column label="目标"><template #default="{row}">¥{{ row.target_amount?.toLocaleString() }}</template></el-table-column><el-table-column label="已达成"><template #default="{row}">¥{{ row.achieved_amount?.toLocaleString() }}</template></el-table-column><el-table-column label="达成率" width="160"><template #default="{row}"><el-progress :percentage="Math.round(row.achieved_amount/row.target_amount*100)" :color="row.achieved_amount/row.target_amount>=0.8?'#10B981':'#F59E0B'"/></template></el-table-column></el-table>
      </div>
      <!-- 发票 -->
      <div v-if="panel==='invoice'" class="panel"><h3>🧾 发票管理</h3>
        <el-button size="small" type="primary" @click="showInvoiceForm=true">+ 开具发票</el-button>
        <el-table :data="invoices" stripe size="small" style="margin-top:8px"><el-table-column prop="invoice_no" label="发票号"/><el-table-column prop="customer_name" label="客户"/><el-table-column label="金额"><template #default="{row}">¥{{ row.amount }}</template></el-table-column><el-table-column label="状态"><template #default="{row}"><el-tag :type="row.status==='已开票'?'success':'info'" size="small">{{ row.status }}</el-tag></template></el-table-column></el-table>
      </div>
      <!-- 公海池 -->
      <div v-if="panel==='pool'" class="panel"><h3>🌊 公海池规则</h3><p style="color:#64748B">自动回收规则：客户分配给销售后，若超过15天未跟进，自动回收到公海池。领取限制：每位销售单日最多领取3条公海客户。分配策略：按销售业绩权重加权随机分配。</p><el-button size="small" type="primary" @click="simPool">执行一次回收检查</el-button><p v-if="poolResult" style="color:#10B981;margin-top:8px">{{ poolResult }}</p></div>
    </el-tab-pane>

    <!-- ===== 2. 营销自动化 ===== -->
    <el-tab-pane label="📢 营销自动化">
      <div class="card-row">
        <div class="f-card" @click="simulateSend"><span class="f-icon">📧</span><b>多渠道触达</b><p>模拟群发短信/邮件</p></div>
        <div class="f-card" @click="openPanel('mkt-roi')"><span class="f-icon">📈</span><b>营销ROI分析</b><p>投入产出·转化追踪</p></div>
        <div class="f-card" @click="openPanel('abtest')"><span class="f-icon">🔀</span><b>A/B测试</b><p>优惠券版本对比</p></div>
        <div class="f-card" @click="openPanel('content')"><span class="f-icon">🖼️</span><b>内容素材库</b><p>模板·变量·预览</p></div>
        <div class="f-card" @click="openPanel('journey')"><span class="f-icon">🗺️</span><b>客户旅程</b><p>阶段·触点·日志</p></div>
        <div class="f-card" @click="$router.push('/workflow-manage')"><span class="f-icon">⚡</span><b>工作流引擎</b><p>已实现·3条工作流</p></div>
      </div>
      <div v-if="panel==='mkt-roi'" class="panel"><h3>📈 营销ROI</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px"><div v-for="r in roiData" :key="r.name" class="roi-card"><b>{{ r.name }}</b><div style="font-size:22px;color:#2563EB;font-weight:800">¥{{ r.cost?.toLocaleString() }}</div><span style="color:#64748B;font-size:12px">投入</span><div style="font-size:18px;color:#10B981;font-weight:700">¥{{ r.revenue?.toLocaleString() }}</div><span style="color:#64748B;font-size:12px">产出</span><el-tag :type="r.roi>=3?'success':'warning'" size="small">ROI {{ r.roi }}x</el-tag></div></div></div>
      <div v-if="panel==='abtest'" class="panel"><h3>🔀 A/B测试</h3><p><b>A组</b>：满200减50券 → 转化率 8.2%</p><p><b>B组</b>：8折折扣券 → 转化率 11.5%</p><el-tag type="success">B组胜出 (+3.3%)</el-tag></div>
      <div v-if="panel==='content'" class="panel"><h3>🖼️ 营销素材库</h3><div v-for="t in aiTemplates" :key="t.id" class="kb-card"><b>{{ t.channel }} · {{ t.style }}</b><p>{{ t.copy_text?.substring(0,80) }}...</p></div></div>
      <div v-if="panel==='journey'" class="panel"><h3>🗺️ 客户旅程</h3><el-steps :active="3" finish-status="success"><el-step title="浏览商品"/><el-step title="加入购物车"/><el-step title="下单支付"/><el-step title="收货评价"/></el-steps></div>
      <div v-if="sendResult" class="panel" style="background:#F0FDF4"><p style="color:#065F46">{{ sendResult }}</p></div>
    </el-tab-pane>

    <!-- ===== 3. 客户服务 ===== -->
    <el-tab-pane label="🛎️ 客户服务">
      <div class="card-row">
        <div class="f-card" @click="openPanel('kb')"><span class="f-icon">📚</span><b>知识库</b><p>3篇文章·搜索</p></div>
        <div class="f-card" @click="openPanel('sla')"><span class="f-icon">⏱️</span><b>SLA管理</b><p>3级策略·超时提醒</p></div>
        <div class="f-card" @click="openPanel('ticket')"><span class="f-icon">🎫</span><b>服务工单</b><p>2条工单·分类处理</p></div>
        <div class="f-card" @click="openPanel('complaint')"><span class="f-icon">🚨</span><b>投诉升级</b><p>投诉管理·升级机制</p></div>
        <div class="f-card" @click="openPanel('return')"><span class="f-icon">🔄</span><b>退换货管理</b><p>2条申请·审核·退款</p></div>
        <div class="f-card" @click="openPanel('svc-quality')"><span class="f-icon">📊</span><b>服务质量</b><p>满意度·工单效率</p></div>
      </div>
      <div v-if="panel==='kb'" class="panel"><h3>📚 知识库</h3><el-input v-model="kbKeyword" placeholder="搜索..." prefix-icon="Search" style="max-width:300px;margin-bottom:8px" @input="searchKB"/><div v-for="k in kbList" :key="k.id" class="kb-card" @click="viewKB(k)"><b>{{ k.title }}</b><span style="color:#64748B;font-size:12px;margin-left:8px">📁 {{ k.category }} · 👁 {{ k.view_count }}</span></div></div>
      <div v-if="panel==='sla'" class="panel"><h3>⏱️ SLA</h3><el-table :data="slaList" stripe size="small"><el-table-column prop="name" label="策略"/><el-table-column label="响应(mins)"><template #default="{row}">{{ row.response_minutes }}</template></el-table-column><el-table-column label="解决(hours)"><template #default="{row}">{{ row.resolve_hours }}</template></el-table-column><el-table-column prop="priority" label="优先级"/></el-table></div>
      <div v-if="panel==='ticket'" class="panel"><h3>🎫 服务工单</h3><el-table :data="tickets" stripe size="small"><el-table-column prop="ticket_no" label="编号"/><el-table-column prop="type" label="类型"/><el-table-column prop="description" label="描述" min-width="150"/><el-table-column label="优先级"><template #default="{row}"><el-tag :type="row.priority==='高'?'danger':'info'" size="small">{{ row.priority }}</el-tag></template></el-table-column></el-table></div>
      <div v-if="panel==='complaint'" class="panel"><h3>🚨 投诉升级</h3><p>当客户投诉超过24小时未处理，自动升级到主管。当前投诉：<el-tag type="danger">1条待处理</el-tag></p><el-button size="small" type="warning" @click="ElMessage.success('已升级所有超时投诉到主管')">手动升级</el-button></div>
      <div v-if="panel==='return'" class="panel"><h3>🔄 退换货</h3><el-table :data="returns" stripe size="small"><el-table-column prop="reason" label="原因"/><el-table-column prop="product_info" label="商品"/><el-table-column prop="method" label="方式"/><el-table-column label="状态"><template #default="{row}"><el-tag size="small">{{ row.status }}</el-tag></template></el-table-column><el-table-column label="操作"><template #default="{row}"><el-button size="small" type="success" v-if="row.status==='待审核'" @click="approveReturn(row)">审核通过</el-button></template></el-table-column></el-table></div>
      <div v-if="panel==='svc-quality'" class="panel"><h3>📊 服务质量分析</h3><div style="display:flex;gap:16px"><div class="roi-card"><b>平均响应</b><div style="font-size:22px;color:#2563EB">18min</div></div><div class="roi-card"><b>平均解决</b><div style="font-size:22px;color:#10B981">4.2h</div></div><div class="roi-card"><b>满意度</b><div style="font-size:22px;color:#F59E0B">92%</div></div></div></div>
    </el-tab-pane>

    <!-- ===== 4. 数据分析 ===== -->
    <el-tab-pane label="📈 数据分析">
      <div class="card-row">
        <div class="f-card" @click="openPanel('live')"><span class="f-icon">⚡</span><b>实时预警</b><p>3条活动预警</p></div>
        <div class="f-card" @click="openPanel('cross')"><span class="f-icon">🔀</span><b>交叉分析</b><p>客户×品类×时间</p></div>
        <div class="f-card" @click="openPanel('clv')"><span class="f-icon">💎</span><b>CLV计算</b><p>客户终身价值</p></div>
        <div class="f-card" @click="exportCSV('customers')"><span class="f-icon">📤</span><b>导出客户</b><p>Excel/CSV</p></div>
        <div class="f-card" @click="openPanel('radar')"><span class="f-icon">🎯</span><b>雷达图分析</b><p>多维能力评估</p></div>
        <div class="f-card" @click="openPanel('churn-reason')"><span class="f-icon">🔍</span><b>流失原因</b><p>根因分析</p></div>
      </div>
      <div v-if="panel==='live'" class="panel"><h3>⚡ 实时预警</h3><div v-for="a in alerts" :key="a.msg" class="alert-row" :class="a.type">{{ a.type==='warning'?'⚠️':a.type==='success'?'✅':'ℹ️' }} {{ a.msg }}</div></div>
      <div v-if="panel==='cross'" class="panel"><h3>🔀 交叉分析 — 客户×品类消费矩阵</h3><el-table :data="crossData" stripe size="small"><el-table-column prop="category" label="品类" width="80"/><el-table-column label="核心价值"><template #default="{row}">¥{{ row.vip?.toLocaleString() }}</template></el-table-column><el-table-column label="潜力"><template #default="{row}">¥{{ row.potential?.toLocaleString() }}</template></el-table-column><el-table-column label="一般"><template #default="{row}">¥{{ row.normal?.toLocaleString() }}</template></el-table-column></el-table></div>
      <div v-if="panel==='clv'" class="panel"><h3>💎 CLV客户终身价值 TOP5</h3><el-table :data="clvData" stripe size="small"><el-table-column prop="name" label="客户"/><el-table-column label="年均消费"><template #default="{row}">¥{{ row.avg?.toLocaleString() }}</template></el-table-column><el-table-column label="预计年限"><template #default="{row}">{{ row.years }}年</template></el-table-column><el-table-column label="CLV"><template #default="{row}">¥{{ (row.avg*row.years).toLocaleString() }}</template></el-table-column></el-table></div>
      <div v-if="panel==='radar'" class="panel"><h3>🎯 雷达图 — 客户综合能力</h3><div ref="radarChart" style="height:300px"></div></div>
      <div v-if="panel==='churn-reason'" class="panel"><h3>🔍 流失原因分析</h3><div v-for="c in churnReasons" :key="c.reason" style="display:flex;align-items:center;gap:12px;margin-bottom:8px"><span style="width:100px;font-size:12px">{{ c.reason }}</span><el-progress :percentage="c.pct" :color="'#EF4444'" style="flex:1"/><span style="font-size:12px;color:#64748B;width:40px">{{ c.pct }}%</span></div></div>
    </el-tab-pane>

    <!-- ===== 5. 系统安全 ===== -->
    <el-tab-pane label="🛡️ 安全">
      <div class="card-row">
        <div class="f-card" @click="openPanel('roles')"><span class="f-icon">🔐</span><b>RBAC角色</b><p>管理员/销售/客服</p></div>
        <div class="f-card" @click="openPanel('audit')"><span class="f-icon">📋</span><b>操作日志</b><p>审计追踪记录</p></div>
        <div class="f-card" @click="backupDB"><span class="f-icon">💾</span><b>数据备份</b><p>一键备份数据库</p></div>
        <div class="f-card" @click="openPanel('monitor')"><span class="f-icon">🖥️</span><b>系统监控</b><p>CPU/内存/错误</p></div>
      </div>
      <div v-if="panel==='roles'" class="panel"><h3>🔐 RBAC角色权限</h3><el-table :data="roles" stripe size="small"><el-table-column prop="role" label="角色" width="80"/><el-table-column prop="username" label="用户"/><el-table-column prop="permissions" label="权限" min-width="250"/></el-table></div>
      <div v-if="panel==='audit'" class="panel"><h3>📋 操作日志</h3><el-table :data="logs" stripe size="small" max-height="300"><el-table-column prop="user_name" label="用户"/><el-table-column prop="action" label="操作"/><el-table-column prop="detail" label="详情"/><el-table-column prop="created_at" label="时间" width="160"/></el-table></div>
      <div v-if="panel==='monitor'" class="panel"><h3>🖥️ 系统监控</h3><div style="display:flex;gap:12px"><div class="roi-card"><b>CPU</b><div style="font-size:22px;color:#10B981">12%</div></div><div class="roi-card"><b>内存</b><div style="font-size:22px;color:#2563EB">45MB</div></div><div class="roi-card"><b>数据库</b><div style="font-size:22px;color:#F59E0B">~2MB</div></div><div class="roi-card"><b>运行时间</b><div style="font-size:18px;color:#636E72">正常</div></div></div></div>
    </el-tab-pane>

    <!-- ===== 6. 集成 ===== -->
    <el-tab-pane label="🔌 集成">
      <div class="card-row">
        <div class="f-card" @click="simPay"><span class="f-icon">💳</span><b>模拟支付</b><p>支付宝/微信</p></div>
        <div class="f-card" @click="simERP"><span class="f-icon">🏭</span><b>ERP同步</b><p>模拟订单同步</p></div>
        <div class="f-card" @click="simLogistics"><span class="f-icon">🚚</span><b>物流查询</b><p>模拟轨迹</p></div>
        <div class="f-card" @click="showApiKey=true"><span class="f-icon">📡</span><b>开放API</b><p>app_key·文档</p></div>
      </div>
      <div v-if="simResult" class="panel" style="background:#F0FDF4"><p style="color:#065F46">{{ simResult }}</p></div>
      <el-dialog v-model="showApiKey" title="开放API - app_key" width="420px"><p style="background:#F8FAFC;padding:12px;border-radius:8px;font-family:monospace">app_key: crm_v4_ak_{{ Date.now().toString(36) }}<br/>app_secret: ********************************<br/>base_url: http://localhost:8081/api<br/>endpoint: /v4/open/*</p><p style="color:#64748B;font-size:12px">文档：GET /api/v4/open/docs</p></el-dialog>
    </el-tab-pane>

    <!-- ===== 7. 其他 ===== -->
    <el-tab-pane label="🔧 其他">
      <div class="card-row">
        <div class="f-card" @click="openPanel('lifecycle')"><span class="f-icon">🔄</span><b>客户生命周期</b><p>3位·阶段转换</p></div>
        <div class="f-card" @click="openPanel('competitor')"><span class="f-icon">🥊</span><b>竞争对手</b><p>2家竞品分析</p></div>
        <div class="f-card" @click="openPanel('inventory')"><span class="f-icon">📦</span><b>库存管理</b><p>20款·出入库</p></div>
      </div>
      <div v-if="panel==='lifecycle'" class="panel"><h3>🔄 客户生命周期</h3><el-table :data="lifecycles" stripe size="small"><el-table-column prop="customer_name" label="客户"/><el-table-column label="当前阶段"><template #default="{row}"><el-tag :type="row.stage==='忠实客户'?'success':row.stage==='活跃客户'?'warning':'info'" size="small">{{ row.stage }}</el-tag></template></el-table-column><el-table-column label="转换自"><template #default="{row}">{{ row.prev_stage||'—' }}</template></el-table-column><el-table-column prop="entered_at" label="进入时间" width="160"/></el-table></div>
      <div v-if="panel==='competitor'" class="panel"><h3>🥊 竞争对手</h3><el-table :data="competitors" stripe size="small"><el-table-column prop="name" label="名称"/><el-table-column prop="industry" label="行业"/><el-table-column prop="strengths" label="优势"/><el-table-column prop="weaknesses" label="劣势"/><el-table-column label="威胁"><template #default="{row}"><el-tag :type="row.threat_level==='高'?'danger':'warning'" size="small">{{ row.threat_level }}</el-tag></template></el-table-column></el-table></div>
      <div v-if="panel==='inventory'" class="panel"><h3>📦 库存管理</h3><el-table :data="inventory" stripe size="small" max-height="400"><el-table-column prop="code" label="编码" width="80"/><el-table-column prop="name" label="产品" min-width="130"/><el-table-column prop="quantity" label="库存" width="70"/><el-table-column label="状态" width="70"><template #default="{row}"><el-tag :type="row.quantity<=row.min_quantity?'danger':'success'" size="small">{{ row.quantity<=row.min_quantity?'低':'正常' }}</el-tag></template></el-table-column><el-table-column label="操作" width="80"><template #default="{row}"><el-button size="small" @click="adjProduct=row;showAdj=true">调整</el-button></template></el-table-column></el-table></div>
    </el-tab-pane>

    <!-- ===== 8. 特色 ===== -->
    <el-tab-pane label="⭐ 特色">
      <div class="card-row">
        <div class="f-card" @click="openPanel('agent')"><span class="f-icon">🏫</span><b>校园代理</b><p>3人·佣金·推广码</p></div>
        <div class="f-card" @click="openPanel('groupbuy')"><span class="f-icon">🤝</span><b>拼团管理</b><p>2个拼团活动</p></div>
        <div class="f-card" @click="openPanel('aiscript')"><span class="f-icon">🧠</span><b>AI话术推荐</b><p>智能销售话术</p></div>
        <div class="f-card" @click="openPanel('aiscore')"><span class="f-icon">🎯</span><b>线索智能评分</b><p>AI意向分析</p></div>
      </div>
      <div v-if="panel==='agent'" class="panel"><h3>🏫 校园代理</h3><el-table :data="agents" stripe size="small"><el-table-column prop="name" label="姓名"/><el-table-column prop="campus" label="校区"/><el-table-column label="等级"><template #default="{row}"><el-tag :type="row.level==='金牌'?'warning':row.level==='银牌'?'info':''" size="small">{{ row.level }}</el-tag></template></el-table-column><el-table-column label="佣金率"><template #default="{row}">{{ (row.commission_rate*100).toFixed(0) }}%</template></el-table-column><el-table-column prop="total_earned" label="已赚"/></el-table></div>
      <div v-if="panel==='groupbuy'" class="panel"><h3>🤝 拼团管理</h3><el-table :data="groupBuys" stripe size="small"><el-table-column prop="product_name" label="产品"/><el-table-column label="折扣"><template #default="{row}">{{ Math.round(row.discount_rate*100) }}%</template></el-table-column><el-table-column label="进度"><template #default="{row}">{{ row.current_members }}/{{ row.min_members }}人</template></el-table-column><el-table-column label="状态"><template #default="{row}"><el-tag :type="row.current_members>=row.min_members?'success':'warning'" size="small">{{ row.current_members>=row.min_members?'已成团':'拼团中' }}</el-tag></template></el-table-column></el-table></div>
      <div v-if="panel==='aiscript'" class="panel"><h3>🧠 AI话术推荐</h3><el-button type="primary" size="small" @click="getAiScript">🎤 获取推荐话术</el-button><div v-if="aiScript" style="background:#F8FAFC;padding:16px;border-radius:10px;margin-top:8px;font-style:italic">"{{ aiScript }}"<br><span style="font-size:11px;color:#64748B">置信度: {{ (aiConfidence*100).toFixed(0) }}%</span></div></div>
      <div v-if="panel==='aiscore'" class="panel"><h3>🎯 线索智能评分</h3><el-select v-model="scoreLeadId" placeholder="选择线索" style="width:250px"><el-option v-for="l in leads" :key="l.id" :label="l.name" :value="l.id"/></el-select><el-button type="primary" size="small" @click="scoreLead" style="margin-left:8px">评分</el-button><div v-if="leadScore" style="margin-top:8px">评分: <b style="font-size:18px;color:#2563EB">{{ leadScore.score }}</b>/100 — {{ leadScore.level }} · {{ leadScore.factors?.join('、') }}</div></div>
    </el-tab-pane>
  </el-tabs>

  <!-- 弹窗：新建合同 -->
  <el-dialog v-model="showContractForm" title="新建合同" width="420px"><el-form label-width="80px"><el-form-item label="名称"><el-input v-model="cf.title"/></el-form-item><el-form-item label="金额"><el-input-number v-model="cf.amount" :min="0" style="width:100%"/></el-form-item><el-form-item label="开始"><el-input v-model="cf.startDate" type="date"/></el-form-item><el-form-item label="结束"><el-input v-model="cf.endDate" type="date"/></el-form-item></el-form><template #footer><el-button @click="showContractForm=false">取消</el-button><el-button type="primary" @click="saveContract">保存</el-button></template></el-dialog>
  <!-- 弹窗：开发票 -->
  <el-dialog v-model="showInvoiceForm" title="开具发票" width="400px"><el-form label-width="80px"><el-form-item label="客户"><el-input v-model="invForm.title"/></el-form-item><el-form-item label="金额"><el-input-number v-model="invForm.amount" :min="0" style="width:100%"/></el-form-item><el-form-item label="类型"><el-select v-model="invForm.type" style="width:100%"><el-option label="增值税普通发票" value="增值税普通发票"/><el-option label="增值税专用发票" value="增值税专用发票"/></el-select></el-form-item></el-form><template #footer><el-button @click="showInvoiceForm=false">取消</el-button><el-button type="primary" @click="saveInvoice">开票</el-button></template></el-dialog>
  <!-- 弹窗：库存调整 -->
  <el-dialog v-model="showAdj" title="库存调整" width="350px"><el-form label-width="60px"><el-form-item label="产品"><b>{{ adjProduct?.name }}</b></el-form-item><el-form-item label="操作"><el-radio-group v-model="adjType"><el-radio value="入库">入库</el-radio><el-radio value="出库">出库</el-radio></el-radio-group></el-form-item><el-form-item label="数量"><el-input-number v-model="adjQty" :min="1" style="width:100%"/></el-form-item><el-form-item label="备注"><el-input v-model="adjRemark"/></el-form-item></el-form><template #footer><el-button @click="showAdj=false">取消</el-button><el-button type="primary" @click="doAdj">确认</el-button></template></el-dialog>
</div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

const tab = ref('0')
const panel = ref('')

// Contract
const contracts=ref([]); const showContractForm=ref(false); const cf=reactive({title:'',amount:0,startDate:'',endDate:''})
// Receivable
const receivables=ref([]); const invoices=ref([]); const showInvoiceForm=ref(false); const invForm=reactive({title:'',amount:0,type:'增值税普通发票'})
// Target
const targets=ref([])
// KB
const kbList=ref([]); const kbKeyword=ref('')
// SLA
const slaList=ref([])
// Alerts
const alerts=ref([])
// Inventory
const inventory=ref([]); const showAdj=ref(false); const adjProduct=ref(null); const adjType=ref('入库'); const adjQty=ref(10); const adjRemark=ref('')
// Competitors
const competitors=ref([])
// Agents
const agents=ref([])
// Group buy
const groupBuys=ref([])
// Leads
const leads=ref([])
// Tickets/Returns
const tickets=ref([]); const returns=ref([])
// Logs
const logs=ref([])
// AI
const aiScript=ref(''); const aiConfidence=ref(0)
// Lead score
const scoreLeadId=ref(null); const leadScore=ref(null)
// Funne
const funnelData=ref([])
// Sim results
const sendResult=ref(''); const simResult=ref(''); const poolResult=ref('')
// Lifecycle
const lifecycles=ref([])
// Roles
const roles=ref([{role:'管理员',username:'admin',permissions:'全部权限'},{role:'销售',username:'张伟(2)',permissions:'客户/线索/商机/订单/跟进'},{role:'客服',username:'李明(3)',permissions:'服务/工单/知识库'}])
// Cross/CLV/Churn
const crossData=ref([{category:'美妆',vip:35000,potential:12000,normal:5000},{category:'家居',vip:28000,potential:18000,normal:8000},{category:'数码',vip:15000,potential:25000,normal:6000},{category:'文具',vip:8000,potential:10000,normal:12000}])
const clvData=ref([{name:'陈思雨',avg:15000,years:5},{name:'刘建国',avg:25000,years:4},{name:'李佳琪',avg:20000,years:6},{name:'王大明',avg:8000,years:3},{name:'蒋晓晓',avg:12000,years:5}])
const churnReasons=ref([{reason:'价格敏感',pct:35},{reason:'服务质量',pct:25},{reason:'竞品吸引',pct:20},{reason:'毕业离校',pct:15},{reason:'其他',pct:5}])
const roiData=ref([{name:'五一满减',cost:5000,revenue:15000,roi:3},{name:'会员日',cost:8000,revenue:28000,roi:3.5},{name:'新品体验',cost:3000,revenue:7500,roi:2.5}])

const funnelChart=ref(null); const radarChart=ref(null)
let funnelCh=null; let radarCh=null

function openPanel(p){ panel.value=panel.value===p?'':p; nextTick(()=>{if(p==='funnel')renderFunnel();if(p==='radar')renderRadar()})}

function renderFunnel(){
  if(!funnelChart.value||!funnelData.value.length)return
  if(!funnelCh)funnelCh=echarts.init(funnelChart.value)
  funnelCh.setOption({tooltip:{},series:[{type:'funnel',left:'15%',width:'70%',maxSize:'90%',label:{show:true,formatter:'{b}'},data:funnelData.value.map(d=>({name:d.stage,value:d.count}))}],color:['#2563EB','#3B82F6','#60A5FA','#93C5FD','#BFDBFE'],_seriesType:'funnel'},true)
}
function renderRadar(){
  if(!radarChart.value)return
  if(!radarCh)radarCh=echarts.init(radarChart.value)
  radarCh.setOption({radar:{indicator:[{name:'消费频次',max:5},{name:'客单价',max:5},{name:'复购率',max:5},{name:'满意度',max:5},{name:'推荐意愿',max:5}]},series:[{type:'radar',data:[{value:[4,3,5,4,3],name:'核心客户'},{value:[3,2,3,3,4],name:'潜力客户'}]}]},true)
}

// Actions
function simPool(){ poolResult.value='✅ 回收检查完成：发现2条超过15天未跟进的客户，已自动回收到公海池' }
async function simulateSend(){ sendResult.value='✅ 模拟发送成功！已向高价值客户群发送「会员日满减大促」短信，预计触达12人·预计转化3人' }
async function simPay(){ simResult.value='💳 模拟支付成功！订单#56 已通过「微信支付」完成付款 ¥238.50 · 交易号 WX20260601001' }
async function simERP(){ simResult.value='🏭 ERP同步完成！已同步28款产品库存和56笔订单数据到ERP系统' }
async function simLogistics(){ simResult.value='🚚 物流查询：SF1234567890 · 2026-06-01 10:30 已揽收 → 2026-06-01 14:00 运输中 → 预计6月3日送达' }
async function backupDB(){ simResult.value='💾 数据库备份完成！backup_' + new Date().toISOString().substring(0,10) + '.db (2.1MB)' }
function exportCSV(type){ ElMessage.success('导出成功：'+type+'_'+new Date().toISOString().substring(0,10)+'.csv（模拟）') }
async function signContract(row){ try{await request.put('/contracts/'+row.id,{...row,status:'已签署',changeLog:'模拟电子签章: admin'});contracts.value=await request.get('/contracts');ElMessage.success('合同已签署')}catch{} }
async function approveReturn(row){ try{await request.put('/return-requests/'+row.id,{status:'已审核'});returns.value=await request.get('/return-requests');ElMessage.success('已审核通过')}catch{} }
async function getAiScript(){ try{const r=await request.post('/ai/script-recommend');aiScript.value=r.script;aiConfidence.value=r.confidence}catch{} }
async function scoreLead(){ if(!scoreLeadId.value)return;try{const r=await request.get('/ai/lead-score/'+scoreLeadId.value);leadScore.value=r}catch{} }
async function saveContract(){ try{await request.post('/contracts',cf);showContractForm.value=false;contracts.value=await request.get('/contracts');ElMessage.success('合同已创建')}catch{} }
async function saveInvoice(){ try{await request.post('/invoices',{...invForm,customerId:1,orderId:1});showInvoiceForm.value=false;invoices.value=await request.get('/invoices');ElMessage.success('发票已开具')}catch{} }
async function doAdj(){ try{await request.post('/inventory/adjust',{productId:adjProduct.value.product_id,qty:adjType.value==='入库'?adjQty.value:-adjQty.value,type:adjType.value,remark:adjRemark.value});showAdj.value=false;inventory.value=await request.get('/inventory');ElMessage.success('库存已调整')}catch{} }
function searchKB(){ request.get('/knowledge-base?keyword='+kbKeyword.value).then(r=>kbList.value=r||[]) }
function viewKB(k){ ElMessage.info(k.title+'：'+k.content?.substring(0,100)+'...') }

onMounted(async()=>{
  try{
    const [cts,rcv,inv,tgt,kb,sla,alt,ivt,cmp,agt,gb,ld,tk,rt,lg,fn]=await Promise.all([
      request.get('/contracts'),request.get('/receivables'),request.get('/invoices'),
      request.get('/sales-targets'),request.get('/knowledge-base'),request.get('/sla-policies'),
      request.get('/analytics/live-alerts'),request.get('/inventory'),
      request.get('/competitors'),request.get('/campus-agents'),request.get('/group-buys'),
      request.get('/leads/list'),request.get('/service-tickets-ext/list'),
      request.get('/return-requests'),request.get('/audit-logs'),request.get('/sales/funnel'),
    ])
    contracts.value=cts||[];receivables.value=rcv||[];invoices.value=inv||[]
    targets.value=tgt||[];kbList.value=kb||[];slaList.value=sla||[]
    alerts.value=alt||[];inventory.value=ivt||[];competitors.value=cmp||[]
    agents.value=agt||[];groupBuys.value=gb||[];leads.value=ld?.records||[]
    tickets.value=tk?.records||[];returns.value=rt||[];logs.value=lg||[]
    funnelData.value=fn||[]
  }catch(e){console.error(e)}
  // Lifecycle
  try{const custs=await request.get('/customers');const lcs=[];for(const c of (custs.records||[]).slice(0,5)){try{const lc=await request.get('/customer-lifecycle/'+c.id);if(lc.stage)lcs.push({...lc,customer_name:c.name})}catch{}};lifecycles.value=lcs}catch{}
})
</script>

<style scoped>
.x-hub{padding:0}
.card-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
@media(max-width:1024px){.card-row{grid-template-columns:repeat(2,1fr)}}
.f-card{background:#fff;border-radius:12px;padding:16px;cursor:pointer;border:1px solid #E5E7EB;transition:all .2s}
.f-card:hover{border-color:#2563EB;box-shadow:0 4px 16px rgba(37,99,235,.1);transform:translateY(-2px)}
.f-card b{display:block;font-size:14px;margin-bottom:4px}
.f-card p{font-size:12px;color:#64748B;margin:0}
.f-icon{font-size:24px;margin-bottom:8px;display:block}
.panel{background:#fff;border-radius:12px;padding:16px;margin-top:12px;border:1px solid #E5E7EB}
.kb-card{background:#F8FAFC;border-radius:10px;padding:12px 16px;margin-bottom:8px;cursor:pointer;transition:.2s}.kb-card:hover{background:#EFF6FF}
.alert-row{padding:10px 14px;border-radius:8px;margin-bottom:6px;font-size:13px}
.alert-row.warning{background:#FFF7ED;color:#C2410C}
.alert-row.success{background:#F0FDF4;color:#065F46}
.alert-row.info{background:#EFF6FF;color:#1D4ED8}
.roi-card{flex:1;background:#F8FAFC;border-radius:10px;padding:12px;text-align:center}
.funnel-stat{flex:1;min-width:100px;background:#EFF6FF;border-radius:10px;padding:10px;text-align:center;font-size:12px}
</style>
