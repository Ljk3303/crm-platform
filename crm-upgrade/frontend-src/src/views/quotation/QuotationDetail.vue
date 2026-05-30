<template>
  <div class="quotation-detail" v-loading="loading">
    <!-- Print Header -->
    <div class="print-header no-print">
      <el-page-header @back="$router.back()" title="返回">
        <template #content>
          <span>报价详情 - {{ detail.quotation_no }}</span>
        </template>
      </el-page-header>
    </div>

    <div class="detail-content" v-if="detail.id">
      <!-- Header Section -->
      <div class="section header-section">
        <div class="header-title">报价单</div>
        <el-descriptions :column="3" border size="large">
          <el-descriptions-item label="报价单号">{{ detail.quotation_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ detail.owner }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(detail.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ formatDate(detail.valid_until) }}</el-descriptions-item>
          <el-descriptions-item label="税率">{{ detail.tax_rate }}%</el-descriptions-item>
          <el-descriptions-item label="折扣率" :span="3">{{ detail.discount_rate }}%</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- Customer Info -->
      <div class="section">
        <div class="section-title">客户信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="客户名称">{{ detail.customer_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detail.contact_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.contact_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系地址">{{ detail.customer_address || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- Items Table -->
      <div class="section">
        <div class="section-title">报价明细</div>
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-seq">序号</th>
              <th class="col-product">产品名称</th>
              <th class="col-spec">规格</th>
              <th class="col-unit">单位</th>
              <th class="col-qty">数量</th>
              <th class="col-price">单价</th>
              <th class="col-discount">折扣(%)</th>
              <th class="col-amount">金额</th>
              <th class="col-remark">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in detail.items" :key="idx">
              <td class="col-seq">{{ idx + 1 }}</td>
              <td class="col-product">{{ item.product_name || '-' }}</td>
              <td class="col-spec">{{ item.spec || '-' }}</td>
              <td class="col-unit">{{ item.unit || '-' }}</td>
              <td class="col-qty">{{ item.quantity }}</td>
              <td class="col-price">¥{{ formatMoney(item.unit_price) }}</td>
              <td class="col-discount">{{ item.discount || 0 }}</td>
              <td class="col-amount">¥{{ formatMoney(item.amount) }}</td>
              <td class="col-remark">{{ item.remark || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-block">
          <div class="total-row">
            <span>明细合计（小计）</span>
            <span>¥{{ formatMoney(subtotal) }}</span>
          </div>
          <div class="total-row">
            <span>折扣率</span>
            <span>{{ detail.discount_rate || 0 }}%</span>
          </div>
          <div class="total-row">
            <span>折扣金额</span>
            <span>¥{{ formatMoney(discountAmount) }}</span>
          </div>
          <div class="total-row">
            <span>税率</span>
            <span>{{ detail.tax_rate || 0 }}%</span>
          </div>
          <div class="total-row">
            <span>税额</span>
            <span>¥{{ formatMoney(taxAmount) }}</span>
          </div>
          <div class="total-row final">
            <span>最终金额</span>
            <span>¥{{ formatMoney(finalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Approval History -->
      <div class="section" v-if="detail.approval_history && detail.approval_history.length">
        <div class="section-title">审批历史</div>
        <el-timeline>
          <el-timeline-item
            v-for="item in detail.approval_history"
            :key="item.id"
            :timestamp="formatDate(item.created_at)"
            :type="approvalTimelineType(item.action)"
            placement="top"
          >
            <div class="timeline-content">
              <span class="timeline-user">{{ item.user_name }}</span>
              <span class="timeline-action">-
                <el-tag size="small" :type="actionTagType(item.action)">
                  {{ actionText(item.action) }}
                </el-tag>
              </span>
              <div v-if="item.comment" class="timeline-comment">备注: {{ item.comment }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- Description -->
      <div class="section" v-if="detail.description">
        <div class="section-title">备注说明</div>
        <div class="desc-text">{{ detail.description }}</div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-bar no-print" v-if="detail.id">
      <el-button
        v-if="detail.status === 'draft'"
        type="warning" @click="handleSubmit"
      >提交审批</el-button>
      <template v-if="detail.status === 'pending_approval'">
        <el-button type="success" @click="handleApprove">批准</el-button>
        <el-button type="danger" @click="handleReject">驳回</el-button>
      </template>
      <el-button
        v-if="detail.status === 'approved'"
        type="warning" @click="handleConvert"
      >转为订单</el-button>
      <el-button @click="handlePrint" class="no-print">打印</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as quotationApi from '@/api/quotation'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = reactive({
  id: null,
  quotation_no: '',
  status: '',
  owner: '',
  created_at: '',
  valid_until: '',
  discount_rate: 0,
  tax_rate: 0,
  customer_name: '',
  contact_name: '',
  contact_phone: '',
  customer_address: '',
  description: '',
  total_amount: 0,
  items: [],
  approval_history: []
})

const subtotal = computed(() => {
  return (detail.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
})

const discountAmount = computed(() => {
  return subtotal.value * (parseFloat(detail.discount_rate) / 100)
})

const afterDiscount = computed(() => {
  return subtotal.value - discountAmount.value
})

const taxAmount = computed(() => {
  return afterDiscount.value * (parseFloat(detail.tax_rate) / 100)
})

const finalAmount = computed(() => {
  return afterDiscount.value + taxAmount.value
})

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

function approvalTimelineType(action) {
  const map = { submit: 'primary', approve: 'success', reject: 'danger', convert: 'warning' }
  return map[action] || 'info'
}

function actionTagType(action) {
  const map = { submit: '', approve: 'success', reject: 'danger', convert: 'warning' }
  return map[action] || 'info'
}

function actionText(action) {
  const map = { submit: '提交审批', approve: '已批准', reject: '已驳回', convert: '已转订单' }
  return map[action] || action
}

async function fetchDetail() {
  loading.value = true
  try {
    const id = route.params.id
    const res = await quotationApi.getQuotationDetail(id)
    Object.assign(detail, res.data)
  } catch {
    ElMessage.error('获取报价详情失败')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  await ElMessageBox.confirm('确认提交报价审批?', '确认', { type: 'warning' })
  try {
    await quotationApi.submitQuotation(detail.id)
    ElMessage.success('提交成功')
    fetchDetail()
  } catch {
    ElMessage.error('提交失败')
  }
}

async function handleApprove() {
  await ElMessageBox.confirm('确认批准此报价?', '确认批准', { type: 'warning' })
  try {
    await quotationApi.approveQuotation(detail.id)
    ElMessage.success('已批准')
    fetchDetail()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleReject() {
  const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回', { type: 'warning' })
  try {
    await quotationApi.rejectQuotation(detail.id, { reason: value })
    ElMessage.success('已驳回')
    fetchDetail()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleConvert() {
  await ElMessageBox.confirm('确认将此报价转为订单?', '确认转换', { type: 'warning' })
  try {
    const res = await quotationApi.convertToOrder(detail.id)
    ElMessage.success('已转为订单')
    router.push(`/order/detail/${res.data.order_id}`)
  } catch {
    ElMessage.error('转换失败')
  }
}

function handlePrint() {
  window.print()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.quotation-detail {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

.print-header {
  margin-bottom: 16px;
}

.section {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
  color: #303133;
}

.header-title {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: 4px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.items-table th,
.items-table td {
  border: 1px solid #ebeef5;
  padding: 8px 6px;
  text-align: center;
}

.items-table th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.items-table .col-seq { width: 50px; }
.items-table .col-qty { width: 80px; text-align: right; }
.items-table .col-price,
.items-table .col-amount { width: 110px; text-align: right; }
.items-table .col-discount { width: 80px; text-align: right; }
.items-table .col-unit { width: 60px; }
.items-table .col-spec { width: 100px; }
.items-table .col-remark { min-width: 80px; }

.totals-block {
  margin-top: 16px;
  padding: 16px 20px;
  background: #fafafa;
  border-radius: 4px;
  max-width: 400px;
  margin-left: auto;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}

.total-row.final {
  font-size: 18px;
  font-weight: 700;
  color: #e6a23c;
  border-top: 2px solid #e6a23c;
  padding-top: 8px;
  margin-top: 4px;
}

.timeline-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline-user {
  font-weight: 600;
}

.timeline-comment {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  width: 100%;
}

.desc-text {
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.action-bar {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

@media print {
  .no-print {
    display: none !important;
  }
  .section {
    border: none;
    padding: 10px 0;
    page-break-inside: avoid;
  }
  .quotation-detail {
    padding: 20px;
  }
  .totals-block {
    background: transparent;
  }
}
</style>
