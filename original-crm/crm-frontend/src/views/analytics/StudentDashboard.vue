<template>
  <div class="crm-page-wrap">
    <div class="crm-page-hd"><div><div class="crm-page-tit">🎓 大学生消费行为分析</div><div class="crm-page-sub">学生画像 · RFM分层 · 校区分析</div></div></div>

    <div class="stats-row">
      <div v-for="s in stats" :key="s.label" class="stat-card" :style="{borderLeftColor:s.color}">
        <div class="stat-left"><div class="stat-label">{{ s.label }}</div><div class="stat-value">{{ s.value }}</div></div>
        <div class="stat-icon-box" :style="{background:s.color+'15',color:s.color}"><span style="font-size:24px">{{ s.icon }}</span></div>
      </div>
    </div>

    <div class="dash-grid">
      <!-- RFM分层 -->
      <div class="card"><div class="card-hd"><span class="card-tit">📊 RFM客户分层</span><el-button size="small" text type="primary" @click="recalcRFM">重新计算</el-button></div>
        <div class="rfm-list"><div v-for="row in rfmList" :key="row.customer_id" class="rfm-item"><span class="rfm-name">{{ row.customer_name }}</span>
          <div class="rfm-scores"><span class="rfm-s" :class="scoreColor(row.r_score)">R{{ row.r_score }}</span><span class="rfm-s" :class="scoreColor(row.f_score)">F{{ row.f_score }}</span><span class="rfm-s" :class="scoreColor(row.m_score)">M{{ row.m_score }}</span></div>
          <el-tag :type="row.tier==='核心价值客户'?'warning':row.tier==='潜力客户'?'success':row.tier==='流失风险客户'?'danger':'info'" size="small">{{ row.tier }}</el-tag>
        </div></div>
      </div>

      <!-- 学生画像 -->
      <div class="card"><div class="card-hd"><span class="card-tit">👤 学生画像</span></div>
        <el-table :data="studentList" size="small">
          <el-table-column prop="name" label="姓名" width="80" />
          <el-table-column prop="grade" label="年级" width="70" />
          <el-table-column prop="major_category" label="专业" width="80" />
          <el-table-column prop="living_expense_range" label="生活费" width="100" />
          <el-table-column prop="campus" label="校区" width="80" />
          <el-table-column prop="dormitory" label="宿舍" width="100" />
        </el-table>
      </div>

      <!-- 校园活动 -->
      <div class="card"><div class="card-hd"><span class="card-tit">🏫 校园活动</span><el-button size="small" text type="primary" @click="campusDialog=true">新建</el-button></div>
        <div v-for="c in campusList" :key="c.id" class="campus-item">
          <div style="font-weight:600;font-size:14px">{{ c.name }}</div>
          <div style="font-size:12px;color:#94A3B8">{{ c.campus }} · {{ c.type }} · {{ c.start_date }} - {{ c.end_date }}</div>
          <el-tag :type="c.status==='进行中'?'success':'info'" size="small">{{ c.status }}</el-tag>
        </div>
      </div>

      <!-- 营销模板 -->
      <div class="card"><div class="card-hd"><span class="card-tit">📋 营销模板</span></div>
        <el-table :data="templateList" size="small">
          <el-table-column prop="name" label="名称" /><el-table-column prop="type" label="类型" width="70" />
          <el-table-column prop="discount_rule" label="规则" /><el-table-column label="学生专属" width="80"><template #default="{row}"><el-tag v-if="row.student_only" type="warning" size="small">是</el-tag><span v-else style="color:#94A3B8">否</span></template></el-table-column>
        </el-table>
      </div>

      <!-- 自动化工作流 -->
      <div class="card"><div class="card-hd"><span class="card-tit">⚡ 自动化工作流</span></div>
        <div v-for="w in workflowList" :key="w.id" class="wf-item">
          <div class="wf-icon">{{ w.trigger_type==='注册'?'🎉':w.trigger_type==='沉默'?'💤':'🎂' }}</div>
          <div><div style="font-weight:600;font-size:13px">{{ w.name }}</div><div style="font-size:11px;color:#94A3B8">{{ w.trigger_condition }}</div></div>
        </div>
      </div>

      <!-- 校区集群 -->
      <div class="card"><div class="card-hd"><span class="card-tit">📍 校区商圈</span></div>
        <el-table :data="clusterList" size="small">
          <el-table-column prop="name" label="名称" /><el-table-column prop="student_count" label="学生数" width="80" /><el-table-column prop="avg_spending" label="人均消费" width="80" /><el-table-column prop="top_category" label="热门品类" width="80" />
        </el-table>
      </div>
    </div>

    <!-- 新建校园活动弹窗 -->
    <el-dialog v-model="campusDialog" title="新建校园活动" width="420px"><el-form label-width="80px"><el-form-item label="名称"><el-input v-model="campusForm.name" /></el-form-item><el-form-item label="校区"><el-input v-model="campusForm.campus" /></el-form-item><el-form-item label="类型"><el-select v-model="campusForm.type" style="width:100%"><el-option v-for="t in ['校园推广','社团合作','校园大使','开学季','毕业季']" :key="t" :label="t" :value="t" /></el-select></el-form-item><el-form-item label="开始日期"><el-input v-model="campusForm.startDate" type="date" /></el-form-item><el-form-item label="结束日期"><el-input v-model="campusForm.endDate" type="date" /></el-form-item><el-form-item label="预算"><el-input-number v-model="campusForm.budget" :min="0" style="width:100%" /></el-form-item></el-form>
      <template #footer><el-button @click="campusDialog=false">取消</el-button><el-button type="primary" @click="createCampus">创建</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'

