<template>
  <div class="lead-detail">
    <!-- Header -->
    <div class="page-header">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <div v-if="leadData.id" class="header-actions">
        <el-button
          v-if="leadData.status !== '已转化'"
          type="warning"
          @click="openConvertDialog"
        >
          转化
        </el-button>
        <el-button type="success" @click="openFollowDialog">
          跟进
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading" class="info-card" shadow="never">
      <template #header>
        <span class="card-title">线索信息 - {{ leadData.name }}</span>
        <el-tag
          :type="statusTagType(leadData.status)"
          size="small"
          style="margin-left: 12px"
        >
          {{ leadData.status }}
        </el-tag>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="线索名称">{{ leadData.name }}</el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ leadData.company_name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ leadData.contact_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ leadData.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="联系邮箱">{{ leadData.contact_email }}</el-descriptions-item>
        <el-descriptions-item label="来源">
          <el-tag size="small">{{ leadData.source }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="行业">{{ leadData.industry }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ leadData.owner_name }}</el-descriptions-item>
        <el-descriptions-item label="跟进次数">{{ leadData.follow_count }}</el-descriptions-item>
        <el-descriptions-item label="最近跟进">{{ leadData.last_follow_at || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ leadData.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ leadData.updated_at }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ leadData.description || '暂无描述' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Associated Customer & Opportunity -->
    <el-card v-if="leadData.customer || leadData.opportunity" class="relation-card" shadow="never">
      <template #header><span class="card-title">关联信息</span></template>
      <el-row :gutter="20">
        <el-col :span="12" v-if="leadData.customer">
          <el-descriptions title="关联客户" :column="1" border size="small">
            <el-descriptions-item label="客户名称">
              <el-link type="primary" @click="goToCustomer(leadData.customer.id)">
                {{ leadData.customer.name }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="行业">{{ leadData.customer.industry || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
        <el-col :span="12" v-if="leadData.opportunity">
          <el-descriptions title="关联商机" :column="1" border size="small">
            <el-descriptions-item label="商机名称">
              <el-link type="primary" @click="goToOpportunity(leadData.opportunity.id)">
                {{ leadData.opportunity.name }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="金额">{{ formatMoney(leadData.opportunity.amount) }}</el-descriptions-item>
            <el-descriptions-item label="阶段">{{ leadData.opportunity.stage }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <!-- Follow-up Timeline -->
    <el-card class="timeline-card" shadow="never">
      <template #header>
        <span class="card-title">跟进记录</span>
      </template>
      <div v-if="followList.length === 0" class="empty-state">
        <el-empty description="暂无跟进记录" />
      </div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="item in followList"
          :key="item.id"
          :timestamp="item.created_at"
          placement="top"
          :type="followTypeColor(item.follow_type)"
        >
          <el-card shadow="hover" class="follow-card">
            <div class="follow-header">
              <el-tag size="small">{{ item.follow_type }}</el-tag>
              <span class="follow-user">{{ item.created_by_name }}</span>
            </div>
            <div class="follow-content">{{ item.content }}</div>
            <div v-if="item.next_plan" class="follow-next">
              <el-text type="info" size="small">下一步计划：{{ item.next_plan }}</el-text>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- Convert Dialog -->
    <el-dialog
      v-model="convertDialogVisible"
      title="线索转化"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>
          确认将线索 <strong>{{ leadData.name }}</strong> 转化为客户和商机？
        </template>
      </el-alert>
      <el-form class="mt-20" label-width="100px">
        <el-form-item label="转化客户">
          <el-select v-model="convertForm.customer_id" placeholder="选择已有客户或新建" filterable allow-create style="width: 100%">
            <el-option
              v-for="c in customerList"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预计金额">
          <el-input-number v-model="convertForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="商机阶段">
          <el-select v-model="convertForm.stage" placeholder="选择阶段" style="width: 100%">
            <el-option label="初步接触" value="初步接触" />
            <el-option label="需求分析" value="需求分析" />
            <el-option label="方案报价" value="方案报价" />
            <el-option label="谈判" value="谈判" />
          </el-select>
        </el-form-item>
      </el-form>
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
          <el-select v-model="followForm.follow_type" placeholder="请选择跟进方式" style="width: 100%">
            <el-option label="电话" value="电话" />
            <el-option label="邮件" value="邮件" />
            <el-option label="拜访" value="拜访" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容" prop="content">
          <el-input v-model="followForm.content" type="textarea" :rows="4" placeholder="请输入跟进内容" />
        </el-form-item>
        <el-form-item label="下一步计划">
          <el-input v-model="followForm.next_plan" type="textarea" :rows="2" placeholder="请输入下一步计划" />
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
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { leadApi, customerApi } from '@/api/index'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const loading = ref(false)
const leadData = reactive({
  id: null, name: '', company_name: '', contact_name: '', contact_phone: '',
  contact_email: '', source: '', industry: '', owner_name: '', follow_count: 0,
  last_follow_at: '', created_at: '', updated_at: '', description: '', status: '',
  customer: null, opportunity: null
})
const followList = ref([])
const customerList = ref([])

const convertDialogVisible = ref(false)
const convertLoading = ref(false)
const convertForm = reactive({ customer_id: null, amount: 0, stage: '初步接触' })

const followDialogVisible = ref(false)
const followLoading = ref(false)
const followFormRef = ref(null)
const followForm = reactive({ follow_type: '', content: '', next_plan: '' })
const followRules = {
  follow_type: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
}

const goBack = () => router.back()
const goToCustomer = (cid) => router.push(`/customer/${cid}`)
const goToOpportunity = (oid) => router.push(`/opportunity/${oid}`)

const statusTagType = (status) => {
  const map = { '新建': '', '跟进中': 'warning', '已转化': 'success', '无效': 'info' }
  return map[status] || ''
}

const followTypeColor = (type) => {
  const map = { '电话': 'primary', '邮件': 'success', '拜访': 'warning', '其他': 'info' }
  return map[type] || ''
}

const formatMoney = (val) => {
  if (val == null) return '-'
  return '¥' + Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await leadApi.detail(id)
    Object.assign(leadData, res || null)
  } catch (e) {
    ElMessage.error('获取线索详情失败')
  } finally {
    loading.value = false
  }
}

const fetchFollows = async () => {
  try {
    const res = await leadApi.follows(id)
    followList.value = res.records || res || []
  } catch (e) { /* ignore */ }
}

const fetchCustomers = async () => {
  try {
    const res = await customerApi.list({ pageSize: 1000 })
    customerList.value = res.records || res || []
  } catch (e) { /* ignore */ }
}

const openConvertDialog = () => {
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
    await leadApi.convert(id, convertForm)
    ElMessage.success('转化成功')
    convertDialogVisible.value = false
    fetchDetail()
  } catch (e) {
    ElMessage.error('转化失败')
  } finally {
    convertLoading.value = false
  }
}

const openFollowDialog = () => {
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
    await leadApi.follow(id, followForm)
    ElMessage.success('跟进记录已添加')
    followDialogVisible.value = false
    fetchFollows()
    fetchDetail()
  } catch (e) {
    ElMessage.error('跟进失败')
  } finally {
    followLoading.value = false
  }
}

onMounted(() => {
  fetchDetail()
  fetchFollows()
  fetchCustomers()
})
</script>

<style scoped>
.lead-detail { padding: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.header-actions { display: flex; gap: 8px; }
.card-title { font-size: 16px; font-weight: 600; }
.info-card { margin-bottom: 12px; }
.relation-card { margin-bottom: 12px; }
.timeline-card { margin-bottom: 12px; }
.follow-card { max-width: 520px; }
.follow-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.follow-user { font-size: 13px; color: #909399; }
.follow-content { line-height: 1.6; white-space: pre-wrap; }
.follow-next { margin-top: 8px; }
.empty-state { padding: 24px 0; }
.mt-20 { margin-top: 20px; }
</style>
