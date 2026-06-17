<template>
  <div class="opportunity-list">
    <!-- Search Bar -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="商机名称">
          <el-input v-model="searchForm.name" placeholder="请输入商机名称" clearable />
        </el-form-item>
        <el-form-item label="阶段">
          <el-select v-model="searchForm.stage" placeholder="全部" clearable>
            <el-option v-for="s in stages" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- View Toggle -->
    <el-card class="main-card" shadow="never">
      <div class="toolbar">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="list">列表视图</el-radio-button>
          <el-radio-button value="kanban">看板视图</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="openNewDialog">新建商机</el-button>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list'" v-loading="loading">
        <el-table :data="tableData" stripe border>
          <el-table-column prop="name" label="商机名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="customer_name" label="客户名称" min-width="150" show-overflow-tooltip />
          <el-table-column label="预计金额" min-width="130" align="right">
            <template #default="{ row }">
              <span class="amount">{{ formatMoney(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stage" label="阶段" min-width="120">
            <template #default="{ row }">
              <el-tag :type="stageTagType(row.stage)" size="small">{{ row.stage }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="probability" label="概率" min-width="80" align="center">
            <template #default="{ row }">
              <span>{{ row.probability }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="expected_close_date" label="预计成交日" min-width="130" />
          <el-table-column prop="owner_name" label="负责人" min-width="100" />
          <el-table-column label="操作" min-width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="small" @click="openStageDialog(row)">变更阶段</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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
      </div>

      <!-- Kanban View -->
      <div v-else v-loading="loading" class="kanban-container">
        <el-row :gutter="12">
          <el-col :span="4" v-for="stage in stages" :key="stage">
            <div
              class="kanban-column"
              @dragover.prevent
              @drop="handleDrop($event, stage)"
            >
              <div class="kanban-header">
                <span>{{ stage }}</span>
                <el-tag size="small" round>{{ getStageCount(stage) }}</el-tag>
              </div>
              <div class="kanban-cards">
                <div
                  v-for="card in getStageCards(stage)"
                  :key="card.id"
                  class="kanban-card"
                  draggable="true"
                  @dragstart="handleDragStart($event, card)"
                >
                  <div class="card-name">{{ card.name }}</div>
                  <div class="card-info">
                    <span>{{ card.customer_name }}</span>
                    <span class="card-amount">{{ formatMoney(card.amount) }}</span>
                  </div>
                  <div class="card-footer">
                    <el-tag :type="stageTagType(stage)" size="small">{{ stage }}</el-tag>
                    <span>{{ card.owner_name }}</span>
                  </div>
                </div>
                <div v-if="getStageCards(stage).length === 0" class="kanban-empty">
                  暂无商机
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- New/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商机' : '新建商机'"
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商机名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入商机名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联客户" prop="customer_id">
              <el-select v-model="formData.customer_id" placeholder="请选择客户" filterable>
                <el-option
                  v-for="c in customerList"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联联系人">
              <el-select v-model="formData.contact_id" placeholder="请选择联系人" filterable>
                <el-option
                  v-for="ct in contactList"
                  :key="ct.id"
                  :label="ct.name"
                  :value="ct.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计金额" prop="amount">
              <el-input-number
                v-model="formData.amount"
                :min="0"
                :precision="2"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计成交日期" prop="expected_close_date">
              <el-date-picker
                v-model="formData.expected_close_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="阶段" prop="stage">
              <el-select v-model="formData.stage" placeholder="请选择阶段">
                <el-option v-for="s in stages" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="赢单概率" prop="probability">
          <el-slider
            v-model="formData.probability"
            :min="0"
            :max="100"
            :step="5"
            show-input
            style="width: 100%"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="formData.owner_id" placeholder="请选择负责人" filterable>
                <el-option
                  v-for="u in userList"
                  :key="u.id"
                  :label="u.name"
                  :value="u.id"
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

    <!-- Stage Change Dialog -->
    <el-dialog
      v-model="stageDialogVisible"
      title="变更阶段"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="新阶段">
          <el-select v-model="stageForm.stage" placeholder="选择新阶段" style="width: 100%">
            <el-option v-for="s in stages" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stageForm.remark" type="textarea" :rows="2" placeholder="变更备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStageChange" :loading="stageLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { opportunityApi, customerApi, userApi } from '@/api/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const stages = ['初步接触', '需求分析', '方案报价', '谈判', '赢单', '输单']
const OD = [
  {id:1,name:'陈思雨年度美妆采购',customer_id:1,amount:50000,stage:'初步接触',probability:60,expected_close_date:'2026-07-15',created_at:'2026-06-10'},
  {id:2,name:'李佳琪品牌合作',customer_id:3,amount:200000,stage:'方案报价',probability:50,expected_close_date:'2026-08-01',created_at:'2026-06-08'},
  {id:3,name:'刘建国办公采购',customer_id:2,amount:120000,stage:'商务谈判',probability:70,expected_close_date:'2026-07-20',created_at:'2026-06-05'},
  {id:4,name:'张晓萌文具批发',customer_id:4,amount:35000,stage:'初步接触',probability:40,expected_close_date:'2026-08-10',created_at:'2026-06-12'},
]
const viewMode = ref('list')

const searchForm = reactive({ name: '', stage: '', customer_name: '' })
const loading = ref(false)
const tableData = ref([])
const customerList = ref([])
const contactList = ref([])
const userList = ref([])

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRow = ref(null)
const submitLoading = ref(false)
const formRef = ref(null)

const formData = reactive({
  name: '', customer_id: null, contact_id: null, amount: 0,
  expected_close_date: '', stage: '初步接触', probability: 50,
  description: '', owner_id: null
})

const formRules = {
  name: [{ required: true, message: '请输入商机名称', trigger: 'blur' }],
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  amount: [{ required: true, message: '请输入预计金额', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择阶段', trigger: 'change' }],
  expected_close_date: [{ required: true, message: '请选择预计成交日期', trigger: 'change' }],
  probability: [{ required: true, message: '请输入赢单概率', trigger: 'change' }]
}

// Stage dialog
const stageDialogVisible = ref(false)
const stageLoading = ref(false)
const stageForm = reactive({ stage: '', remark: '' })

// Drag state
const draggedCard = ref(null)

const formatMoney = (val) => {
  if (val == null) return '-'
  return '¥' + Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const stageTagType = (stage) => {
  const map = {
    '初步接触': '', '需求分析': 'warning', '方案报价': 'warning',
    '谈判': 'primary', '赢单': 'success', '输单': 'danger'
  }
  return map[stage] || ''
}

const getStageCards = (stage) => tableData.value.filter(item => item.stage === stage)
const getStageCount = (stage) => getStageCards(stage).length

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: viewMode.value === 'kanban' ? 500 : pagination.pageSize,
      name: searchForm.name,
      stage: searchForm.stage,
      customer_name: searchForm.customer_name
    }
    const res = await opportunityApi.list(params)
    tableData.value = res.records || res || []
    pagination.total = res.total || 0
  } catch (e) {
    tableData.value = OD; pagination.total = OD.length
  } finally {
    loading.value = false
  }
}

const fetchCustomers = async () => {
  try {
    const res = await customerApi.list({ pageSize: 1000 })
    customerList.value = res.records || res || []
  } catch (e) { /* ignore */ }
}

const fetchUsers = async () => {
  try {
    const res = await userApi.list()
    userList.value = res || []
  } catch (e) { /* ignore */ }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.name = ''; searchForm.stage = ''; searchForm.customer_name = ''; pagination.page = 1; fetchData() }
const handleSizeChange = () => { pagination.page = 1; fetchData() }
const handlePageChange = () => fetchData()

const resetForm = () => {
  Object.assign(formData, {
    name: '', customer_id: null, contact_id: null, amount: 0,
    expected_close_date: '', stage: '初步接触', probability: 50,
    description: '', owner_id: null
  })
  formRef.value?.resetFields()
}

const openNewDialog = () => {
  isEdit.value = false
  currentRow.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  currentRow.value = row
  Object.assign(formData, {
    name: row.name, customer_id: row.customer_id, contact_id: row.contact_id,
    amount: row.amount, expected_close_date: row.expected_close_date,
    stage: row.stage, probability: row.probability,
    description: row.description || '', owner_id: row.owner_id
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await opportunityApi.update(currentRow.value.id, formData)
      ElMessage.success('编辑成功')
    } else {
      await opportunityApi.create(formData)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    ElMessage.error(isEdit.value ? '编辑失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

const openStageDialog = (row) => {
  currentRow.value = row
  stageForm.stage = row.stage
  stageForm.remark = ''
  stageDialogVisible.value = true
}

const handleStageChange = async () => {
  if (!stageForm.stage) { ElMessage.warning('请选择阶段'); return }
  stageLoading.value = true
  try {
    await opportunityApi.changeStage(currentRow.value.id, stageForm)
    ElMessage.success('阶段变更成功')
    stageDialogVisible.value = false
    fetchData()
  } catch (e) {
    ElMessage.error('阶段变更失败')
  } finally {
    stageLoading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除商机"${row.name}"？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await opportunityApi.delete(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// Drag and Drop
const handleDragStart = (event, card) => {
  draggedCard.value = card
  event.dataTransfer.effectAllowed = 'move'
}

const handleDrop = async (event, targetStage) => {
  if (!draggedCard.value) return
  const card = draggedCard.value
  if (card.stage === targetStage) return
  try {
    await opportunityApi.changeStage(card.id, { stage: targetStage, remark: '看板拖拽变更' })
    ElMessage.success(`商机"${card.name}"已移至${targetStage}`)
    fetchData()
  } catch (e) {
    ElMessage.error('移动失败')
  }
  draggedCard.value = null
}

onMounted(() => {
  fetchData()
  fetchCustomers()
  fetchUsers()
})
</script>

<style scoped>
.opportunity-list { padding: 16px; }
.search-card { margin-bottom: 12px; }
.main-card { margin-bottom: 12px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.amount { font-weight: 600; color: #e6a23c; }

.kanban-container { min-height: 400px; overflow-x: auto; }
.kanban-column {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px;
  min-height: 300px;
}
.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 2px solid #e4e7ed;
  margin-bottom: 8px;
}
.kanban-cards { min-height: 60px; }
.kanban-card {
  background: #fff;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}
.kanban-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
.kanban-card:active { cursor: grabbing; }
.card-name { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
.card-info { display: flex; justify-content: space-between; font-size: 12px; color: #909399; margin-bottom: 6px; }
.card-amount { color: #e6a23c; font-weight: 500; }
.card-footer { display: flex; justify-content: space-between; align-items: center; }
.kanban-empty { text-align: center; color: #c0c4cc; font-size: 13px; padding: 20px 0; }
</style>
