<template>
  <div class="crm-page-wrap">
    <div class="crm-page-hd">
      <div>
        <div class="crm-page-tit">线索管理</div>
        <div class="crm-page-sub">共 {{ pagination.total }} 条线索 · 公海 {{ poolPagination.total }} 条待认领</div>
      </div>
      <el-button type="primary" size="large" @click="openCreate"><el-icon style="margin-right:6px"><Plus /></el-icon>新建线索</el-button>
    </div>

    <!-- Tab切换 -->
    <el-tabs v-model="activeTab" @tab-change="onTabChange" class="lead-tabs">
      <el-tab-pane label="我的线索" name="all" />
      <el-tab-pane label="线索公海" name="pool" />
    </el-tabs>

    <!-- 搜索栏 -->
    <div class="crm-search-bar">
      <el-input v-model="searchForm.name" placeholder="搜索线索名称" clearable style="width:200px" @keyup.enter="fetchLeads" />
      <el-select v-model="searchForm.source" placeholder="来源" clearable style="width:130px" @change="fetchLeads">
        <el-option v-for="s in sources" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button type="primary" @click="fetchLeads">搜索</el-button>
    </div>

    <!-- 卡片列表 -->
    <div class="crm-lead-cards">
      <div v-for="row in activeTab === 'pool' ? poolData : tableData" :key="row.id" class="crm-lead-card">
        <div class="lc-hd">
          <div class="lc-name">{{ row.name }}</div>
          <el-tag :type="row.status===2?'success':row.status===0?'info':''" size="small">{{ row.status===2?'已转化':row.status===0?'无效':'跟进中' }}</el-tag>
        </div>
        <div class="lc-info">
          <span>{{ row.contact_name || '无联系人' }}</span> ·
          <span>{{ row.contact_phone || '无电话' }}</span> ·
          <span>来源: {{ row.source || '未知' }}</span>
        </div>
        <div class="lc-footer">
          <span style="font-size:12px;color:#94A3B8">跟进 {{ row.follow_count || 0 }} 次</span>
          <div style="display:flex;gap:6px">
            <el-button size="small" text type="primary" @click="openFollow(row)">跟进</el-button>
            <el-button size="small" text type="warning" @click="openConvert(row)" v-if="row.status!==2">转化</el-button>
            <el-button size="small" text type="primary" @click="$router.push(`/leads/${row.id}`)">详情</el-button>
          </div>
        </div>
      </div>
      <div v-if="!loading && !(activeTab==='pool'?poolData:tableData).length" class="empty-hint">暂无数据</div>
    </div>

    <!-- 分页 -->
    <div style="text-align:right;margin-top:20px">
      <el-pagination v-model:current-page="pagination.page" :page-size="pagination.pageSize" :total="pagination.total" layout="total, prev, pager, next" @current-change="fetchLeads" v-if="activeTab==='all'" />
      <el-pagination v-model:current-page="poolPagination.page" :page-size="poolPagination.pageSize" :total="poolPagination.total" layout="total, prev, pager, next" @current-change="fetchPool" v-else />
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑线索':'新建线索'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="来源" prop="source"><el-select v-model="formData.source" style="width:100%"><el-option v-for="s in sources" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item label="联系人" prop="contact_name"><el-input v-model="formData.contact_name" /></el-form-item>
        <el-form-item label="电话" prop="contact_phone"><el-input v-model="formData.contact_phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="formData.contact_email" /></el-form-item>
        <el-form-item label="公司"><el-input v-model="formData.company_name" /></el-form-item>
        <el-form-item label="行业"><el-input v-model="formData.industry" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 转化弹窗 -->
    <el-dialog v-model="convertDialogVisible" title="转化为客户" width="420px">
      <el-form label-width="80px">
        <el-form-item label="金额"><el-input-number v-model="convertForm.amount" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="阶段"><el-select v-model="convertForm.stage" style="width:100%"><el-option v-for="s in stages" :key="s" :label="s" :value="s" /></el-select></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="convertDialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="convertLoading" @click="handleConvert">确认转化</el-button>
      </template>
    </el-dialog>

    <!-- 跟进弹窗 -->
    <el-dialog v-model="followDialogVisible" title="添加跟进记录" width="420px">
      <el-form ref="followFormRef" :model="followForm" :rules="followRules" label-width="80px">
        <el-form-item label="方式" prop="follow_type"><el-select v-model="followForm.follow_type" style="width:100%"><el-option v-for="t in followTypes" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="followForm.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followDialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="followLoading" @click="handleFollow">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { leadApi } from '@/api/index'
