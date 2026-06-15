<template>
  <div class="service-list">
    <el-card shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="服务单号">
          <el-input v-model="searchForm.request_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="投诉" value="complaint" />
            <el-option label="咨询" value="consultation" />
            <el-option label="维修" value="repair" />
            <el-option label="建议" value="suggestion" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="请选择" clearable>
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 服务请求 Tab -->
        <el-tab-pane label="服务请求" name="requests">
          <div style="margin-bottom: 16px">
            <el-button type="primary" @click="handleCreate">新建服务请求</el-button>
          </div>
          <el-table :data="requestData" v-loading="requestLoading" stripe border>
            <el-table-column prop="request_no" label="服务单号" min-width="140" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="customer_name" label="客户名称" min-width="140" />
            <el-table-column label="类型" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="typeTag(row.type)" size="small">{{ typeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="优先级" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="priorityType(row.priority)" size="small">{{ priorityText(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
                <el-button link type="success" size="small" @click="handleCreateTicketFromRow(row)">创建工单</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 16px; display: flex; justify-content: flex-end">
            <el-pagination
              v-model:current-page="requestPagination.page"
              v-model:page-size="requestPagination.pageSize"
              :total="requestPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchRequests"
              @current-change="fetchRequests"
            />
          </div>
        </el-tab-pane>

        <!-- 服务工单 Tab -->
        <el-tab-pane label="服务工单" name="tickets">
          <el-table :data="ticketData" v-loading="ticketLoading" stripe border>
            <el-table-column prop="ticket_no" label="工单号" min-width="140" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="ticketStatusType(row.status)" size="small">{{ ticketStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee_name" label="处理人" width="100" />
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewTicket(row)">查看</el-button>
                <el-button link type="primary" size="small" @click="handleEditTicket(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 16px; display: flex; justify-content: flex-end">
            <el-pagination
              v-model:current-page="ticketPagination.page"
              v-model:page-size="ticketPagination.pageSize"
              :total="ticketPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchTickets"
              @current-change="fetchTickets"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- New Request Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新建服务请求' : '编辑服务请求'" width="600px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="客户" prop="customer_id">
          <el-select v-model="form.customer_id" placeholder="请选择客户" filterable clearable style="width:100%">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width:100%">
            <el-option label="投诉" value="complaint" />
            <el-option label="咨询" value="consultation" />
            <el-option label="维修" value="repair" />
            <el-option label="建议" value="suggestion" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="请选择优先级" style="width:100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入详细描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- Create Ticket Dialog -->
    <el-dialog v-model="ticketDialogVisible" title="创建工单" width="550px" destroy-on-close :close-on-click-modal="false">
      <el-form ref="ticketFormRef" :model="ticketForm" :rules="ticketRules" label-width="100px">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="ticketForm.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="处理人" prop="assignee_id">
          <el-select v-model="ticketForm.assignee_id" placeholder="请选择处理人" filterable clearable style="width:100%">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { serviceApi, customerApi } from '@/api/index'

const router = useRouter()
const activeTab = ref('requests')

// Requests state
const requestLoading = ref(false)
const requestData = ref([])
const requestPagination = reactive({ page: 1, pageSize: 20, total: 0 })
const customerOptions = ref([])
const userOptions = ref([])

// Tickets state
const ticketLoading = ref(false)
const ticketData = ref([])
const ticketPagination = reactive({ page: 1, pageSize: 20, total: 0 })

// Dialog state
const dialogVisible = ref(false)
const dialogMode = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const ticketDialogVisible = ref(false)
const ticketFormRef = ref(null)
const submittingTicket = ref(false)
const currentRequestRow = ref(null)

const searchForm = reactive({
  request_no: '',
  title: '',
  type: '',
  priority: '',
  status: ''
})

const form = reactive({
  id: null,
  customer_id: null,
  type: '',
  title: '',
  priority: 'medium',
  description: ''
})

const ticketForm = reactive({
  service_request_id: null,
  title: '',
  assignee_id: null,
  priority: 'medium',
  description: ''
})

const rules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const ticketRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  assignee_id: [{ required: true, message: '请选择处理人', trigger: 'change' }]
}

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

async function fetchRequests() {
  requestLoading.value = true
  try {
    const params = {
      page: requestPagination.page,
      pageSize: requestPagination.pageSize,
      ...searchForm
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null) delete params[k]
    })
    const res = await serviceApi.listRequests(params)
    requestData.value = res.records || res || []
    requestPagination.total = res.total || 0
  } catch {
    ElMessage.error('获取服务请求失败')
  } finally {
    requestLoading.value = false
  }
}

async function fetchTickets() {
  ticketLoading.value = true
  try {
    const res = await serviceApi.listTickets({
      page: ticketPagination.page,
      pageSize: ticketPagination.pageSize
    })
    ticketData.value = res.records || res || []
    ticketPagination.total = res.total || 0
  } catch {
    ElMessage.error('获取工单列表失败')
  } finally {
    ticketLoading.value = false
  }
}

async function fetchOptions() {
  try {
    const cust = await customerApi.list({ pageSize: 999 })
    customerOptions.value = cust.list || cust || []
  } catch { /* ignore */ }
}

function handleSearch() {
  requestPagination.page = 1
  fetchRequests()
}

function handleReset() {
  Object.assign(searchForm, { request_no: '', title: '', type: '', priority: '', status: '' })
  handleSearch()
}

function handleTabChange(tab) {
  if (tab === 'requests') fetchRequests()
  else if (tab === 'tickets') fetchTickets()
}

function resetForm() {
  Object.assign(form, { id: null, customer_id: null, type: '', title: '', priority: 'medium', description: '' })
}

function handleCreate() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

function handleView(row) {
  router.push(`/service/detail/${row.id}`)
}

function handleCreateTicketFromRow(row) {
  currentRequestRow.value = row
  ticketForm.service_request_id = row.id
  ticketForm.title = row.title ? `[${row.request_no}] ${row.title}` : `[${row.request_no}] 关联工单`
  ticketForm.assignee_id = null
  ticketForm.priority = row.priority || 'medium'
  ticketForm.description = ''
  ticketDialogVisible.value = true
}

async function handleEdit(row) {
  dialogMode.value = 'edit'
  try {
    const res = await serviceApi.getRequest(row.id)
    const data = res
    Object.assign(form, {
      id: data.id,
      customer_id: data.customer_id,
      type: data.type,
      title: data.title,
      priority: data.priority || 'medium',
      description: data.description || ''
    })
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取详情失败')
  }
}

async function handleSubmitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await serviceApi.createRequest(form)
      ElMessage.success('创建成功')
    } else {
      await serviceApi.updateRequest({ ...form })
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    fetchRequests()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleSubmitTicket() {
  const valid = await ticketFormRef.value.validate().catch(() => false)
  if (!valid) return
  submittingTicket.value = true
  try {
    await serviceApi.createTicket(ticketForm.service_request_id, {
      title: ticketForm.title,
      assignee_id: ticketForm.assignee_id,
      priority: ticketForm.priority,
      description: ticketForm.description
    })
    ElMessage.success('工单创建成功')
    ticketDialogVisible.value = false
    fetchTickets()
  } catch {
    ElMessage.error('创建工单失败')
  } finally {
    submittingTicket.value = false
  }
}

function handleViewTicket(row) {
  router.push(`/service/detail/${row.service_request_id || row.id}?tab=tickets`)
}

function handleEditTicket(row) {
  ElMessage.info('处理工单功能')
}

onMounted(() => {
  fetchRequests()
  fetchOptions()
})
</script>

<style scoped>
.service-list {
  padding: 16px;
}
</style>
