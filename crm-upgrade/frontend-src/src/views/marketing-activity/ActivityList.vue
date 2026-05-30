<template>
  <div class="activity-list">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="活动名称">
          <el-input v-model="searchForm.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="活动类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="线上推广" value="online" />
            <el-option label="线下活动" value="offline" />
            <el-option label="邮件营销" value="email" />
            <el-option label="社交媒体" value="social" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="计划中" value="planning" />
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>营销活动列表</span>
          <el-button type="primary" @click="handleAdd">新增活动</el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="活动名称" min-width="160" />
        <el-table-column label="活动类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ typeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预算" width="120" align="right">
          <template #default="{ row }">¥{{ formatNumber(row.budget) }}</template>
        </el-table-column>
        <el-table-column label="实际花费" width="120" align="right">
          <template #default="{ row }">¥{{ formatNumber(row.actual_cost) }}</template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="110" />
        <el-table-column prop="end_date" label="结束日期" width="110" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lead_count" label="线索数" width="80" align="center" />
        <el-table-column prop="opportunity_count" label="商机数" width="80" align="center" />
        <el-table-column label="成交额" width="120" align="right">
          <template #default="{ row }">¥{{ formatNumber(row.deal_amount) }}</template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="100" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleExpenses(row)">费用</el-button>
            <el-button link type="primary" @click="handleAnalysis(row)">分析</el-button>
            <el-button link type="success" @click="handleAiCopy(row)">AI文案</el-button>
            <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width:100%">
            <el-option label="线上推广" value="online" />
            <el-option label="线下活动" value="offline" />
            <el-option label="邮件营销" value="email" />
            <el-option label="社交媒体" value="social" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算" prop="budget">
          <el-input-number v-model="form.budget" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" placeholder="请选择" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" placeholder="请选择" style="width:100%" />
        </el-form-item>
        <el-form-item label="负责人" prop="owner_id">
          <el-input v-model="form.owner_id" placeholder="请输入负责人ID" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入活动描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const searchForm = reactive({ name: '', type: '', status: '' })
const tableData = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive({
  name: '',
  type: '',
  budget: 0,
  start_date: '',
  end_date: '',
  owner_id: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  budget: [{ required: true, message: '请输入预算', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

const typeMap = { online: '线上推广', offline: '线下活动', email: '邮件营销', social: '社交媒体', other: '其他' }
const statusMap = { planning: '计划中', active: '进行中', completed: '已完成', cancelled: '已取消' }
const statusTypeMap = { planning: 'info', active: 'success', completed: '', cancelled: 'danger' }

function formatNumber(num) { return (num || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/marketing-activities/list', {
      params: { ...searchForm, page: pagination.page, pageSize: pagination.pageSize }
    })
    const data = res.data || {}
    tableData.value = data.list || data.records || []
    pagination.total = data.total || 0
  } catch {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.name = ''
  searchForm.type = ''
  searchForm.status = ''
  handleSearch()
}

function handleAdd() {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增活动'
  dialogVisible.value = true
}

function handleView(row) {
  router.push(`/marketing-activity/${row.id}`)
}

function handleEdit(row) {
  isEdit.value = true
  editId.value = row.id
  dialogTitle.value = '编辑活动'
  Object.assign(form, {
    name: row.name || '',
    type: row.type || '',
    budget: row.budget || 0,
    start_date: row.start_date || '',
    end_date: row.end_date || '',
    owner_id: row.owner_id || '',
    description: row.description || ''
  })
  dialogVisible.value = true
}

function handleExpenses(row) {
  router.push(`/marketing-activity/${row.id}?tab=expenses`)
}

function handleAnalysis(row) {
  router.push(`/marketing-activity/${row.id}?tab=analysis`)
}

function handleAiCopy(row) {
  router.push(`/marketing-activity/${row.id}?tab=ai-copy`)
}

async function handleDelete(row) {
  try {
    await request.delete(`/marketing-activities/${row.id}`)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await request.put(`/marketing-activities/${editId.value}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/marketing-activities', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', type: '', budget: 0, start_date: '', end_date: '', owner_id: '', description: '' })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.activity-list {
  padding: 16px;
}

.search-form {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
