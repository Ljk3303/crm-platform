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
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
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
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <el-image
              v-if="getFirstImage(row.images)"
              :src="getFirstImage(row.images)"
              style="width:48px;height:48px;border-radius:6px;object-fit:cover"
              fit="cover"
              :preview-src-list="getImageList(row.images)"
              preview-teleported
            />
            <span v-else style="color:#c0c4cc;font-size:20px">📦</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="产品编码" min-width="100" />
        <el-table-column prop="name" label="产品名称" min-width="130" />
        <el-table-column prop="model" label="型号" min-width="100" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column label="销售价格" width="110" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.price) }}</template>
        </el-table-column>
        <el-table-column label="成本价格" width="110" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.cost_price) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' || row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 'active' || row.status === 1 ? '启用' : '停用' }}
            </el-tag>
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
      width="680px"
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
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">停用</el-radio>
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

        <!-- 产品图片 -->
        <el-form-item label="产品图片">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start">
            <div
              v-for="(img, idx) in imageList"
              :key="idx"
              style="position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;border:1px solid #e4e7ed"
            >
              <el-image :src="img" style="width:100%;height:100%" fit="cover" />
              <div
                @click="removeImage(idx)"
                style="position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px"
              >×</div>
            </div>
            <el-upload
              v-if="imageList.length < 6"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-success="onUploadSuccess"
              :on-error="onUploadError"
              accept="image/*"
            >
              <div style="width:100px;height:100px;border:1px dashed #dcdfe6;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#c0c4cc">
                <span style="font-size:28px">+</span>
                <span style="font-size:11px;margin-top:4px">上传图片</span>
              </div>
            </el-upload>
          </div>
          <div style="font-size:11px;color:#909399;margin-top:4px">支持jpg/png/gif/webp，单张不超过5MB，最多6张</div>
        </el-form-item>

        <el-form-item label="规格参数" prop="specification">
          <el-input v-model="form.specification" type="textarea" :rows="2" placeholder="请输入规格参数" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as productApi from '@/api/product'
import request from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const savingStrategy = ref(false)
const tableData = ref([])
const categoryOptions = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)
const imageList = ref([])

const strategyVisible = ref(false)
const strategyProduct = ref(null)
const strategies = ref([])

const uploadUrl = 'http://localhost:8081/api/upload'
const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
}))

const searchForm = reactive({ code: '', name: '', category: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  id: null, code: '', name: '', model: '', unit: '', category: '',
  price: 0, cost_price: 0, specification: '', description: '', status: 1, images: ''
})

const rules = {
  code: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

function formatMoney(val) {
  if (val === null || val === undefined) return '0.00'
  return parseFloat(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getFirstImage(images) {
  if (!images) return ''
  try { const arr = JSON.parse(images); return arr[0] || '' } catch { return images.startsWith('/') ? images : '' }
}

function getImageList(images) {
  if (!images) return []
  try { return JSON.parse(images) } catch { return images.startsWith('/') ? [images] : [] }
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) { ElMessage.error('只能上传图片文件'); return false }
  if (!isLt5M) { ElMessage.error('图片大小不能超过5MB'); return false }
  return true
}

function onUploadSuccess(res) {
  if (res.code === 200 && res.data?.url) {
    imageList.value.push(res.data.url)
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

function onUploadError() { ElMessage.error('上传失败，请检查网络') }

function removeImage(idx) { imageList.value.splice(idx, 1) }

async function fetchData() {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.pageSize, ...searchForm }
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null) delete params[k] })
    const res = await productApi.getProducts(params)
    tableData.value = res.records || res || []
    pagination.total = res.total || 0
    if (!categoryOptions.value.length) {
      const cats = new Set()
      tableData.value.forEach(p => { if (p.category) cats.add(p.category) })
      categoryOptions.value = Array.from(cats)
    }
  } catch { ElMessage.error('获取产品列表失败') } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; fetchData() }
function handleReset() { searchForm.code = ''; searchForm.name = ''; searchForm.category = ''; pagination.page = 1; fetchData() }

function resetForm() {
  form.id = null; form.code = ''; form.name = ''; form.model = ''; form.unit = ''
  form.category = ''; form.price = 0; form.cost_price = 0
  form.specification = ''; form.description = ''; form.status = 1
  imageList.value = []
}

function handleCreate() { dialogMode.value = 'create'; resetForm(); dialogVisible.value = true }

function handleEdit(row) {
  dialogMode.value = 'edit'
  form.id = row.id; form.code = row.code; form.name = row.name
  form.model = row.model || ''; form.unit = row.unit || ''; form.category = row.category || ''
  form.price = row.price || 0; form.cost_price = row.cost_price || 0
  form.specification = row.specification || ''; form.description = row.description || ''
  form.status = row.status || 1
  imageList.value = getImageList(row.images)
  dialogVisible.value = true
}

async function handleSubmitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...form, images: JSON.stringify(imageList.value), costPrice: form.cost_price }
    if (dialogMode.value === 'create') {
      await productApi.createProduct(payload)
      ElMessage.success('创建成功')
    } else {
      await productApi.updateProduct(form.id, payload)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch { ElMessage.error('保存失败') } finally { submitting.value = false }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除产品 "${row.name}"?`, '确认删除', { type: 'warning' })
  try { await productApi.deleteProduct(row.id); ElMessage.success('删除成功'); fetchData() } catch { ElMessage.error('删除失败') }
}

async function handlePriceStrategy(row) {
  strategyProduct.value = row
  try {
    const res = await productApi.getPriceStrategies(row.id)
    strategies.value = (res || []).map(s => ({
      id: s.id, customer_level: s.customer_level, price: s.price || 0, discount_rate: s.discount_rate || 0, remark: s.remark || ''
    }))
  } catch { strategies.value = [] }
  strategyVisible.value = true
}

function addStrategyRow() { strategies.value.push({ id: null, customer_level: 'normal', price: 0, discount_rate: 0, remark: '' }) }
function removeStrategyRow(index) { strategies.value.splice(index, 1) }

async function handleSaveStrategy() {
  savingStrategy.value = true
  try { await productApi.savePriceStrategies(strategyProduct.value.id, strategies.value); ElMessage.success('价格策略保存成功'); strategyVisible.value = false } catch { ElMessage.error('保存失败') } finally { savingStrategy.value = false }
}

onMounted(() => fetchData())
</script>

<style scoped>
.product-list { padding: 16px; }
</style>