const stats = reactive([{label:'学生客户',value:'0',color:'#2563EB',icon:'🎓'},{label:'已认证',value:'0',color:'#10B981',icon:'✅'},{label:'RFM分层',value:'0',color:'#F59E0B',icon:'📊'},{label:'标签总数',value:'0',color:'#8B5CF6',icon:'🏷'}])
const rfmList = ref([])
const studentList = ref([])
const campusList = ref([])
const templateList = ref([])
const workflowList = ref([])
const clusterList = ref([])
const campusDialog = ref(false)
const campusForm = reactive({name:'',campus:'',type:'校园推广',startDate:'',endDate:'',budget:0})

// Demo data
const SD = { totalStudents:2850, verifiedStudents:1280, tierDistLen:4, totalTags:35 }
stats[0].value = SD.totalStudents; stats[1].value = SD.verifiedStudents; stats[2].value = SD.tierDistLen; stats[3].value = SD.totalTags

const SR = [
  { customer_id:1, customer_name:'陈思雨', r_score:5, f_score:4, m_score:5, tier:'核心价值客户' },
  { customer_id:3, customer_name:'李佳琪', r_score:4, f_score:3, m_score:4, tier:'潜力客户' },
  { customer_id:2, customer_name:'刘建国', r_score:3, f_score:2, m_score:4, tier:'潜力客户' },
  { customer_id:5, customer_name:'王大明', r_score:4, f_score:5, m_score:4, tier:'核心价值客户' },
  { customer_id:4, customer_name:'张晓萌', r_score:2, f_score:1, m_score:2, tier:'流失风险客户' },
  { customer_id:14, customer_name:'测试用户2', r_score:3, f_score:3, m_score:3, tier:'潜力客户' },
]
rfmList.value = SR

const SL = [
  { id:1, name:'陈思雨', grade:'大二', major_category:'文科', living_expense_range:'1500-2000', campus:'北京大学', dormitory:'燕园35楼' },
  { id:2, name:'张晓萌', grade:'大一', major_category:'工科', living_expense_range:'1000-1500', campus:'清华大学', dormitory:'紫荆公寓' },
  { id:3, name:'测试用户2', grade:'大三', major_category:'理科', living_expense_range:'2000+', campus:'复旦大学', dormitory:'南区28号' },
  { id:4, name:'林小慧', grade:'大二', major_category:'文科', living_expense_range:'1500-2000', campus:'中山大学', dormitory:'至善园' },
  { id:5, name:'黄子轩', grade:'大一', major_category:'工科', living_expense_range:'1000-1500', campus:'武汉大学', dormitory:'桂园' },
]
studentList.value = SL

const CL = [
  { id:1, name:'北京海淀区高校群', description:'覆盖北大、清华等8所高校', student_count:2850, avg_spending:168.5, top_category:'美妆' },
  { id:2, name:'上海闵行高校群', description:'覆盖交大、复旦等6所高校', student_count:1980, avg_spending:142.3, top_category:'服饰' },
  { id:3, name:'广州大学城集群', description:'覆盖中大、华师等10所高校', student_count:3200, avg_spending:156.8, top_category:'美妆' },
]
clusterList.value = CL

