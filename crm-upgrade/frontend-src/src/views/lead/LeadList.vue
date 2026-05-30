<template>
  <div class="lead-list">
    <!-- Search Bar -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="线索名称">
          <el-input v-model="searchForm.name" placeholder="请输入线索名称" clearable />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="searchForm.source" placeholder="全部" clearable>
            <el-option label="网站" value="网站" />
            <el-option label="电话" value="电话" />
            <el-option label="介绍" value="介绍" />
            <el-option label="广告" value="广告" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="新建" value="新建" />
            <el-option label="跟进中" value="跟进中" />
            <el-option label="已转化" value="已转化" />
            <el-option label="无效" value="无效" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Tabs: All Leads / Pool -->
    <el-card class="table-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部线索" name="all">
          <div class="table-header">
            <el-button type="primary" @click="openNewDialog">新建线索</el-button>
          </div>
          <el-table :data="tableData" v-loading="loading" stripe border>
            <el-table-column prop="name" label="线索名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="company_name" label="公司名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="contact_name" label="联系人" min-width="100" />
            <el-table-column prop="contact_phone" label="联系电话" min-width="130" />
            <el-table-column prop="source" label="来源" min-width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.source }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="statusTagType(row.status)"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="follow_count" label="跟进次数" min-width="90" align="center" />
            <el-table-column prop="last_follow_at" label="最近跟进" min-width="160" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" min-width="280" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openEditDialog(row)">
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button
                  size="small"
                  type="warning"
                  :disabled="row.status === '已转化'"
                  @click="openConvertDialog(row)"
                >
                  <el-icon><Connection /></el-icon> 转化
                </el-button>
                <el-button size="small" type="success" @click="openFollowDialog(row)">
                  <el-icon><ChatDotRound /></el-icon> 跟进
                </el-button>
                <el-button size="small" type="danger" @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="线索池" name="pool">
          <el-table :data="poolData" v-loading="poolLoading" stripe border>
            <el-table-column prop="name" label="线索名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="company_name" label="公司名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="contact_name" label="联系人" min-width="100" />
            <el-table-column prop="contact_phone" label="联系电话" min-width="130" />
            <el-table-column prop="source" label="来源" min-width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.source }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" min-width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="claimLead(row)">
                  认领
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="poolPagination.page"
              v-model:page-size="poolPagination.pageSize"
              :total="poolPagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @size-change="handlePoolSizeChange"
              @current-change="handlePoolPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- New/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑线索' : '新建线索'"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="线索名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入线索名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源" prop="source">
              <el-select v-model="formData.source" placeholder="请选择来源">
                <el-option label="网站" value="网站" />
                <el-option label="电话" value="电话" />
                <el-option label="介绍" value="介绍" />
                <el-option label="广告" value="广告" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_name">
              <el-input v-model="formData.contact_name" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="formData.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系邮箱">
              <el-input v-model="formData.contact_email" placeholder="请输入联系邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司名称">
              <el-input v-model="formData.company_name" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行业">
              <el-input v-model="formData.industry" placeholder="请输入行业" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="formData.owner_id" placeholder="请选择负责人" filterable>
                <el-option
                  v-for="user in userList"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- Convert Dialog -->
    <el-dialog
      v-model="convertDialogVisible"
      title="线索转化"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="convert-content">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            确认将线索 <strong>{{ currentRow?.name }}</strong> 转化为客户和商机？
          </template>
        </el-alert>
        <el-form class="mt-20" label-width="100px">
          <el-form-item label="转化客户">
            <el-select v-model="convertForm.customer_id" placeholder="选择已有客户或新建" filterable allow-create>
              <el-option
                v-for="c in customerList"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="预计金额">
            <el-input-number v-model="convertForm.amount" :min="0" :precision="2" />
          </el-form-item>
          <el-form-item label="商机阶段">
            <el-select v-model="convertForm.stage" placeholder="选择阶段">
              <el-option label="初步接触" value="初步接触" />
              <el-option label="需求分析" value="需求分析" />
              <el-option label="方案报价" value="方案报价" />
              <el-option label="谈判" value="谈判" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="convertDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleConvert" :loading="convertLoading">确认转化</el-button>
      </template>
    </el-dialog>

    <!-- Follow Dialog -->
    <el-dialog
      v-model="followDialogVisible"
      title="新增跟进"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form ref="followFormRef" :model="followForm" :rules="followRules" label-width="100px">
        <el-form-item label="跟进方式" prop="follow_type">
          <el-select v-model="followForm.follow_type" placeholder="请选择跟进方式">
            <el-option label="电话" value="电话" />
            <el-option label="邮件" value="邮件" />
            <el-option label="拜访" value="拜访" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容" prop="content">
          <el-input
            v-model="followForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入跟进内容"
          />
        </el-form-item>
        <el-form-item label="下一步计划">
          <el-input
            v-model="followForm.next_plan"
            type="textarea"
            :rows="2"
            placeholder="请输入下一步计划"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFollow" :loading="followLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Edit, Connection, ChatDotRound, Delete } from '@element-plus/icons-vue'
import { leadApi, userApi, customerApi } from '@/api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  name: '',
  source: '',
  status: ''
})

const activeTab = ref('all')
const loading = ref(false)
const poolLoading = ref(false)
const tableData = ref([])
const poolData = ref([])
const userList = ref([])
const customerList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRow = ref(null)
const submitLoading = ref(false)
const formRef = ref(null)

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const poolPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const formData = reactive({
  name: '', source: '', contact_name: '', contact_phone: '',
  contact_email: '', company_name: '', industry: '', description: '', owner_id: null
})

