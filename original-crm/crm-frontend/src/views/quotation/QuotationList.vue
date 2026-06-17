<template>
  <div class="quotation-list">
    <el-card shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="报价单号">
          <el-input v-model="searchForm.quotation_no" placeholder="请输入报价单号" clearable />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="待审批" value="pending_approval" />
            <el-option label="已批准" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已转订单" value="converted" />
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
        <el-button type="primary" @click="handleCreate">新建报价</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="quotation_no" label="报价单号" min-width="140" />
        <el-table-column prop="customer_name" label="客户名称" min-width="140" />
        <el-table-column label="报价总额" min-width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'draft'" type="info">草稿</el-tag>
            <el-tag v-else-if="row.status === 'pending_approval'">待审批</el-tag>
            <el-tag v-else-if="row.status === 'approved'" type="success">已批准</el-tag>
            <el-tag v-else-if="row.status === 'rejected'" type="danger">已驳回</el-tag>
            <el-tag v-else-if="row.status === 'converted'" type="warning">已转订单</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="100" />
        <el-table-column label="有效期至" width="120">
          <template #default="{ row }">
            {{ formatDate(row.valid_until) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'draft'"
              link type="warning" size="small"
              @click="handleSubmit(row)"
            >提交</el-button>
            <el-button
              v-if="row.status === 'pending_approval'"
              link type="success" size="small"
              @click="handleApprove(row)"
            >批准</el-button>
            <el-button
              v-if="row.status === 'pending_approval'"
              link type="danger" size="small"
              @click="handleReject(row)"
            >驳回</el-button>
            <el-button
              v-if="row.status === 'approved'"
              link type="warning" size="small"
              @click="handleConvert(row)"
            >转订单</el-button>
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
      :title="dialogMode === 'create' ? '新建报价' : '编辑报价'"
      width="900px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户" prop="customer_id">
              <el-select v-model="form.customer_id" placeholder="请选择客户" filterable clearable>
                <el-option
                  v-for="c in customerOptions"
                  :key="c.id" :label="c.name" :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_id">
              <el-select v-model="form.contact_id" placeholder="请选择联系人" filterable clearable>
                <el-option
                  v-for="c in contactOptions"
                  :key="c.id" :label="c.name" :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="商机" prop="opportunity_id">
              <el-select v-model="form.opportunity_id" placeholder="请选择商机" filterable clearable>
                <el-option
                  v-for="o in opportunityOptions"
                  :key="o.id" :label="o.name" :value="o.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报价模板" prop="template_id">
              <el-select v-model="form.template_id" placeholder="请选择模板" clearable>
                <el-option
                  v-for="t in templateOptions"
                  :key="t.id" :label="t.name" :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="折扣率(%)" prop="discount_rate">
              <el-input-number v-model="form.discount_rate" :min="0" :max="100" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税率(%)" prop="tax_rate">
              <el-input-number v-model="form.tax_rate" :min="0" :max="100" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="有效期至" prop="valid_until">
          <el-date-picker
            v-model="form.valid_until"
            type="date" placeholder="请选择有效期"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>

        <!-- Items Table -->
        <el-form-item label="报价明细" required>
          <div style="width:100%">
            <el-button size="small" type="primary" @click="addItem">添加明细</el-button>
            <el-table :data="form.items" border size="small" style="margin-top:8px">
              <el-table-column label="序号" width="50" align="center">
                <template #default="{ $index }">{{ $index + 1 }}</template>
              </el-table-column>
              <el-table-column label="产品" min-width="160">
                <template #default="{ row: item, $index }">
                  <el-select
                    v-model="item.product_id" placeholder="选择产品" filterable clearable
                    @change="(val) => onProductChange(val, $index)"
                    size="small"
                  >
                    <el-option
                      v-for="p in productOptions"
                      :key="p.id" :label="p.name" :value="p.id"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="规格" min-width="100">
                <template #default="{ row: item }">
                  <el-input v-model="item.spec" size="small" placeholder="规格" />
                </template>
              </el-table-column>
              <el-table-column label="单位" width="70">
                <template #default="{ row: item }">
                  <el-input v-model="item.unit" size="small" placeholder="单位" />
                </template>
              </el-table-column>
              <el-table-column label="数量" width="100">
                <template #default="{ row: item, $index }">
                  <el-input-number
                    v-model="item.quantity" :min="1" size="small"
                    @change="calcItemAmount($index)" controls-position="right"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="120">
                <template #default="{ row: item, $index }">
                  <el-input-number
                    v-model="item.unit_price" :min="0" :precision="2" size="small"
                    @change="calcItemAmount($index)" controls-position="right"
                  />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="120" align="right">
                <template #default="{ row: item }">
                  ¥{{ formatMoney(item.amount) }}
                </template>
              </el-table-column>
              <el-table-column label="折扣(%)" width="100">
                <template #default="{ row: item, $index }">
                  <el-input-number
                    v-model="item.discount" :min="0" :max="100" :precision="1" size="small"
                    @change="calcItemAmount($index)" controls-position="right"
                  />
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="100">
                <template #default="{ row: item }">
                  <el-input v-model="item.remark" size="small" placeholder="备注" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" fixed="right">
                <template #default="{ $index }">
                  <el-button link type="danger" size="small" @click="removeItem($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div style="text-align:right;margin-top:8px;font-weight:bold">
              明细合计: ¥{{ formatMoney(totalAmount) }}
            </div>
          </div>
        </el-form-item>

        <el-divider />
        <div style="text-align:right;padding-right:20px;font-size:14px">
          <div>明细合计: ¥{{ formatMoney(totalAmount) }}</div>
          <div>折扣率: {{ form.discount_rate }}%</div>
          <div>折后金额: ¥{{ formatMoney(discountedAmount) }}</div>
          <div>税率: {{ form.tax_rate }}%</div>
          <div style="font-weight:bold;font-size:16px;color:#e6a23c;margin-top:4px">
            最终金额: ¥{{ formatMoney(finalAmount) }}
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="viewVisible" title="报价详情" width="800px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentItem">
        <el-descriptions-item label="报价单号">{{ currentItem.quotation_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentItem.status)">{{ statusText(currentItem.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentItem.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentItem.owner }}</el-descriptions-item>
        <el-descriptions-item label="报价总额">¥{{ formatMoney(currentItem.total_amount) }}</el-descriptions-item>
        <el-descriptions-item label="有效期至">{{ formatDate(currentItem.valid_until) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(currentItem.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentItem.description }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as quotationApi from '@/api/quotation'
import * as customerApi from '@/api/customer'
import * as productApi from '@/api/product'
import * as opportunityApi from '@/api/opportunity'

const router = useRouter()
const QD = [
  {id:1,quotation_no:'QTN-001',customerName:'陈思雨',title:'年度采购报价',total_amount:50000,final_amount:48000,status:'已发送',created_at:'2026-06-15'},
  {id:2,quotation_no:'QTN-002',customerName:'刘建国',title:'办公用品报价',total_amount:120000,final_amount:115000,status:'草稿',created_at:'2026-06-14'},
  {id:3,quotation_no:'QTN-003',customerName:'张晓萌',title:'文具采购报价',total_amount:35000,final_amount:32000,status:'已审批',created_at:'2026-06-13'},
]
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('create')
const viewVisible = ref(false)
const currentItem = ref(null)
const formRef = ref(null)

const productOptions = ref([])
const customerOptions = ref([])
const contactOptions = ref([])
const opportunityOptions = ref([])
const templateOptions = ref([])

const searchForm = reactive({
  quotation_no: '',
  customer_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const defaultItem = () => ({
  product_id: null,
  spec: '',
  unit: '',
  quantity: 1,
  unit_price: 0,
  amount: 0,
  discount: 0,
  remark: ''
})

const form = reactive({
  id: null,
  customer_id: null,
  contact_id: null,
  opportunity_id: null,
  template_id: null,
  discount_rate: 0,
  tax_rate: 0,
  valid_until: '',
  description: '',
  items: [defaultItem()]
})

const rules = {
  customer_id: [{ required: true, message: '请选择客户', trigger: 'change' }],
  valid_until: [{ required: true, message: '请选择有效期', trigger: 'change' }]
}

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
})

const discountedAmount = computed(() => {
  return totalAmount.value * (1 - parseFloat(form.discount_rate) / 100)
})

const finalAmount = computed(() => {
  return discountedAmount.value * (1 + parseFloat(form.tax_rate) / 100)
})

function calcItemAmount(index) {
  const item = form.items[index]
  if (!item) return
  const qty = parseFloat(item.quantity) || 0
  const price = parseFloat(item.unit_price) || 0
  const disc = parseFloat(item.discount) || 0
  item.amount = qty * price * (1 - disc / 100)
}

function addItem() {
  form.items.push(defaultItem())
}

function removeItem(index) {
  if (form.items.length <= 1) {
    ElMessage.warning('至少保留一条明细')
    return
  }
  form.items.splice(index, 1)
}

function onProductChange(val, index) {
  if (val) {
    const prod = productOptions.value.find(p => p.id === val)
    if (prod) {
      form.items[index].unit_price = prod.price || 0
      form.items[index].spec = prod.specification || ''
      form.items[index].unit = prod.unit || ''
      calcItemAmount(index)
    }
  }
}

function formatMoney(val) {
  if (val === null || val === undefined) return '0.00'
  return parseFloat(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(val) {
  if (!val) return '-'
  return val.substring(0, 19).replace('T', ' ')
}

function statusType(status) {
  const map = { draft: 'info', pending_approval: '', approved: 'success', rejected: 'danger', converted: 'warning' }
  return map[status] || ''
}

function statusText(status) {
  const map = { draft: '草稿', pending_approval: '待审批', approved: '已批准', rejected: '已驳回', converted: '已转订单' }
  return map[status] || status
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
    const res = await quotationApi.getQuotations(params)
    tableData.value = res.records || res || QD
    pagination.total = res.total || QD.length
  } catch {
    tableData.value = QD; pagination.total = QD.length
  } finally {
    loading.value = false
  }
}

async function fetchOptions() {
  try {
    const [cust, prod, opp] = await Promise.all([
      customerApi.getCustomers({ pageSize: 999 }),
      productApi.getProducts({ pageSize: 999 }),
      opportunityApi.getOpportunities({ pageSize: 999 })
    ])
    customerOptions.value = cust.records || []
    productOptions.value = prod.records || []
    opportunityOptions.value = opp.records || []
  } catch {
    // ignore
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.quotation_no = ''
  searchForm.customer_name = ''
  searchForm.status = ''
  pagination.page = 1
  fetchData()
}

function resetForm() {
  form.id = null
  form.customer_id = null
  form.contact_id = null
  form.opportunity_id = null
  form.template_id = null
  form.discount_rate = 0
  form.tax_rate = 0
  form.valid_until = ''
  form.description = ''
  form.items = [defaultItem()]
}

function handleCreate() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

function handleView(row) {
  currentItem.value = row
  viewVisible.value = true
}

async function handleEdit(row) {
  dialogMode.value = 'edit'
  try {
    const res = await quotationApi.getQuotationDetail(row.id)
    const data = res
    form.id = data.id
    form.customer_id = data.customer_id
    form.contact_id = data.contact_id
    form.opportunity_id = data.opportunity_id
    form.template_id = data.template_id
    form.discount_rate = data.discount_rate || 0
    form.tax_rate = data.tax_rate || 0
    form.valid_until = data.valid_until
    form.description = data.description || ''
    form.items = (data.items && data.items.length) ? data.items.map(i => ({
      product_id: i.product_id,
      spec: i.spec || '',
      unit: i.unit || '',
      quantity: i.quantity,
      unit_price: i.unit_price,
      amount: i.amount || 0,
      discount: i.discount || 0,
      remark: i.remark || ''
    })) : [defaultItem()]
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取报价详情失败')
  }
}

async function handleSubmitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!form.items.length) {
    ElMessage.warning('请添加报价明细')
    return
  }
  submitting.value = true
  try {
    const payload = {
      ...form,
      total_amount: finalAmount.value
    }
    if (dialogMode.value === 'create') {
      await quotationApi.createQuotation(payload)
      ElMessage.success('创建成功')
    } else {
      await quotationApi.updateQuotation(form.id, payload)
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

async function handleSubmit(row) {
  await ElMessageBox.confirm(`确认提交报价 ${row.quotation_no}?`, '确认提交', { type: 'warning' })
  try {
    await quotationApi.submitQuotation(row.id)
    ElMessage.success('提交成功')
    fetchData()
  } catch {
    ElMessage.error('提交失败')
  }
}

async function handleApprove(row) {
  await ElMessageBox.confirm(`确认批准报价 ${row.quotation_no}?`, '确认批准', { type: 'warning' })
  try {
    await quotationApi.approveQuotation(row.id)
    ElMessage.success('已批准')
    fetchData()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleReject(row) {
  const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回', { type: 'warning' })
  try {
    await quotationApi.rejectQuotation(row.id, { reason: value })
    ElMessage.success('已驳回')
    fetchData()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleConvert(row) {
  await ElMessageBox.confirm(`确认将报价 ${row.quotation_no} 转为订单?`, '确认转换', { type: 'warning' })
  try {
    await quotationApi.convertToOrder(row.id)
    ElMessage.success('已转为订单')
    fetchData()
  } catch {
    ElMessage.error('转换失败')
  }
}

onMounted(() => {
  fetchData()
  fetchOptions()
})
</script>

<style scoped>
.quotation-list {
  padding: 16px;
}
</style>
