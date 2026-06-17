<template>
<div class="crm-page-wrap">
  <div class="crm-page-hd"><div><div class="crm-page-tit">大学生消费行为分析</div><div class="crm-page-sub">学生画像 · RFM分层 · 校区分析</div></div></div>
  <div class="stats-row">
    <div v-for="s in stats" :key="s.label" class="stat-card" :style="{borderLeftColor:s.color}">
      <div class="stat-left"><div class="stat-label">{{ s.label }}</div><div class="stat-value">{{ s.value }}</div></div>
      <div class="stat-icon-box" :style="{background:s.color+'15',color:s.color}"><span style="font-size:24px">{{ s.icon }}</span></div>
    </div>
  </div>
  <div class="dash-grid">
    <div class="card"><div class="card-hd"><span class="card-tit">RFM客户分层</span></div>
      <div class="rfm-list"><div v-for="row in rfmList" :key="row.customer_id" class="rfm-item">
        <span class="rfm-name">{{ row.customer_name }}</span>
        <div class="rfm-scores"><span class="rfm-s" :class="sc(row.r_score)">R{{row.r_score}}</span><span class="rfm-s" :class="sc(row.f_score)">F{{row.f_score}}</span><span class="rfm-s" :class="sc(row.m_score)">M{{row.m_score}}</span></div>
        <el-tag :type="row.tier==='核心价值客户'?'warning':row.tier==='潜力客户'?'success':row.tier==='流失风险客户'?'danger':'info'" size="small">{{ row.tier }}</el-tag>
      </div></div>
    </div>
    <div class="card"><div class="card-hd"><span class="card-tit">学生画像</span></div>
      <el-table :data="studentList" size="small">
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="grade" label="年级" width="70" />
        <el-table-column prop="major_category" label="专业" width="80" />
        <el-table-column prop="campus" label="校区" width="100" />
        <el-table-column prop="living_expense_range" label="生活费" width="100" />
      </el-table>
    </div>
    <div class="card"><div class="card-hd"><span class="card-tit">校园活动</span><span class="card-add" @click="campusDialog=true">+ 新建</span></div>
      <el-table :data="campusList" size="small">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="campus" label="校区" width="80" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="budget" label="预算" width="80" />
      </el-table>
    </div>
    <div class="card"><div class="card-hd"><span class="card-tit">营销模板</span></div>
      <el-table :data="templateList" size="small">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="conditions" label="条件" width="100" />
      </el-table>
    </div>
    <div class="card"><div class="card-hd"><span class="card-tit">自动化工作流</span></div>
      <el-table :data="workflowList" size="small">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="trigger_type" label="触发类型" width="100" />
        <el-table-column prop="status" label="状态" width="80" />
      </el-table>
    </div>
    <div class="card"><div class="card-hd"><span class="card-tit">校园集群</span></div>
      <el-table :data="clusterList" size="small">
        <el-table-column prop="name" label="名称" /><el-table-column prop="student_count" label="学生数" width="80" /><el-table-column prop="avg_spending" label="人均消费" width="80" /><el-table-column prop="top_category" label="热门品类" width="80" />
      </el-table>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'

const stats = reactive([
  {label:'学生客户',value:'2850',color:'#2563EB',icon:'🎓'},
  {label:'已认证',value:'1280',color:'#10B981',icon:'✅'},
  {label:'RFM分层',value:'4',color:'#F59E0B',icon:'📊'},
  {label:'标签总数',value:'35',color:'#8B5CF6',icon:'🏷'},
])
const rfmList = ref([])
const studentList = ref([])
const campusList = ref([])
const templateList = ref([])
const workflowList = ref([])
const clusterList = ref([])
const campusDialog = ref(false)
const campusForm = reactive({name:'',campus:'',type:'校园推广',startDate:'',endDate:'',budget:0})
function sc(s) { return s>=5?'s5':s>=3?'s3':'s1' }

