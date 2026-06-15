<template>
  <div class="mgr-page">
    <h2>💰 积分管理</h2>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">{{ stats.balance }}</div><div class="stat-label">当前积分池</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.totalIssued }}</div><div class="stat-label">累计发放</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.totalUsed }}</div><div class="stat-label">累计消耗</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.todaySigns }}</div><div class="stat-label">今日签到</div></div>
    </div>

    <!-- Actions -->
    <div style="margin-bottom:16px;display:flex;gap:8px">
      <el-select v-model="filterCustomer" filterable remote placeholder="筛选客户" :remote-method="searchCustomers" clearable style="width:220px" size="default">
        <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id"/>
      </el-select>
      <el-button type="primary" @click="showAdjust=true">手动调整积分</el-button>
      <el-button @click="fetch">刷新</el-button>
    </div>

    <!-- Records -->
    <el-card shadow="never" style="border-radius:12px">
      <el-table :data="records" stripe size="small" max-height="500">
        <el-table-column prop="id" label="ID" width="60"/>
        <el-table-column prop="customer_name" label="客户" width="120"/>
        <el-table-column label="类型" width="70"><template #default="{row}"><el-tag :type="row.type==='收入'?'success':'danger'" size="small">{{ row.type }}</el-tag></template></el-table-column>
        <el-table-column prop="points" label="积分" width="80"><template #default="{row}"><b :style="{color:row.type==='收入'?'#059669':'#DC2626'}">{{ row.type==='收入'?'+':'-' }}{{ row.points }}</b></template></el-table-column>
        <el-table-column prop="reason" label="原因" min-width="150"/>
        <el-table-column prop="source" label="来源" width="80"/>
        <el-table-column prop="created_at" label="时间" width="160"/>
      </el-table>
    </el-card>

    <!-- Adjust Dialog -->
    <el-dialog v-model="showAdjust" title="手动调整积分" width="420px">
      <el-form label-width="80px">
        <el-form-item label="客户">
          <el-select v-model="adjustForm.customerId" filterable remote placeholder="搜索客户" :remote-method="searchCustomers" style="width:100%">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name + ' (' + c.phone + ')'" :value="c.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-radio-group v-model="adjustForm.type"><el-radio value="收入">增加积分</el-radio><el-radio value="支出">扣除积分</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="积分数量"><el-input-number v-model="adjustForm.points" :min="1" :max="99999" style="width:100%"/></el-form-item>
        <el-form-item label="原因"><el-input v-model="adjustForm.reason" placeholder="调整原因"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="showAdjust=false">取消</el-button><el-button type="primary" @click="doAdjust">确认调整</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const stats = ref({ balance: 0, totalIssued: 0, totalUsed: 0, todaySigns: 0 })
const records = ref([])
const filterCustomer = ref(null)
const customerOptions = ref([])
const showAdjust = ref(false)
const adjustForm = reactive({ customerId: null, type: '收入', points: 100, reason: '' })

onMounted(() => { fetch() })

async function fetch() {
  try {
    const [s, r] = await Promise.all([
      request.get('/admin/points/stats'),
      request.get('/admin/points/all' + (filterCustomer.value ? '?customerId=' + filterCustomer.value : '')),
    ])
    stats.value = s; records.value = r || []
  } catch {}
}

async function searchCustomers(q) {
  if (!q) { customerOptions.value = []; return }
  try { customerOptions.value = await request.get('/customers?keyword=' + q).then(r => r.records?.slice(0, 10) || []) } catch {}
}

async function doAdjust() {
  if (!adjustForm.customerId || !adjustForm.points) return ElMessage.warning('请填写完整信息')
  try {
    await request.post('/admin/points/adjust', { ...adjustForm })
    ElMessage.success('积分调整成功')
    showAdjust.value = false
    adjustForm.reason = ''
    fetch()
  } catch { ElMessage.error('调整失败') }
}
</script>

<style scoped>
.mgr-page { padding: 0; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.stat-val { font-size: 24px; font-weight: 700; color: #2563EB; }
.stat-label { font-size: 12px; color: #64748B; margin-top: 4px; }
</style>
