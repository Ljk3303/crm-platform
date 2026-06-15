<template>
<div class="page-pad">
  <div class="crm-page-header"><h1>📊 RFM分层</h1><el-button type="primary" @click="recalc">重新计算</el-button></div>
  <el-row :gutter="16" style="margin-bottom:16px">
    <el-col :span="6" v-for="t in tierStats" :key="t.tier"><el-card shadow="hover"><div style="text-align:center">
      <div style="font-size:28px;font-weight:700;color:#2563EB">{{ t.count }}</div>
      <div style="color:#64748B;margin-top:4px">{{ t.tier }}</div>
    </div></el-card></el-col>
  </el-row>
  <el-card><el-table :data="rfmData" v-loading="loading" stripe>
    <el-table-column prop="customerName" label="客户" width="120" />
    <el-table-column label="R值" width="70" align="center"><template #default="{row}">{{ row.rScore }}</template></el-table-column>
    <el-table-column label="F值" width="70" align="center"><template #default="{row}">{{ row.fScore }}</template></el-table-column>
    <el-table-column label="M值" width="70" align="center"><template #default="{row}">{{ row.mScore }}</template></el-table-column>
    <el-table-column label="总分" width="70" align="center"><template #default="{row}">{{ (row.rScore||0)+(row.fScore||0)+(row.mScore||0) }}</template></el-table-column>
    <el-table-column prop="segment" label="分层" width="140">
      <template #default="{row}"><el-tag :type="row.segment==='核心价值客户'?'danger':row.segment==='潜力客户'?'warning':row.segment==='流失风险客户'?'info':'success'" size="small">{{ row.segment }}</el-tag></template>
    </el-table-column>
  </el-table></el-card>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const rfmData = ref([]); const loading = ref(false)

const tierStats = computed(() => {
  const map = {}
  rfmData.value.forEach(r => { map[r.segment] = (map[r.segment]||0) + 1 })
  return Object.entries(map).map(([tier, count]) => ({ tier, count }))
})

onMounted(async () => { loading.value = true; try { rfmData.value = await request.get('/rfm-scores') || [] } catch {} finally { loading.value = false } })

async function recalc() {
  try { await request.post('/rfm-scores/recalculate'); ElMessage.success('已重新计算'); const d = await request.get('/rfm-scores'); rfmData.value = d || [] } catch { ElMessage.error('计算失败') }
}
</script>
<style scoped>.page-pad{padding:16px}</style>