const D_all = {
  rfm: [
    {customer_id:1,customer_name:'陈思雨',r_score:5,f_score:4,m_score:5,tier:'核心价值客户'},
    {customer_id:3,customer_name:'李佳琪',r_score:4,f_score:3,m_score:4,tier:'潜力客户'},
    {customer_id:2,customer_name:'刘建国',r_score:3,f_score:2,m_score:4,tier:'潜力客户'},
    {customer_id:5,customer_name:'王大明',r_score:4,f_score:5,m_score:4,tier:'核心价值客户'},
    {customer_id:4,customer_name:'张晓萌',r_score:2,f_score:1,m_score:2,tier:'流失风险客户'},
    {customer_id:14,customer_name:'测试用户2',r_score:3,f_score:3,m_score:3,tier:'潜力客户'},
  ],
  students: [
    {name:'陈思雨',grade:'大二',major_category:'文科',living_expense_range:'1500-2000',campus:'北京大学'},
    {name:'张晓萌',grade:'大一',major_category:'工科',living_expense_range:'1000-1500',campus:'清华大学'},
    {name:'测试用户2',grade:'大三',major_category:'理科',living_expense_range:'2000+',campus:'复旦大学'},
    {name:'林小慧',grade:'大二',major_category:'文科',living_expense_range:'1500-2000',campus:'中山大学'},
    {name:'黄子轩',grade:'大一',major_category:'工科',living_expense_range:'1000-1500',campus:'武汉大学'},
  ],
  campus: [
    {name:'北京海淀高校群',campus:'北京',type:'开学季',budget:15000},
    {name:'上海闵行推广',campus:'上海',type:'社团合作',budget:12000},
    {name:'广州大学城活动',campus:'广州',type:'校园大使',budget:10000},
  ],
  templates: [
    {name:'开学季促销',type:'促销',conditions:'新生'},
    {name:'会员日回馈',type:'会员',conditions:'全员'},
    {name:'社团合作方案',type:'合作',conditions:'社团成员'},
  ],
  workflows: [
    {name:'新学生自动标签',trigger_type:'客户创建',status:1},
    {name:'沉睡客户激活',trigger_type:'定时任务',status:1},
    {name:'学生认证奖励',trigger_type:'认证完成',status:1},
  ],
  clusters: [
    {name:'北京海淀区高校群',student_count:2850,avg_spending:168.5,top_category:'美妆'},
    {name:'上海闵行高校群',student_count:1980,avg_spending:142.3,top_category:'服饰'},
    {name:'广州大学城集群',student_count:3200,avg_spending:156.8,top_category:'美妆'},
  ],
}

// Init with demo data immediately
rfmList.value = D_all.rfm
studentList.value = D_all.students
campusList.value = D_all.campus
templateList.value = D_all.templates
workflowList.value = D_all.workflows
clusterList.value = D_all.clusters

onMounted(async () => {
  // Try API, upgrade if available
  try { const d = await request.get('/analytics/student-dashboard')
    if (d) { stats[0].value = d.totalStudents||stats[0].value; stats[1].value = d.verifiedStudents||stats[1].value; stats[2].value = (d.tierDistribution?.length)||stats[2].value; stats[3].value = d.totalTags||stats[3].value } } catch {}
  try { const r = await request.get('/rfm-scores'); if (r&&r.length) rfmList.value = r } catch {}
  try {
    const c = (await request.get('/customers?size=10'))?.records||[]
    if (c.length) studentList.value = c.map(x=>({...x,grade:'未知',major_category:'未知',campus:'未知',living_expense_range:'未知'}))
  } catch {}
  try { const r = await request.get('/campus-campaigns'); if (r&&r.length) campusList.value = r } catch {}
  try { const r = await request.get('/marketing-templates'); if (r&&r.length) templateList.value = r } catch {}
  try { const r = await request.get('/auto-workflows'); if (r&&r.length) workflowList.value = r } catch {}
  try { const r = await request.get('/campus-clusters'); if (r&&r.length) clusterList.value = r } catch {}
})
</script>

<style scoped>
.crm-page-wrap{max-width:100%;overflow:hidden}
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}
.stat-card{background:#fff;border-radius:12px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06);display:flex;align-items:center;justify-content:space-between;border-left:4px solid}
.stat-value{font-size:28px;font-weight:800;color:#1E293B;line-height:1.2}
.stat-label{font-size:13px;color:#64748B}
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:14px;font-weight:600}
.card-add{font-size:12px;color:#3B82F6;cursor:pointer}
.rfm-list{display:flex;flex-direction:column;gap:6px}
.rfm-item{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f1f5f9}
.rfm-name{flex:1;font-weight:500;font-size:13px}
.rfm-scores{display:flex;gap:4px}
.rfm-s{font-size:11px;padding:1px 5px;border-radius:4px;font-weight:600}
.rfm-s.s5{background:#dcfce7;color:#16a34a}.rfm-s.s3{background:#fef3c7;color:#d97706}.rfm-s.s1{background:#fee2e2;color:#dc2626}
@media(max-width:900px){.dash-grid{grid-template-columns:1fr}}
</style>
