<template>
  <div class="product-list">
    <el-card shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="产品编码">
          <el-input v-model="searchForm.code" placeholder="请输入产品编码" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.name" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
            <el-option
              v-for="c in categoryOptions"
              :key="c" :label="c" :value="c"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <div style="margin-bottom: 16px">
        <el-button type="primary" @click="handleCreate">新增产品</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="code" label="产品编码" min-width="120" />
        <el-table-column prop="name" label="产品名称" min-width="140" />
        <el-table-column prop="model" label="型号" min-width="120" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="销售价格" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney(row.price) }}
          </template>
        </el-table-column>
        <el-table-column label="成本价格" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney(row.cost_price) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success" size="small">启用</el-tag>
            <el-tag v-else type="info" size="small">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handlePriceStrategy(row)">价格策略</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- New/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增产品' : '编辑产品'"
      width="650px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入产品编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="form.unit" placeholder="如：个、台、套" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-input v-model="form.category" placeholder="请输入分类" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="active">启用</el-radio>
                <el-radio value="inactive">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="销售价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本价格" prop="cost_price">
              <el-input-number v-model="form.cost_price" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格参数" prop="specification">
          <el-input v-model="form.specification" type="textarea" :rows="3" placeholder="请输入规格参数" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入产品描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- Price Strategy Dialog -->
    <el-dialog
      v-model="strategyVisible"
      title="价格策略"
      width="750px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <template v-if="strategyProduct">
        <div style="margin-bottom:12px;font-weight:600">
          产品: {{ strategyProduct.name }} ({{ strategyProduct.code }})
          基础价格: ¥{{ formatMoney(strategyProduct.price) }}
        </div>
      </template>
      <el-button size="small" type="primary" @click="addStrategyRow" style="margin-bottom:12px">添加策略</el-button>
      <el-table :data="strategies" border size="small">
        <el-table-column label="序号" width="50" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="客户等级" min-width="140">
          <template #default="{ row }">
            <el-select v-model="row.customer_level" placeholder="选择客户等级" size="small">
              <el-option label="普通客户" value="normal" />
              <el-option label="银牌客户" value="silver" />
              <el-option label="金牌客户" value="gold" />
              <el-option label="钻石客户" value="diamond" />
              <el-option label="VIP客户" value="vip" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.price" :min="0" :precision="2" size="small" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="折扣率(%)" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.discount_rate" :min="0" :max="100" :precision="1" size="small" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.remark" size="small" placeholder="备注" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="removeStrategyRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="strategyVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveStrategy" :loading="savingStrategy">保存策略</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as productApi from '@/api/product'

const loading = ref(false)
const submitting = ref(false)
const savingStrategy = ref(false)
const tableData = ref([])
const categoryOptions = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)

const strategyVisible = ref(false)
const strategyProduct = ref(null)
const strategies = ref([])

const searchForm = reactive({
  code: '',
  name: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  id: null,
  code: '',
  name: '',
  model: '',
  unit: '',
  category: '',
  price: 0,
  cost_price: 0,
  specification: '',
  description: '',
  status: 'active'
})

const rules = {
  code: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

function formatMoney(val) {
  if (val === null || val === undefined) return '0.00'
  return parseFloat(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null) delete params[k]
    })
    const res = await productApi.getProducts(params)
    tableData.value = res.data?.list || res.data || []
    pagination.total = res.data?.total || 0

    if (!categoryOptions.value.length) {
      const cats = new Set()
      tableData.value.forEach(p => { if (p.category) cats.add(p.category) })
      categoryOptions.value = Array.from(cats)
    }
  } catch {
    ElMessage.error('获取产品列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.code = ''
  searchForm.name = ''
  searchForm.category = ''
  pagination.page = 1
  fetchData()
}

function resetForm() {
  form.id = null
  form.code = ''
  form.name = ''
  form.model = ''
  form.unit = ''
  form.category = ''
  form.price = 0
  form.cost_price = 0
  form.specification = ''
  form.description = ''
  form.status = 'active'
}

function handleCreate() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogMode.value = 'edit'
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.model = row.model || ''
  form.unit = row.unit || ''
  form.category = row.category || ''
  form.price = row.price || 0
  form.cost_price = row.cost_price || 0
  form.specification = row.specification || ''
  form.description = row.description || ''
  form.status = row.status || 'active'
  dialogVisible.value = true
}

async function handleSubmitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await productApi.createProduct(form)
      ElMessage.success('创建成功')
    } else {
      await productApi.updateProduct(form.id, form)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除产品 "${row.name}"?`, '确认删除', { type: 'warning' })
  try {
    await productApi.deleteProduct(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handlePriceStrategy(row) {
  strategyProduct.value = row
  try {
    const res = await productApi.getPriceStrategies(row.id)
    strategies.value = (res.data || []).map(s => ({
      id: s.id,
      customer_level: s.customer_level,
      price: s.price || 0,
      discount_rate: s.discount_rate || 0,
      remark: s.remark || ''
    }))
  } catch {
    strategies.value = []
  }
  strategyVisible.value = true
}

function addStrategyRow() {
  strategies.value.push({
    id: null,
    customer_level: 'normal',
    price: 0,
    discount_rate: 0,
    remark: ''
  })
}

function removeStrategyRow(index) {
  strategies.value.splice(index, 1)
}

async function handleSaveStrategy() {
  savingStrategy.value = true
  try {
    await productApi.savePriceStrategies(strategyProduct.value.id, strategies.value)
    ElMessage.success('价格策略保存成功')
    strategyVisible.value = false
  } catch {
    ElMessage.error('保存失败')
  } finally {
    savingStrategy.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.product-list {
  padding: 16px;
}
</style>
