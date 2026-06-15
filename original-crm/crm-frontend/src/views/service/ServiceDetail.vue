<template>
  <div class="service-detail" v-loading="loading">
    <el-page-header @back="$router.back()" :content="`服务详情 - ${detail.request_no || ''}`" />

    <el-tabs v-model="activeTab" style="margin-top: 16px">
      <!-- Request Info Tab -->
      <el-tab-pane label="请求信息" name="info">
        <el-card shadow="never" v-if="detail.id">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="服务单号">{{ detail.request_no }}</el-descriptions-item>
            <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag :type="typeTag(detail.type)">{{ typeText(detail.type) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="priorityType(detail.priority)">{{ priorityText(detail.priority) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType(detail.status)">{{ statusText(detail.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="负责人">{{ detail.owner || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ detail.customer_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户电话">{{ detail.customer_phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(detail.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(detail.updated_at) }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-card shadow="never" style="margin-top: 16px" v-if="detail.status === 'completed' || detail.satisfaction_score !== undefined">
            <template #header>
              <span>满意度评价</span>
            </template>
            <div class="satisfaction-section">
              <span class="satisfaction-label">满意度评分：</span>
              <el-rate
                v-model="detail.satisfaction_score"
                disabled
                show-score
                :texts="['非常差', '差', '一般', '好', '非常好']"
                :colors="['#F56C6C', '#E6A23C', '#E6A23C', '#67C23A', '#409EFF']"
              />
              <div v-if="detail.satisfaction_comment" class="satisfaction-comment">
                评价内容：{{ detail.satisfaction_comment }}
              </div>
            </div>
          </el-card>
        </el-card>
      </el-tab-pane>

      <!-- Tickets Tab -->
      <el-tab-pane label="服务工单" name="tickets">
        <div class="tab-header">
          <span>工单列表</span>
          <el-button type="primary" @click="showCreateTicket">创建工单</el-button>
        </div>
        <el-table :data="tickets" v-loading="ticketsLoading" stripe border>
          <el-table-column prop="ticket_no" label="工单号" min-width="140" />
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="ticketStatusType(row.status)">{{ ticketStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignee_name" label="处理人" width="100" />
          <el-table-column label="处理日志" min-width="200">
            <template #default="{ row }">
              <el-tooltip v-if="row.logs && row.logs.length" placement="left">
                <template #content>
                  <div v-for="(log, i) in row.logs" :key="i" style="margin-bottom:4px">
                    <div>{{ log.content }}</div>
                    <div style="font-size:11px;color:#909399">{{ formatDateTime(log.created_at) }} {{ log.operator }}</div>
                  </div>
                </template>
                <el-tag size="small" type="warning">查看日志 ({{ row.logs.length }})</el-tag>
              </el-tooltip>
              <span v-else style="color:#c0c4cc">暂无日志</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showTicketLog(row)">日志</el-button>
              <el-button link type="primary" size="small" @click="handleCompleteTicket(row)">完成</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Visit Plans Tab -->
      <el-tab-pane label="回访计划" name="visits">
        <div class="tab-header">
          <span>回访记录</span>
          <el-button type="primary" @click="showAddVisit">新增回访</el-button>
        </div>
        <el-table :data="visits" v-loading="visitsLoading" stripe border>
          <el-table-column prop="plan_date" label="计划日期" width="120" />
          <el-table-column prop="content" label="回访内容" min-width="180" show-overflow-tooltip />
          <el-table-column prop="method" label="方式" width="80" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : 'info'" size="small">
                {{ row.status === 'completed' ? '已完成' : '待回访' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="满意度" width="180" align="center">
            <template #default="{ row }">
              <el-rate v-model="row.satisfaction_score" disabled show-score size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="visitor" label="回访人" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status !== 'completed'"
                link type="primary" size="small"
                @click="showCompleteVisit(row)"
              >完成</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Create Ticket Dialog -->
    <el-dialog v-model="ticketDialogVisible" title="创建工单" width="550px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="ticketFormRef" :model="ticketForm" :rules="ticketRules" label-width="100px">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="ticketForm.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="处理人" prop="assignee_id">
          <el-select v-model="ticketForm.assignee_id" placeholder="请选择处理人" filterable style="width:100%">
            <el-option v-for="u in userOptions" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="ticketForm.priority" placeholder="请选择优先级" style="width:100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="ticketForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ticketDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTicket" :loading="submittingTicket">创建</el-button>
      </template>
    </el-dialog>

    <!-- Add Visit Dialog -->
    <el-dialog v-model="visitDialogVisible" title="新增回访计划" width="500px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="visitFormRef" :model="visitForm" :rules="visitRules" label-width="100px">
        <el-form-item label="计划日期" prop="plan_date">
          <el-date-picker v-model="visitForm.plan_date" type="date" placeholder="请选择日期" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="回访方式" prop="method">
          <el-select v-model="visitForm.method" placeholder="请选择方式" style="width:100%">
            <el-option label="电话" value="电话" />
            <el-option label="上门" value="上门" />
            <el-option label="邮件" value="邮件" />
            <el-option label="微信" value="微信" />
          </el-select>
        </el-form-item>
        <el-form-item label="回访内容" prop="content">
          <el-input v-model="visitForm.content" type="textarea" :rows="3" placeholder="请输入回访内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitVisit" :loading="submittingVisit">保存</el-button>
      </template>
    </el-dialog>

    <!-- Complete Visit Dialog -->
    <el-dialog v-model="completeVisitVisible" title="完成回访" width="450px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="completeVisitFormRef" :model="completeVisitForm" label-width="100px">
        <el-form-item label="满意度评分">
          <el-rate v-model="completeVisitForm.satisfaction_score" show-score :texts="['非常差', '差', '一般', '好', '非常好']" />
        </el-form-item>
        <el-form-item label="回访结果">
          <el-input v-model="completeVisitForm.result" type="textarea" :rows="3" placeholder="请输入回访结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeVisitVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCompleteVisit" :loading="completingVisit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { serviceApi } from '@/api/index'

const route = useRoute()
const router = useRouter()
const serviceId = route.params.id
const activeTab = ref(route.query.tab || 'info')
const loading = ref(false)

const detail = reactive({
  id: null,
  request_no: '',
  title: '',
  type: '',
  priority: '',
  status: '',
  owner: '',
  customer_name: '',
  customer_phone: '',
  description: '',
  satisfaction_score: 0,
  satisfaction_comment: '',
  created_at: '',
  updated_at: ''
})

// Tickets
const tickets = ref([])
const ticketsLoading = ref(false)
const userOptions = ref([])
const ticketDialogVisible = ref(false)
const ticketFormRef = ref(null)
const submittingTicket = ref(false)
const ticketForm = reactive({
  title: '',
  assignee_id: null,
  priority: 'medium',
  description: ''
})
const ticketRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  assignee_id: [{ required: true, message: '请选择处理人', trigger: 'change' }]
}

// Visits
const visits = ref([])
const visitsLoading = ref(false)
const visitDialogVisible = ref(false)
const visitFormRef = ref(null)
const submittingVisit = ref(false)
const visitForm = reactive({
  plan_date: '',
  method: '电话',
  content: ''
})
const visitRules = {
  plan_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  method: [{ required: true, message: '请选择方式', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const completeVisitVisible = ref(false)
const completeVisitFormRef = ref(null)
const completingVisit = ref(false)
const currentVisitRow = ref(null)
const completeVisitForm = reactive({
  satisfaction_score: 0,
  result: ''
})

function typeTag(type) {
  const map = { complaint: 'danger', consultation: '', repair: 'warning', suggestion: 'success', other: 'info' }
  return map[type] || 'info'
}
function typeText(type) {
  const map = { complaint: '投诉', consultation: '咨询', repair: '维修', suggestion: '建议', other: '其他' }
  return map[type] || type
}
function priorityType(priority) {
  const map = { low: 'info', medium: 'warning', high: 'danger', urgent: '' }
  return map[priority] || 'info'
}
function priorityText(priority) {
  const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[priority] || priority
}
function statusType(status) {
  const map = { pending: 'info', processing: '', completed: 'success', closed: 'danger' }
  return map[status] || 'info'
}
function statusText(status) {
  const map = { pending: '待处理', processing: '处理中', completed: '已完成', closed: '已关闭' }
  return map[status] || status
}
function ticketStatusType(status) {
  const map = { pending: 'info', processing: 'warning', completed: 'success', closed: 'danger' }
  return map[status] || 'info'
}
function ticketStatusText(status) {
  const map = { pending: '待处理', processing: '处理中', completed: '已完成', closed: '已关闭' }
  return map[status] || status
}
function formatDateTime(val) {
  if (!val) return '-'
  return val.substring(0, 19).replace('T', ' ')
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await serviceApi.getRequest(serviceId)
    Object.assign(detail, res || {})
  } catch {
    ElMessage.error('获取服务详情失败')
  } finally {
    loading.value = false
  }
}

async function fetchTickets() {
  ticketsLoading.value = true
  try {
    const res = await serviceApi.getTickets(serviceId)
    tickets.value = res || []
  } catch { /* ignore */ }
  finally { ticketsLoading.value = false }
}

async function fetchVisits() {
  visitsLoading.value = true
  try {
    const res = await serviceApi.listVisits(serviceId)
    visits.value = res || []
  } catch { /* ignore */ }
  finally { visitsLoading.value = false }
}

function showCreateTicket() {
  Object.assign(ticketForm, {
    title: `[${detail.request_no}] 关联工单`,
    assignee_id: null,
    priority: detail.priority || 'medium',
    description: ''
  })
  ticketDialogVisible.value = true
}

async function handleSubmitTicket() {
  const valid = await ticketFormRef.value.validate().catch(() => false)
  if (!valid) return
  submittingTicket.value = true
  try {
    await serviceApi.createTicket(serviceId, ticketForm)
    ElMessage.success('工单创建成功')
    ticketDialogVisible.value = false
    fetchTickets()
  } catch {
    ElMessage.error('创建失败')
  } finally {
    submittingTicket.value = false
  }
}

function showTicketLog(row) {
  ElMessage.info('查看处理日志')
}

async function handleCompleteTicket(row) {
  try {
    await serviceApi.completeTicket(row.id)
    ElMessage.success('工单已完成')
    fetchTickets()
  } catch {
    ElMessage.error('操作失败')
  }
}

function showAddVisit() {
  Object.assign(visitForm, { plan_date: '', method: '电话', content: '' })
  visitDialogVisible.value = true
}

async function handleSubmitVisit() {
  const valid = await visitFormRef.value.validate().catch(() => false)
  if (!valid) return
  submittingVisit.value = true
  try {
    await serviceApi.addVisitPlan(serviceId, visitForm)
    ElMessage.success('创建成功')
    visitDialogVisible.value = false
    fetchVisits()
  } catch {
    ElMessage.error('创建失败')
  } finally {
    submittingVisit.value = false
  }
}

function showCompleteVisit(row) {
  currentVisitRow.value = row
  completeVisitForm.satisfaction_score = 0
  completeVisitForm.result = ''
  completeVisitVisible.value = true
}

async function handleSubmitCompleteVisit() {
  completingVisit.value = true
  try {
    await serviceApi.completeVisit(currentVisitRow.value.id, completeVisitForm)
    ElMessage.success('回访已完成')
    completeVisitVisible.value = false
    fetchVisits()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    completingVisit.value = false
  }
}

onMounted(() => {
  fetchDetail()
  fetchTickets()
  fetchVisits()
})
</script>

<style scoped>
.service-detail {
  padding: 16px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 500;
}

.satisfaction-section {
  padding: 8px 0;
}

.satisfaction-label {
  font-weight: 500;
  margin-right: 8px;
}

.satisfaction-comment {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}
</style>