const TL = [
  { id:1, name:'开学季促销模板', type:'促销', conditions:'新生', student_only:1 },
  { id:2, name:'会员日回馈模板', type:'会员', conditions:'全员', student_only:0 },
  { id:3, name:'社团合作方案', type:'合作', conditions:'社团成员', student_only:1 },
]
templateList.value = TL

const WL = [
  { id:1, name:'新学生自动标签', trigger_type:'客户创建', status:1 },
  { id:2, name:'沉睡客户激活', trigger_type:'定时任务', status:1 },
  { id:3, name:'学生认证奖励', trigger_type:'认证完成', status:1 },
]
workflowList.value = WL

onMounted(async () => {
  try { const d = await request.get('/analytics/student-dashboard'); stats[0].value = d.totalStudents||SD.totalStudents; stats[1].value = d.verifiedStudents||SD.verifiedStudents; stats[2].value = d.tierDistribution?.length||SD.tierDistLen; stats[3].value = d.totalTags||SD.totalTags } catch {}
  try { const r = await request.get('/rfm-scores'); if (r && r.length) rfmList.value = r } catch {}
  try {
    const custs = (await request.get('/customers?size=10'))?.records||[]
    if (custs.length) { studentList.value = custs.map(c => ({...c, grade:'未知',major_category:'未知',living_expense_range:'未知',campus:'未知'})) }
  } catch {}
  try { const r = await request.get('/campus-campaigns'); if (r && r.length) campusList.value = r } catch {}
  try { const r = await request.get('/marketing-templates'); if (r && r.length) templateList.value = r } catch {}
  try { const r = await request.get('/auto-workflows'); if (r && r.length) workflowList.value = r } catch {}
  try { const r = await request.get('/campus-clusters'); if (r && r.length) clusterList.value = r } catch {}
})

function scoreColor(s) { return s>=5?'s5':s>=3?'s3':'s1' }
async function recalcRFM() { try { await request.post('/rfm-scores/recalculate'); rfmList.value = (await request.get('/rfm-scores')) || [] } catch {} }
async function createCampus() { try { await request.post('/campus-campaigns', campusForm); campusDialog.value = false; campusList.value = await request.get('/campus-campaigns') || [] } catch {} }
</script>

<style scoped>
.crm-page-wrap{max-width:100%;overflow:hidden}
.stats-row,.dash-grid{display:grid;gap:16px;margin-bottom:20px}.stats-row{grid-template-columns:repeat(4,1fr)}
.stat-card{display:flex;justify-content:space-between;align-items:center;background:#fff;border-radius:12px;padding:20px;border-left:3px solid;box-shadow:0 1px 3px rgba(0,0,0,.06)}.stat-label{font-size:12px;color:#94A3B8}.stat-value{font-size:28px;font-weight:700;color:#0F172A;font-family:Inter,monospace}.stat-icon-box{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.dash-grid{grid-template-columns:repeat(2,1fr)}.card{background:#fff;border-radius:14px;padding:20px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden}.card-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.card-tit{font-size:15px;font-weight:600;color:#0F172A}
.rfm-list{display:flex;flex-direction:column;gap:10px}.rfm-item{display:flex;align-items:center;gap:12px;font-size:13px}.rfm-name{font-weight:600;color:#1E293B;min-width:80px}.rfm-scores{display:flex;gap:6px}.rfm-s{width:32px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}.s5{background:#D1FAE5;color:#059669}.s3{background:#FEF3C7;color:#D97706}.s1{background:#FEE2E2;color:#DC2626}
.el-table{overflow-x:auto}
@media(max-width:1000px){.stats-row{grid-template-columns:repeat(2,1fr)}.dash-grid{grid-template-columns:1fr}}
.campus-item,.wf-item{padding:12px;border-radius:10px;background:#F8FAFC;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}.wf-item{display:flex;gap:12px;justify-content:flex-start}.wf-icon{font-size:24px}
@media(max-width:1000px){.stats-row{grid-template-columns:repeat(2,1fr)}.dash-grid{grid-template-columns:1fr}}
</style>
