<template>
  <div class="schedule-view">
    <el-card>
      <el-tabs v-model="activeTab">
        <!-- Calendar Tab - Month View -->
        <el-tab-pane label="日历" name="calendar">
          <div class="calendar-toolbar">
            <div class="calendar-nav">
              <el-button @click="prevMonth" :icon="ArrowLeft" />
              <span class="calendar-title">{{ monthLabel }}</span>
              <el-button @click="nextMonth" :icon="ArrowRight" />
              <el-button @click="goToday">今天</el-button>
            </div>
            <el-button type="primary" @click="showScheduleDialog()">新建日程</el-button>
          </div>
          <div class="month-calendar">
            <!-- Day-of-week header -->
            <div class="month-header">
              <div v-for="d in dayNames" :key="d" class="month-header-cell">
                {{ d }}
              </div>
            </div>
            <!-- Calendar grid -->
            <div class="month-grid">
              <div
                v-for="(cell, idx) in calendarCells"
                :key="idx"
                :class="['month-cell', {
                  'other-month': !cell.isCurrentMonth,
                  today: cell.isToday
                }]"
                @click="showScheduleDialog(cell.date)"
              >
                <div class="cell-date">{{ cell.day }}</div>
                <div class="cell-schedules">
                  <div
                    v-for="ev in cell.events"
                    :key="ev.id"
                    :class="['schedule-chip', `type-${ev.type}`]"
                    :style="{ background: getEventColor(ev.type) }"
                    @click.stop="editSchedule(ev)"
                  >
                    {{ ev.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tasks Tab -->
        <el-tab-pane label="任务" name="tasks">
          <div class="task-toolbar">
            <el-form :inline="true" :model="taskFilter">
              <el-form-item label="搜索">
                <el-input v-model="taskFilter.title" placeholder="搜索任务" clearable />
              </el-form-item>
              <el-form-item label="优先级">
                <el-select v-model="taskFilter.priority" placeholder="全部" clearable>
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="taskFilter.status" placeholder="全部" clearable>
                  <el-option label="待办" value="todo" />
                  <el-option label="进行中" value="in_progress" />
                  <el-option label="已完成" value="done" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="fetchTasks">搜索</el-button>
                <el-button type="primary" @click="showTaskDialog()">新建任务</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table :data="tasks" v-loading="tasksLoading" stripe border>
            <el-table-column prop="title" label="标题" min-width="160" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">{{ taskTypeMap[row.type] || row.type }}</template>
            </el-table-column>
            <el-table-column label="优先级" width="90">
              <template #default="{ row }">
                <el-tag :type="priorityTypeMap[row.priority]" size="small">{{ priorityMap[row.priority] || row.priority }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="related_to" label="关联对象" width="120" />
            <el-table-column label="截止日期" width="110">
              <template #default="{ row }">{{ row.due_date || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="taskStatusTypeMap[row.status]" size="small">{{ taskStatusMap[row.status] || row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="editTask(row)">编辑</el-button>
                <el-popconfirm title="确认删除？" @confirm="deleteTask(row)">
                  <template #reference>
                    <el-button link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="taskPagination.page"
              v-model:page-size="taskPagination.pageSize"
              :total="taskPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchTasks"
              @current-change="fetchTasks"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Schedule Dialog -->
    <el-dialog v-model="scheduleDialogVisible" :title="editingScheduleId ? '编辑日程' : '新建日程'" width="550px" destroy-on-close>
      <el-form ref="scheduleFormRef" :model="scheduleForm" :rules="scheduleRules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="scheduleForm.title" placeholder="请输入日程标题" />
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="scheduleForm.date" type="date" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-time-picker v-model="scheduleForm.start_time" format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-time-picker v-model="scheduleForm.end_time" format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="scheduleForm.type" style="width:100%">
            <el-option label="会议" value="meeting" />
            <el-option label="任务" value="task" />
            <el-option label="拜访" value="visit" />
            <el-option label="跟进" value="followup" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="scheduleForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button v-if="editingScheduleId" type="danger" @click="deleteSchedule">删除</el-button>
        <el-button type="primary" @click="submitSchedule" :loading="scheduleSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- Task Dialog -->
    <el-dialog v-model="taskDialogVisible" :title="editingTaskId ? '编辑任务' : '新建任务'" width="550px" destroy-on-close>
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="taskForm.type" style="width:100%">
            <el-option label="销售任务" value="sales" />
            <el-option label="客户跟进" value="followup" />
            <el-option label="文档整理" value="document" />
            <el-option label="会议" value="meeting" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" style="width:100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联对象">
          <el-input v-model="taskForm.related_to" placeholder="客户/商机名称" />
        </el-form-item>
        <el-form-item label="截止日期" prop="due_date">
          <el-date-picker v-model="taskForm.due_date" type="date" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="taskForm.status" style="width:100%">
            <el-option label="待办" value="todo" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="done" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="taskForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTask" :loading="taskSubmitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const activeTab = ref('calendar')

const dayNames = ['一', '二', '三', '四', '五', '六', '日']

// Calendar state
const currentDate = ref(new Date())
const schedules = ref([])

const scheduleDialogVisible = ref(false)
const scheduleFormRef = ref(null)
const editingScheduleId = ref(null)
const scheduleSubmitting = ref(false)
const scheduleForm = reactive({
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  type: 'meeting',
  description: ''
})
const scheduleRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

// Tasks state
const tasks = ref([])
const tasksLoading = ref(false)
const taskFilter = reactive({ title: '', priority: '', status: '' })
const taskPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const taskDialogVisible = ref(false)
const taskFormRef = ref(null)
const editingTaskId = ref(null)
const taskSubmitting = ref(false)
const taskForm = reactive({
  title: '',
  type: 'sales',
  priority: 'medium',
  related_to: '',
  due_date: '',
  status: 'todo',
  description: ''
})
const taskRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// Maps
const priorityMap = { high: '高', medium: '中', low: '低' }
const priorityTypeMap = { high: 'danger', medium: 'warning', low: 'info' }
const taskStatusMap = { todo: '待办', in_progress: '进行中', done: '已完成' }
const taskStatusTypeMap = { todo: 'info', in_progress: '', done: 'success' }
const taskTypeMap = { sales: '销售任务', followup: '客户跟进', document: '文档整理', meeting: '会议', other: '其他' }
const eventColorMap = {
  meeting: '#409EFF',
  task: '#67C23A',
  visit: '#E6A23C',
  followup: '#F56C6C',
  other: '#909399'
}

function getEventColor(type) { return eventColorMap[type] || '#909399' }

// Calendar computations
const monthLabel = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth() + 1
  return `${y}年 ${m}月`
})

const calendarCells = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Adjust start to Monday (day 0 = Monday, 6 = Sunday)
  let startDayOfWeek = firstDay.getDay()
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const cells = []

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const dateStr = formatDate(new Date(year, month - 1, d))
    cells.push({
      day: d,
      date: dateStr,
      isCurrentMonth: false,
      isToday: new Date(year, month - 1, d).getTime() === today.getTime(),
      events: getEventsForDate(dateStr)
    })
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(year, month, d)
    const dateStr = formatDate(dateObj)
    cells.push({
      day: d,
      date: dateStr,
      isCurrentMonth: true,
      isToday: dateObj.getTime() === today.getTime(),
      events: getEventsForDate(dateStr)
    })
  }

  // Fill remaining cells to complete grid (6 rows x 7 = 42 cells max)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const dateStr = formatDate(new Date(year, month + 1, d))
    cells.push({
      day: d,
      date: dateStr,
      isCurrentMonth: false,
      isToday: new Date(year, month + 1, d).getTime() === today.getTime(),
      events: getEventsForDate(dateStr)
    })
  }

  return cells
})