import { ElMessage } from 'element-plus'

const sources = ['门店','小程序','地推','网站','转介','展会','活动']
const stages = ['初步接触','需求确认','方案报价','商务谈判','合同签约']
const followTypes = ['电话','上门拜访','微信沟通','邮件']

const activeTab = ref('all')
const loading = ref(false)
const tableData = ref([])
const poolData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const searchForm = reactive({ name:'', source:'' })
const pagination = reactive({ page:1, pageSize:20, total:0 })
const poolPagination = reactive({ page:1, pageSize:20, total:0 })

const formData = reactive({ name:'',source:'',contact_name:'',contact_phone:'',contact_email:'',company_name:'',industry:'',description:'' })
const formRules = { name:[{required:true,message:'请输入线索名称'}], source:[{required:true,message:'请选择来源'}] }

const convertDialogVisible = ref(false)
const convertLoading = ref(false)
const currentRow = ref(null)
const convertForm = reactive({ customer_id:null, amount:0, stage:'初步接触' })

const followDialogVisible = ref(false)
const followLoading = ref(false)
const followFormRef = ref(null)
const followForm = reactive({ follow_type:'', content:'' })
const followRules = { follow_type:[{required:true,message:'请选择跟进方式'}], content:[{required:true,message:'请输入跟进内容'}] }

const LD = [
  {id:1,name:'潜在客户A',source:'网站',contact_name:'张经理',contact_phone:'13800001111',company_name:'某科技公司',status:1,created_at:'2026-06-15'},
  {id:2,name:'潜在客户B',source:'展会',contact_name:'李总监',contact_phone:'13800002222',company_name:'某商贸公司',status:1,created_at:'2026-06-14'},
  {id:3,name:'潜在客户C',source:'转介',contact_name:'王老师',contact_phone:'13800003333',company_name:'某教育机构',status:1,created_at:'2026-06-13'},
]

async function fetchLeads() {
  loading.value = true
  try {
    const res = await leadApi.list({ page: pagination.page, pageSize: pagination.pageSize, name: searchForm.name, source: searchForm.source })
    tableData.value = res.records || LD
    pagination.total = res.total || LD.length
  } catch (e) { console.error('fetchLeads failed', e); tableData.value = LD; pagination.total = LD.length }
  finally { loading.value = false }
}

async function fetchPool() {
  try {
    const res = await leadApi.pool({ page: poolPagination.page, pageSize: poolPagination.pageSize })
    poolData.value = res.records || LD
    poolPagination.total = res.total || LD.length
  } catch (e) { console.error('fetchPool failed', e); poolData.value = LD; poolPagination.total = LD.length }
}

function onTabChange(tab) { if (tab === 'pool') fetchPool(); else fetchLeads() }

function openCreate() {
  Object.assign(formData, {name:'',source:'',contact_name:'',contact_phone:'',contact_email:'',company_name:'',industry:'',description:''})
  isEdit.value = false; dialogVisible.value = true
}

async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  submitLoading.value = true
  try {
    if (isEdit.value) await leadApi.update(formData)
    else await leadApi.create(formData)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchLeads()
  } catch (e) { ElMessage.error(e?.message || '保存失败') }
  finally { submitLoading.value = false }
}

function openConvert(row) { currentRow.value = row; convertForm.customer_id = row.convert_customer_id; convertDialogVisible.value = true }

async function handleConvert() {
  convertLoading.value = true
  try {
    const res = await leadApi.convert(currentRow.value.id)
    ElMessage.success('转化成功，已创建客户' + (res.customerId||''))
    convertDialogVisible.value = false
    fetchLeads()
  } catch (e) { ElMessage.error(e?.message || '转化失败') }
  finally { convertLoading.value = false }
}

function openFollow(row) { currentRow.value = row; followForm.follow_type = ''; followForm.content = ''; followDialogVisible.value = true }

async function handleFollow() {
  if (!followFormRef.value) return
  try { await followFormRef.value.validate() } catch { return }
  followLoading.value = true
  try {
    await leadApi.follow(currentRow.value.id, followForm)
    ElMessage.success('跟进已记录')
    followDialogVisible.value = false
    fetchLeads()
  } catch (e) { ElMessage.error(e?.message || '保存失败') }
  finally { followLoading.value = false }
}

onMounted(fetchLeads)
</script>

<style scoped>
.lead-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }
.lead-tabs :deep(.el-tabs__item) { font-weight: 500; font-size: 14px; }
.empty-hint { text-align:center; padding:40px; color:#94A3B8; grid-column:1/-1; }
</style>
