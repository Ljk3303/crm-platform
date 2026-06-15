<template>
<div class="page-pad">
  <div class="crm-page-header"><h1>⚠️ 流失预警</h1><el-button type="primary" @click="recalc">重新计算</el-button></div>
  <el-card><el-table :data="predictions" v-loading="loading" stripe>
    <el-table-column prop="customer_name" label="客户" width="120" />
    <el-table-column label="风险分数" width="120"><template #default="{row}">
      <el-progress :percentage="row.risk_score||0" :color="row.risk_score>70?'#DC2626':row.risk_score>40?'#F59E0B':'#10B981'" :stroke-width="18"/>
    </template></el-table-column>
    <el-table-column label="风险等级" width="100"><template #default="{row}">
      <el-tag :type="row.risk_level==='高'?'danger':row.risk_level==='中'?'warning':'success'" size="small">{{ row.risk_level }}</el-tag>
    </template></el-table-column>
    <el-table-column prop="reason" label="原因" min-width="180" />
    <el-table-column prop="last_order_at" label="最后订单" width="120" />
  </el-table></el-card>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const predictions = ref([]); const loading = ref(false)

onMounted(async () => { loading.value=true; try { predictions.value = await request.get('/churn-predictions') || [] } catch {} finally { loading.value=false } })

async function recalc() {
  try { await request.post('/churn-predictions/recalculate'); ElMessage.success('已重新计算'); predictions.value = await request.get('/churn-predictions') || [] } catch { ElMessage.error('计算失败') }
}
</script>
<style scoped>.page-pad{padding:16px}</style>