function getEventsForDate(dateStr) {
  return schedules.value.filter(e => e.date === dateStr).slice(0, 4)
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function prevMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
  fetchSchedules()
}

function nextMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
  fetchSchedules()
}

function goToday() {
  currentDate.value = new Date()
  fetchSchedules()
}

// Schedule CRUD
async function fetchSchedules() {
  const startStr = formatDate(new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1))
  const endStr = formatDate(new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0))
  try {
    const res = await request.get('/schedules/calendar', {
      params: { start: startStr, end: endStr }
    })
    schedules.value = res || []
  } catch { /* ignore */ }
}

function showScheduleDialog(date) {
  editingScheduleId.value = null
  Object.assign(scheduleForm, {
    title: '',
    date: date || '',
    start_time: '',
    end_time: '',
    type: 'meeting',
    description: ''
  })
  scheduleDialogVisible.value = true
}

function editSchedule(event) {
  editingScheduleId.value = event.id
  Object.assign(scheduleForm, {
    title: event.title || '',
    date: event.date || '',
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    type: event.type || 'meeting',
    description: event.description || ''
  })
  scheduleDialogVisible.value = true
}

async function submitSchedule() {
  const valid = await scheduleFormRef.value.validate().catch(() => false)
  if (!valid) return
  scheduleSubmitting.value = true
  try {
    if (editingScheduleId.value) {
      await request.put(`/schedules/${editingScheduleId.value}`, scheduleForm)
      ElMessage.success('更新成功')
    } else {
      await request.post('/schedules', scheduleForm)
      ElMessage.success('创建成功')
    }
    scheduleDialogVisible.value = false
    fetchSchedules()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    scheduleSubmitting.value = false
  }
}