const formRules = {
  name: [{ required: true, message: '请输入线索名称', trigger: 'blur' }],
  source: [{ required: true, message: '请选择来源', trigger: 'change' }],
  contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

// Convert
const convertDialogVisible = ref(false)
const convertLoading = ref(false)
const convertForm = reactive({ customer_id: null, amount: 0, stage: '初步接触' })

// Follow
const followDialogVisible = ref(false)
const followLoading = ref(false)
const followFormRef = ref(null)
const followForm = reactive({ follow_type: '', content: '', next_plan: '' })
const followRules = {
  follow_type: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
}

const statusTagType = (status) => {
  const map = { '新建': '', '跟进中': 'warning', '已转化': 'success', '无效': 'info' }
  return map[status] || ''
}

const fetchLeads = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchForm.name,
      source: searchForm.source,
      status: searchForm.status,
      pool: false
    }
    const res = await leadApi.list(params)
    tableData.value = res.data?.items || res.data || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    ElMessage.error('获取线索列表失败')
  } finally {
    loading.value = false
  }
}

const fetchPoolLeads = async () => {
  poolLoading.value = true
  try {
    const params = {
      page: poolPagination.page,
      pageSize: poolPagination.pageSize,
      pool: true
    }
    const res = await leadApi.list(params)
    poolData.value = res.data?.items || res.data || []
    poolPagination.total = res.data?.total || 0
  } catch (e) {
    ElMessage.error('获取线索池失败')
  } finally {
    poolLoading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const res = await userApi.list()
    userList.value = res.data || []
  } catch (e) { /* ignore */ }
}

const fetchCustomers = async () => {
  try {
    const res = await customerApi.list({ pageSize: 1000 })
    customerList.value = res.data?.items || res.data || []
  } catch (e) { /* ignore */ }
}

const handleSearch = () => { pagination.page = 1; fetchLeads() }
const handleReset = () => { searchForm.name = ''; searchForm.source = ''; searchForm.status = ''; pagination.page = 1; fetchLeads() }

const handleTabChange = (name) => {
  if (name === 'pool') fetchPoolLeads()
  else fetchLeads()
}

const handleSizeChange = () => { pagination.page = 1; fetchLeads() }
const handlePageChange = () => fetchLeads()
const handlePoolSizeChange = () => { poolPagination.page = 1; fetchPoolLeads() }
const handlePoolPageChange = () => fetchPoolLeads()

const resetFormData = () => {
  Object.assign(formData, {
    name: '', source: '', contact_name: '', contact_phone: '',
    contact_email: '', company_name: '', industry: '', description: '', owner_id: null
  })
  formRef.value?.resetFields()
}

const openNewDialog = () => {
  isEdit.value = false
  currentRow.value = null
  resetFormData()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  currentRow.value = row
  Object.assign(formData, {
    name: row.name, source: row.source, contact_name: row.contact_name,
    contact_phone: row.contact_phone, contact_email: row.contact_email || '',
    company_name: row.company_name || '', industry: row.industry || '',
    description: row.description || '', owner_id: row.owner_id || null
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await leadApi.update(currentRow.value.id, formData)
      ElMessage.success('编辑成功')
    } else {
      await leadApi.create(formData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchLeads()
  } catch (e) {
    ElMessage.error(isEdit.value ? '编辑失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

const openConvertDialog = (row) => {
  currentRow.value = row
  convertForm.customer_id = null
  convertForm.amount = 0
  convertForm.stage = '初步接触'
  convertDialogVisible.value = true
}

const handleConvert = async () => {
  if (!convertForm.customer_id) {
    ElMessage.warning('请选择或输入转化客户')
    return
  }
  convertLoading.value = true
  try {
    await leadApi.convert(currentRow.value.id, convertForm)
    ElMessage.success('转化成功')
    convertDialogVisible.value = false
    fetchLeads()
  } catch (e) {
    ElMessage.error('转化失败')
  } finally {
    convertLoading.value = false
  }
}

const openFollowDialog = (row) => {
  currentRow.value = row
  followForm.follow_type = ''
  followForm.content = ''
  followForm.next_plan = ''
  followFormRef.value?.resetFields()
  followDialogVisible.value = true
}

const handleFollow = async () => {
  const valid = await followFormRef.value.validate().catch(() => false)
  if (!valid) return
  followLoading.value = true
  try {
    await leadApi.follow(currentRow.value.id, followForm)
    ElMessage.success('跟进记录已添加')
    followDialogVisible.value = false
    fetchLeads()
  } catch (e) {
    ElMessage.error('跟进失败')
  } finally {
    followLoading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除线索"${row.name}"？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await leadApi.delete(row.id)
      ElMessage.success('删除成功')
      fetchLeads()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const claimLead = (row) => {
  ElMessageBox.confirm(`确认认领线索"${row.name}"？`, '认领确认').then(async () => {
    try {
      await leadApi.claim(row.id)
      ElMessage.success('认领成功')
      fetchPoolLeads()
    } catch (e) {
      ElMessage.error('认领失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchLeads()
  fetchUsers()
  fetchCustomers()
})
</script>

<style scoped>
.lead-list { padding: 16px; }
.search-card { margin-bottom: 12px; }
.table-header { margin-bottom: 12px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.convert-content .mt-20 { margin-top: 20px; }
</style>
