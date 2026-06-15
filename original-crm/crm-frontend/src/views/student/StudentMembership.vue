<template>
<div class="page-pad">
  <div class="crm-page-header"><h1>💎 付费会员</h1><el-button type="primary" @click="showAdd=true">开通会员</el-button></div>
  <el-card><el-table :data="memberships" v-loading="loading" stripe>
    <el-table-column prop="customer_name" label="客户" width="120" />
    <el-table-column prop="plan_type" label="套餐" width="80" />
    <el-table-column prop="amount" label="金额" width="100"><template #default="{row}">¥{{ row.amount }}</template></el-table-column>
    <el-table-column prop="start_date" label="开始" width="110" /><el-table-column prop="end_date" label="到期" width="110" />
    <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="row.end_date>today?'success':'danger'" size="small">{{ row.end_date>today?'有效':'已过期' }}</el-tag></template></el-table-column>
  </el-table></el-card>

  <el-dialog v-model="showAdd" title="开通付费会员" width="400px">
    <el-form label-width="80px">
      <el-form-item label="客户"><el-select v-model="addCustId" filterable placeholder="搜索客户" style="width:100%">
        <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id"/>
      </el-select></el-form-item>
      <el-form-item label="套餐"><el-select v-model="addPlan" style="width:100%"><el-option label="月卡 ¥29" value="月卡"/><el-option label="季卡 ¥79" value="季卡"/><el-option label="年卡 ¥299" value="年卡"/></el-select></el-form-item>
    </el-form>
    <template #footer><el-button @click="showAdd=false">取消</el-button><el-button type="primary" @click="doAdd">确认开通</el-button></template>
  </el-dialog>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const memberships = ref([]); const customers = ref([]); const loading = ref(false)
const showAdd = ref(false); const addCustId = ref(null); const addPlan = ref('月卡')
const today = new Date().toISOString().substring(0,10)

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/customers'); customers.value = (res.records || []).slice(0, 50)
    const enriched = []
    for (const c of customers.value.slice(0, 10)) {
      try {
        const ms = await request.get('/paid-memberships/' + c.id)
        ms.forEach(m => enriched.push({ ...m, customer_name: c.name }))
      } catch {}
    }
    memberships.value = enriched
  } catch {} finally { loading.value = false }
})

async function doAdd() {
  if (!addCustId.value) { ElMessage.warning('请选择客户'); return }
  const amounts = { '月卡':29, '季卡':79, '年卡':299 }
  try {
    await request.post('/paid-memberships', { customerId: addCustId.value, planType: addPlan.value, amount: amounts[addPlan.value] })
    ElMessage.success('开通成功'); showAdd.value = false
    const ms = await request.get('/paid-memberships/' + addCustId.value)
    const cust = customers.value.find(c => c.id === addCustId.value)
    ms.forEach(m => memberships.value.push({ ...m, customer_name: cust?.name }))
  } catch { ElMessage.error('操作失败') }
}
</script>
<style scoped>.page-pad{padding:16px}</style>