async function deleteSchedule() {
  try {
    await request.delete(`/schedules/${editingScheduleId.value}`)
    ElMessage.success('删除成功')
    scheduleDialogVisible.value = false
    fetchSchedules()
  } catch {
    ElMessage.error('删除失败')
  }
}

// Task CRUD
async function fetchTasks() {
  tasksLoading.value = true
  try {
    const params = { ...taskFilter, page: taskPagination.page, pageSize: taskPagination.pageSize }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null) delete params[k]
    })
    const res = await request.get('/tasks/list', { params })
    const data = res || {}
    tasks.value = data.list || data.records || []
    taskPagination.total = data.total || 0
  } catch {
    ElMessage.error('获取任务失败')
  } finally {
    tasksLoading.value = false
  }
}

function showTaskDialog() {
  editingTaskId.value = null
  Object.assign(taskForm, {
    title: '', type: 'sales', priority: 'medium', related_to: '', due_date: '', status: 'todo', description: ''
  })
  taskDialogVisible.value = true
}

function editTask(row) {
  editingTaskId.value = row.id
  Object.assign(taskForm, {
    title: row.title || '',
    type: row.type || 'sales',
    priority: row.priority || 'medium',
    related_to: row.related_to || '',
    due_date: row.due_date || '',
    status: row.status || 'todo',
    description: row.description || ''
  })
  taskDialogVisible.value = true
}

async function submitTask() {
  const valid = await taskFormRef.value.validate().catch(() => false)
  if (!valid) return
  taskSubmitting.value = true
  try {
    if (editingTaskId.value) {
      await request.put(`/tasks/${editingTaskId.value}`, taskForm)
      ElMessage.success('更新成功')
    } else {
      await request.post('/tasks', taskForm)
      ElMessage.success('创建成功')
    }
    taskDialogVisible.value = false
    fetchTasks()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    taskSubmitting.value = false
  }
}

async function deleteTask(row) {
  try {
    await request.delete(`/tasks/${row.id}`)
    ElMessage.success('删除成功')
    fetchTasks()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchSchedules()
  fetchTasks()
})
</script>

<style scoped>
.schedule-view {
  padding: 16px;
}

.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-title {
  font-size: 16px;
  font-weight: 600;
  min-width: 160px;
  text-align: center;
}

/* Month Calendar */
.month-calendar {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.month-header-cell {
  padding: 10px 0;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #606266;
  border-left: 1px solid #e4e7ed;
}

.month-header-cell:first-child {
  border-left: none;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.month-cell {
  min-height: 100px;
  border-left: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  padding: 4px 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.month-cell:hover {
  background: #f5f7fa;
}

.month-cell.other-month {
  background: #fafafa;
  color: #c0c4cc;
}

.month-cell.today {
  background: #ecf5ff;
}

.month-cell.today .cell-date {
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 50%;
}

.cell-date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.cell-schedules {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.schedule-chip {
  padding: 2px 6px;
  border-radius: 3px;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  line-height: 1.6;
}

.schedule-chip:hover {
  opacity: 0.85;
}

.task-toolbar {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
