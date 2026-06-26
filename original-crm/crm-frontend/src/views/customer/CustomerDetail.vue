<template>
  <div class="customer-detail">
    <button class="back-btn" @click="$router.push('/customers')">
      <el-icon :size="16"><ArrowLeft /></el-icon><span>返回客户列表</span>
    </button>

    <el-skeleton :loading="loading" animated :count="3" v-if="loading" />
    <el-empty v-else-if="!customer" description="未找到客户信息" />

    <template v-else>
      <div class="detail-header">
        <div>
          <h2 class="detail-name">{{ customer.name }}</h2>
          <span class="detail-id">#{{ customer.id }}</span>
        </div>
        <div class="detail-actions">
          <el-button v-if="!customer.ownerId" type="primary" size="small" :icon="Coin" @click="handleClaim">领取客户</el-button>
          <el-button size="small" :icon="Edit" @click="handleEdit">编辑</el-button>
        </div>
      </div>

      <div class="card"><div class="card-title">基本信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="电话">{{ customer.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ customer.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ customer.gender || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ customer.age ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ customer.source || '-' }}</el-descriptions-item>
          <el-descriptions-item label="等级"><el-tag v-if="customer.level" :type="levelType(customer.level)" size="small" effect="light">{{ customer.level }}</el-tag><span v-else>-</span></el-descriptions-item>
          <el-descriptions-item label="归属">{{ customer.ownerId || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ customer.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ customer.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="card" style="margin-top:16px"><div class="card-title">跟进信息</div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="跟进状态">
            <el-tag :type="leadStatusType" size="small">{{ leadInfo?.followStatus || '未跟进' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="跟进次数">{{ leadInfo?.followCount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="最近跟进">{{ leadInfo?.lastFollowTime || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible" title="编辑客户" width="520px" destroy-on-close>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="editForm.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="editForm.email" /></el-form-item>
        <el-form-item label="行业"><el-input v-model="editForm.industry" /></el-form-item>
        <el-form-item label="来源">
          <el-select v-model="editForm.source" style="width:100%">
            <el-option v-for="s in sources" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="editForm.level" style="width:100%">
            <el-option v-for="l in levels" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址"><el-input v-model="editForm.address" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Coin, Edit } from '@element-plus/icons-vue'
import { getCustomer, claimCustomer, updateCustomer } from '../../api/customer'

const route = useRoute(); const router = useRouter()
const loading = ref(true); const customer = ref(null)
function levelType(l) { return {'高价值':'danger','普通':'','沉睡':'info'}[l]||'' }
const leadInfo = computed(() => customer.value?.leadInfo || {})
const leadStatusType = computed(() => ({'已跟进':'success','跟进中':'warning'}[leadInfo.value?.followStatus]||'info'))
const dialogVisible = ref(false)
const saving = ref(false)
const sources = ['门店','小程序','地推','网站','转介','展会','活动']
const levels = ['普通','高价值','沉睡']
const editForm = reactive({ name:'',phone:'',email:'',industry:'',source:'',level:'普通',address:'',remark:'' })

async function fetchDetail() {
  loading.value=true
  try { const res = await getCustomer(route.params.id); customer.value = res || null }
  catch (e) { console.error('fetchDetail failed', e); customer.value=null }
  finally { loading.value=false }
}
async function handleClaim() { try { await claimCustomer(route.params.id); ElMessage.success('领取成功'); fetchDetail() } catch (e) { ElMessage.error(e?.message || '领取失败') } }
function handleEdit() {
  Object.assign(editForm, {
    name: customer.value.name || '',
    phone: customer.value.phone || '',
    email: customer.value.email || '',
    industry: customer.value.industry || '',
    source: customer.value.source || '',
    level: customer.value.level || '普通',
    address: customer.value.address || '',
    remark: customer.value.remark || ''
  })
  dialogVisible.value = true
}
async function handleSubmit() {
  saving.value = true
  try {
    await updateCustomer(route.params.id, editForm)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchDetail()
  } catch (e) {
    ElMessage.error('保存失败: ' + (e?.message || '请检查网络连接'))
  } finally {
    saving.value = false
  }
}
onMounted(() => fetchDetail())
</script>

<style scoped>
.back-btn { display:inline-flex; align-items:center; gap:6px; border:none; background:none; color:var(--crm-text-secondary); cursor:pointer; font-size:13px; padding:0; margin-bottom:16px; transition:color 0.15s; }
.back-btn:hover { color:var(--crm-primary); }
.detail-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.detail-name { font-size:22px; font-weight:700; color:var(--crm-text); margin:0; display:inline; }
.detail-id { font-size:13px; color:var(--crm-text-muted); margin-left:10px; font-family:var(--crm-font-mono); }
.detail-actions { display:flex; gap:8px; }
.card-title { font-size:14px; font-weight:600; color:var(--crm-text); margin-bottom:14px; }
</style>
