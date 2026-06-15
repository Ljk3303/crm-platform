<template>
  <div class="activity-detail">
    <el-page-header @back="$router.back()" :content="activity.name || '活动详情'" />

    <el-tabs v-model="activeTab" class="detail-tabs">
      <!-- Overview Tab -->
      <el-tab-pane label="概览" name="overview">
        <el-card>
          <template #header>基本信息</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="活动名称">{{ activity.name }}</el-descriptions-item>
            <el-descriptions-item label="活动类型">
              <el-tag>{{ typeMap[activity.type] || activity.type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="预算">¥{{ formatNum(activity.budget) }}</el-descriptions-item>
            <el-descriptions-item label="实际花费">¥{{ formatNum(activity.actual_cost) }}</el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ activity.start_date }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ activity.end_date }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTypeMap[activity.status]">{{ statusMap[activity.status] || activity.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="负责人">{{ activity.owner }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ activity.description || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-row :gutter="16" style="margin-top:16px">
          <el-col :span="8">
            <el-card>
              <el-statistic title="关联线索" :value="activity.lead_count || 0" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <el-statistic title="关联商机" :value="activity.opportunity_count || 0" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <el-statistic title="关联交易" :value="activity.deal_count || 0" />
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top:16px">
          <template #header>关联线索</template>
          <el-table :data="leads" v-loading="leadsLoading" stripe>
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="company" label="公司" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" />
          </el-table>
        </el-card>

        <el-card style="margin-top:16px">
          <template #header>关联商机</template>
          <el-table :data="opportunities" v-loading="oppsLoading" stripe>
            <el-table-column prop="name" label="商机名称" />
            <el-table-column prop="customer_name" label="客户" />
            <el-table-column prop="amount" label="预计金额" />
            <el-table-column prop="stage" label="阶段" />
            <el-table-column prop="close_date" label="预计关闭" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- Expenses Tab -->
      <el-tab-pane label="费用" name="expenses">
        <div class="tab-header">
          <span>费用明细</span>
          <el-button type="primary" @click="showExpenseDialog">新增费用</el-button>
        </div>
        <el-table :data="expenses" v-loading="expensesLoading" stripe>
          <el-table-column prop="expense_type" label="费用类型" />
          <el-table-column prop="amount" label="金额" align="right">
            <template #default="{ row }">¥{{ formatNum(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="expense_date" label="日期" />
          <el-table-column prop="description" label="说明" />
          <el-table-column prop="created_by" label="记录人" />
        </el-table>

        <el-dialog v-model="expenseDialogVisible" title="新增费用" width="500px">
          <el-form ref="expenseFormRef" :model="expenseForm" :rules="expenseRules" label-width="100px">
            <el-form-item label="费用类型" prop="expense_type">
              <el-select v-model="expenseForm.expense_type" style="width:100%">
                <el-option label="广告投放" value="advertising" />
                <el-option label="场地租赁" value="venue" />
                <el-option label="物料制作" value="materials" />
                <el-option label="人员费用" value="personnel" />
                <el-option label="交通差旅" value="travel" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="金额" prop="amount">
              <el-input-number v-model="expenseForm.amount" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
            <el-form-item label="日期" prop="expense_date">
              <el-date-picker v-model="expenseForm.expense_date" type="date" style="width:100%" />
            </el-form-item>
            <el-form-item label="说明" prop="description">
              <el-input v-model="expenseForm.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="expenseDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitExpense" :loading="expenseSubmitting">确定</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- Analysis Tab -->
      <el-tab-pane label="效果分析" name="analysis">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="线索数量" :value="analysis.lead_count || 0">
                <template #suffix>个</template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="商机数量" :value="analysis.opportunity_count || 0">
                <template #suffix>个</template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="成交金额" :value="analysis.deal_amount || 0" :precision="2">
                <template #prefix>¥</template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="ROI" :value="analysis.roi || 0" :precision="1">
                <template #suffix>%</template>
              </el-statistic>
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top:16px">
          <template #header>指标详情</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="预算">¥{{ formatNum(analysis.budget || 0) }}</el-descriptions-item>
            <el-descriptions-item label="实际花费">¥{{ formatNum(analysis.actual_cost || 0) }}</el-descriptions-item>
            <el-descriptions-item label="转化率">{{ (analysis.conversion_rate || 0) * 100 }}%</el-descriptions-item>
            <el-descriptions-item label="平均成交额">¥{{ formatNum(analysis.avg_deal_amount || 0) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-tab-pane>

      <!-- AI Copy Tab -->
      <el-tab-pane label="AI 文案" name="ai-copy">
        <el-card>
          <el-form :inline="true" :model="copyForm" class="copy-form">
            <el-form-item label="活动主题">
              <el-input v-model="copyForm.theme" placeholder="请输入活动主题" />
            </el-form-item>
            <el-form-item label="目标类型">
              <el-select v-model="copyForm.target_type" placeholder="请选择">
                <el-option label="朋友圈" value="moments" />
                <el-option label="公众号" value="official_account" />
                <el-option label="邮件" value="email" />
                <el-option label="短信" value="sms" />
                <el-option label="宣传海报" value="poster" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateCopy" :loading="copyGenerating">生成文案</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-row :gutter="16" style="margin-top:16px">
          <el-col :span="8" v-for="(copy, i) in copyResults" :key="i">
            <el-card class="copy-card">
              <template #header>
                <span>方案 {{ i + 1 }} - {{ copy.style || '风格' }}</span>
                <el-button link type="primary" @click="copyText(copy.content)">复制</el-button>
              </template>
              <div class="copy-content">{{ copy.content }}</div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="!copyGenerating && copyResults.length === 0" description="点击生成按钮获取 AI 文案" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api'

const route = useRoute()
const router = useRouter()
const activityId = route.params.id
const activeTab = ref(route.query.tab || 'overview')

const activity = ref({})
const leads = ref([])
const leadsLoading = ref(false)
const opportunities = ref([])
const oppsLoading = ref(false)

const expenses = ref([])
const expensesLoading = ref(false)
const expenseDialogVisible = ref(false)
const expenseFormRef = ref(null)
const expenseSubmitting = ref(false)
const expenseForm = reactive({
  expense_type: '',
  amount: 0,
  expense_date: '',
  description: ''
})
const expenseRules = {
  expense_type: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  expense_date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const analysis = ref({})

const copyForm = reactive({ theme: '', target_type: '' })
const copyGenerating = ref(false)
const copyResults = ref([])

const typeMap = { online: '线上推广', offline: '线下活动', email: '邮件营销', social: '社交媒体', other: '其他' }
const statusMap = { planning: '计划中', active: '进行中', completed: '已完成', cancelled: '已取消' }
const statusTypeMap = { planning: 'info', active: 'success', completed: '', cancelled: 'danger' }

function formatNum(num) {
  return (num || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function fetchActivity() {
  try {
    const res = await request.get(`/marketing-activities/${activityId}`)
    activity.value = res || {}
  } catch {
    ElMessage.error('获取活动信息失败')
  }
}

async function fetchLeads() {
  leadsLoading.value = true
  try {
    const res = await request.get(`/marketing-activities/${activityId}/leads`)
    leads.value = res || []
  } catch { /* ignore */ }
  finally { leadsLoading.value = false }
}

async function fetchOpportunities() {
  oppsLoading.value = true
  try {
    const res = await request.get(`/marketing-activities/${activityId}/opportunities`)
    opportunities.value = res || []
  } catch { /* ignore */ }
  finally { oppsLoading.value = false }
}

async function fetchExpenses() {
  expensesLoading.value = true
  try {
    const res = await request.get(`/marketing-activities/${activityId}/expenses`)
    expenses.value = res || []
  } catch { /* ignore */ }
  finally { expensesLoading.value = false }
}

async function fetchAnalysis() {
  try {
    const res = await request.get(`/marketing-activities/${activityId}/analysis`)
    analysis.value = res || {}
  } catch { /* ignore */ }
}

function showExpenseDialog() {
  Object.assign(expenseForm, { expense_type: '', amount: 0, expense_date: '', description: '' })
  expenseDialogVisible.value = true
}

async function submitExpense() {
  const valid = await expenseFormRef.value.validate().catch(() => false)
  if (!valid) return
  expenseSubmitting.value = true
  try {
    await request.post(`/marketing-activities/${activityId}/expenses`, expenseForm)
    ElMessage.success('新增成功')
    expenseDialogVisible.value = false
    fetchExpenses()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    expenseSubmitting.value = false
  }
}

async function generateCopy() {
  if (!copyForm.theme.trim()) {
    ElMessage.warning('请输入活动主题')
    return
  }
  copyGenerating.value = true
  try {
    const res = await request.post('/ai/marketing-copy', {
      activity_id: activityId,
      theme: copyForm.theme,
      target_type: copyForm.target_type
    })
    copyResults.value = res && res.copies ? res.copies : []
  } catch {
    ElMessage.error('生成失败')
  } finally {
    copyGenerating.value = false
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

onMounted(() => {
  fetchActivity()
  fetchLeads()
  fetchOpportunities()
  fetchExpenses()
  fetchAnalysis()
})
</script>

<style scoped>
.activity-detail {
  padding: 16px;
}

.detail-tabs {
  margin-top: 16px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 500;
}

.stat-card {
  text-align: center;
}

.copy-form {
  margin-bottom: 0;
}

.copy-card .el-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copy-content {
  min-height: 120px;
  white-space: pre-wrap;
  color: #606266;
  font-size: 14px;
  line-height: 1.8;
}
</style>
