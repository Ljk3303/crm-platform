<template>
  <div class="approval-list">
    <div class="page-header">
      <h2>审批管理</h2>
      <el-button type="primary" @click="openSubmitDialog">
        <el-icon><Plus /></el-icon> 发起审批
      </el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="待审批" name="pending">
        <el-table :data="pendingList" v-loading="pendingLoading" stripe>
          <el-table-column label="业务类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getBusinessTypeTag(row.businessType)">
                {{ getBusinessTypeLabel(row.businessType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="业务信息" min-width="200">
            <template #default="{ row }">
              <span>{{ row.businessName || row.businessInfo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="submitterName" label="提交人" width="120" />
          <el-table-column label="审批内容" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.content || row.reason || row.title || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" width="170" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" @click="openApprove(row)">
                <el-icon><Check /></el-icon> 通过
              </el-button>
              <el-button type="danger" size="small" @click="openReject(row)">
                <el-icon><Close /></el-icon> 驳回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!pendingLoading && pendingList.length === 0" description="暂无待审批事项" />
      </el-tab-pane>

      <el-tab-pane label="已处理" name="processed">
        <el-table :data="processedList" v-loading="processedLoading" stripe>
          <el-table-column label="业务类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getBusinessTypeTag(row.businessType)">
                {{ getBusinessTypeLabel(row.businessType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="业务信息" min-width="200">
            <template #default="{ row }">
              <span>{{ row.businessName || row.businessInfo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="submitterName" label="提交人" width="120" />
          <el-table-column label="处理结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.result === 'approved' ? 'success' : 'danger'" size="small">
                {{ row.result === 'approved' ? '已通过' : '已驳回' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="审批意见" min-width="200" show-overflow-tooltip />
          <el-table-column prop="processedAt" label="处理时间" width="170" />
        </el-table>
        <el-empty v-if="!processedLoading && processedList.length === 0" description="暂无处理记录" />
      </el-tab-pane>

      <el-tab-pane label="我发起的" name="submitted">
        <el-table :data="submittedList" v-loading="submittedLoading" stripe>
          <el-table-column label="业务类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getBusinessTypeTag(row.businessType)">
                {{ getBusinessTypeLabel(row.businessType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="业务信息" min-width="200">
            <template #default="{ row }">
              <span>{{ row.businessName || row.businessInfo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="审批状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'"
                size="small"
              >
                {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已驳回' : '审批中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="审批内容" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.content || row.reason || row.title || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" width="170" />
        </el-table>
        <el-empty v-if="!submittedLoading && submittedList.length === 0" description="暂无发起记录" />
      </el-tab-pane>
    </el-tabs>

    <!-- Approve Dialog -->
    <el-dialog
      v-model="approveVisible"
      title="审批通过"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="业务信息">
          <span class="info-text">{{ currentApprove?.businessName || currentApprove?.businessInfo || '--' }}</span>
        </el-form-item>
        <el-form-item label="提交人">
          <span class="info-text">{{ currentApprove?.submitterName || '--' }}</span>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approveComment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="success" @click="handleApprove" :loading="approving">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- Reject Dialog -->
    <el-dialog
      v-model="rejectVisible"
      title="审批驳回"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="业务信息">
          <span class="info-text">{{ currentReject?.businessName || currentReject?.businessInfo || '--' }}</span>
        </el-form-item>
        <el-form-item label="提交人">
          <span class="info-text">{{ currentReject?.submitterName || '--' }}</span>
        </el-form-item>
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject" :loading="rejecting">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- Submit Dialog -->
    <el-dialog
      v-model="submitVisible"
      title="发起审批"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="submitForm" label-width="80px">
        <el-form-item label="审批类型" required>
          <el-select v-model="submitForm.flowType" placeholder="选择审批类型" style="width:100%">
            <el-option
              v-for="flow in flowOptions"
              :key="flow.value"
              :label="flow.label"
              :value="flow.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型" required>
          <el-select v-model="submitForm.businessType" placeholder="选择业务类型" style="width:100%">
            <el-option label="报价" value="quotation" />
            <el-option label="合同" value="contract" />
            <el-option label="费用" value="expense" />
            <el-option label="退款" value="refund" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务编号">
          <el-input v-model="submitForm.businessId" placeholder="关联业务编号" />
        </el-form-item>
        <el-form-item label="审批内容" required>
          <el-input
            v-model="submitForm.content"
            type="textarea"
            :rows="4"
            placeholder="请描述审批内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交审批</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Check, Close } from '@element-plus/icons-vue'
import { approvalApi } from '@/api/index'

const activeTab = ref('pending')

// Pending tab
const pendingList = ref([])
const pendingLoading = ref(false)

// Processed tab
const processedList = ref([])
const processedLoading = ref(false)
const AL = [{id:1,title:"销售订单审批#001",flow_name:"销售订单审批",status:"审批中",submitter_name:"张伟",created_at:"2026-06-15"},{id:2,title:"退款申请#001",flow_name:"退款申请审批",status:"已通过",submitter_name:"李明",created_at:"2026-06-14"},{id:3,title:"采购申请#003",flow_name:"采购申请",status:"已拒绝",submitter_name:"王芳",created_at:"2026-06-13"}]

// Submitted tab
const submittedList = ref([])
const submittedLoading = ref(false)

// Approve dialog
const approveVisible = ref(false)
const currentApprove = ref(null)
const approveComment = ref('')
const approving = ref(false)

// Reject dialog
const rejectVisible = ref(false)
const currentReject = ref(null)
const rejectReason = ref('')
const rejecting = ref(false)

// Submit dialog
const submitVisible = ref(false)
const submitForm = ref({ flowType: '', businessType: '', businessId: '', content: '' })
const submitting = ref(false)

const flowOptions = [
  { label: '通用审批', value: 'general' },
  { label: '报价审批', value: 'quotation' },
  { label: '合同审批', value: 'contract' },
  { label: '费用审批', value: 'expense' }
]

const businessTypeMap = {
  quotation: { label: '报价', tag: 'primary' },
  contract: { label: '合同', tag: 'warning' },
  expense: { label: '费用', tag: 'danger' },
  refund: { label: '退款', tag: 'info' },
  leave: { label: '请假', tag: '' },
  travel: { label: '出差', tag: 'success' },
  other: { label: '其他', tag: 'info' }
}

function getBusinessTypeLabel(type) {
  return businessTypeMap[type]?.label || type || '--'
}

function getBusinessTypeTag(type) {
  return businessTypeMap[type]?.tag || ''
}

async function fetchPending() {
  pendingLoading.value = true
  try {
    const res = await approvalApi.pending()
    pendingList.value = res.records || res || []
  } catch {
    ElMessage.error('加载待审批列表失败')
  } finally {
    pendingLoading.value = false
  }
}

async function fetchProcessed() {
  processedLoading.value = true
  try {
    const res = await approvalApi.flows()
    const allFlows = res.records || res || []
    processedList.value = allFlows.filter(
      item => item.result === 'approved' || item.result === 'rejected' || item.status === 'processed'
    )
  } catch {
    ElMessage.error('加载已处理列表失败')
  } finally {
    processedLoading.value = false
  }
}

async function fetchSubmitted() {
  submittedLoading.value = true
  try {
    const res = await approvalApi.flows()
    submittedList.value = res.records || res || []
  } catch {
    ElMessage.error('加载我发起的列表失败')
  } finally {
    submittedLoading.value = false
  }
}

function handleTabChange() {
  if (activeTab.value === 'pending') fetchPending()
  else if (activeTab.value === 'processed') fetchProcessed()
  else if (activeTab.value === 'submitted') fetchSubmitted()
}

function openApprove(row) {
  currentApprove.value = row
  approveComment.value = ''
  approveVisible.value = true
}

function openReject(row) {
  currentReject.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}

async function handleApprove() {
  approving.value = true
  try {
    await approvalApi.approve({
      flowId: currentApprove.value.id || currentApprove.value.flowId,
      comment: approveComment.value
    })
    ElMessage.success('审批通过')
    approveVisible.value = false
    fetchPending()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    approving.value = false
  }
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  rejecting.value = true
  try {
    await approvalApi.reject({
      flowId: currentReject.value.id || currentReject.value.flowId,
      reason: rejectReason.value
    })
    ElMessage.success('已驳回')
    rejectVisible.value = false
    fetchPending()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    rejecting.value = false
  }
}

function openSubmitDialog() {
  submitForm.value = { flowType: '', businessType: '', businessId: '', content: '' }
  submitVisible.value = true
}

async function handleSubmit() {
  if (!submitForm.value.flowType) {
    ElMessage.warning('请选择审批类型')
    return
  }
  if (!submitForm.value.businessType) {
    ElMessage.warning('请选择业务类型')
    return
  }
  if (!submitForm.value.content.trim()) {
    ElMessage.warning('请输入审批内容')
    return
  }
  submitting.value = true
  try {
    await approvalApi.submit({
      flowType: submitForm.value.flowType,
      businessType: submitForm.value.businessType,
      businessId: submitForm.value.businessId,
      content: submitForm.value.content
    })
    ElMessage.success('提交成功')
    submitVisible.value = false
    fetchSubmitted()
  } catch {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPending()
})
</script>

<style scoped>
.approval-list {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.info-text {
  color: #303133;
}
</style>
