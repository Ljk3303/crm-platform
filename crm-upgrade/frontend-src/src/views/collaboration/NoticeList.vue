<template>
  <div class="notice-list">
    <el-card shadow="never">
      <div class="toolbar">
        <span class="page-title">公告管理</span>
        <el-button type="primary" @click="handleCreate">发布公告</el-button>
      </div>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="title" label="标题" min-width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.type || '通知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)">{{ levelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publisher_name" label="发布人" width="100" />
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.published_at || row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="浏览量" width="80" align="center">
          <template #default="{ row }">
            <span style="color: #409eff">{{ row.view_count || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
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

    <!-- View Dialog -->
    <el-dialog v-model="viewVisible" title="公告详情" width="700px" destroy-on-close>
      <template v-if="currentNotice">
        <h2 class="view-title">{{ currentNotice.title }}</h2>
        <div class="view-meta">
          <span>发布人：{{ currentNotice.publisher_name || '-' }}</span>
          <span>发布时间：{{ formatDateTime(currentNotice.published_at || currentNotice.created_at) }}</span>
          <span>浏览：{{ (currentNotice.view_count || 0) + 1 }} 次</span>
          <el-tag :type="levelType(currentNotice.level)" size="small">{{ levelText(currentNotice.level) }}</el-tag>
        </div>
        <el-divider />
        <div class="view-content" v-html="currentNotice.content || '暂无内容'"></div>
      </template>
    </el-dialog>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑公告' : '发布公告'"
      width="650px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width:100%">
                <el-option label="通知" value="通知" />
                <el-option label="制度" value="制度" />
                <el-option label="活动" value="活动" />
                <el-option label="喜报" value="喜报" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="级别" prop="level">
              <el-select v-model="form.level" placeholder="请选择级别" style="width:100%">
                <el-option label="一般" value="一般" />
                <el-option label="重要" value="重要" />
                <el-option label="紧急" value="紧急" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { noticeApi } from '@/api/index'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewVisible = ref(false)
const isEdit = ref(false)
const currentNotice = ref(null)
const formRef = ref(null)

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  id: null,
  title: '',
  type: '通知',
  level: '一般',
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  level: [{ required: true, message: '请选择级别', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

function levelType(level) {
  const map = { '一般': 'info', '重要': 'warning', '紧急': 'danger' }
  return map[level] || 'info'
}
function levelText(level) { return level || '-' }
function formatDateTime(val) {
  if (!val) return '-'
  return val.substring(0, 19).replace('T', ' ')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await noticeApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    const data = res.data || {}
    tableData.value = data.list || data.records || []
    pagination.total = data.total || 0
  } catch {
    ElMessage.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

async function handleView(row) {
  try {
    const res = await noticeApi.getById(row.id)
    currentNotice.value = res.data || row
    viewVisible.value = true
  } catch {
    currentNotice.value = row
    viewVisible.value = true
  }
}

function handleCreate() {
  isEdit.value = false
  Object.assign(form, { id: null, title: '', type: '通知', level: '一般', content: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    title: row.title || '',
    type: row.type || '通知',
    level: row.level || '一般',
    content: row.content || ''
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await noticeApi.update(form)
      ElMessage.success('更新成功')
    } else {
      await noticeApi.create(form)
      ElMessage.success('发布成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await noticeApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.notice-list {
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.view-title {
  margin: 0 0 12px;
  font-size: 20px;
  text-align: center;
}

.view-meta {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  color: #909399;
  font-size: 13px;
  flex-wrap: wrap;
}

.view-content {
  min-height: 120px;
  white-space: pre-wrap;
  line-height: 1.8;
  color: #303133;
}
</style>
