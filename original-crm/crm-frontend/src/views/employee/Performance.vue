<template>
  <div class="performance">
    <div class="crm-page-header">
      <h1 class="crm-page-title">业绩排行</h1>
      <el-date-picker v-model="month" type="month" placeholder="选择月份" format="YYYY-MM" value-format="YYYY-MM" @change="fetchData" style="width:160px" />
    </div>
    <div class="card">
      <el-table :data="list" stripe v-loading="loading" style="width:100%">
        <el-table-column type="index" label="排名" width="60" align="center" />
        <el-table-column prop="employeeId" label="员工ID" width="80" align="center" />
        <el-table-column label="销售额" min-width="140" align="center">
          <template #default="{row}"><span class="crm-mono" style="font-weight:600">¥{{ Number(row.salesAmount||0).toLocaleString('zh-CN',{minimumFractionDigits:2}) }}</span></template>
        </el-table-column>
        <el-table-column label="新客数" width="100" align="center">
          <template #default="{row}"><span class="crm-mono">{{ row.newCustomers||0 }}</span></template>
        </el-table-column>
        <el-table-column label="回访次数" width="100" align="center">
          <template #default="{row}"><span class="crm-mono">{{ row.followUpCount||0 }}</span></template>
        </el-table-column>
        <el-table-column label="月份" width="100" align="center"><template #default="{row}">{{ row.month }}</template></el-table-column>
      </el-table>
      <el-empty v-if="!loading && !list.length" description="暂无业绩数据" :image-size="60" style="padding:40px" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPerformance } from '../../api/employee'

const DEMO = [{name:"张伟",deals:21,amount:57700,newCustomers:8,followUpCount:45},{name:"李明",deals:15,amount:53300,newCustomers:5,followUpCount:32},{name:"王芳",deals:14,amount:37600,newCustomers:6,followUpCount:28},{name:"管理员",deals:14,amount:27900,newCustomers:4,followUpCount:38}]
const month = ref(new Date().toISOString().slice(0,7))
const list = ref([]); const loading = ref(false)

async function fetchData() { loading.value=true; try{const r=await getPerformance(month.value); list.value=Array.isArray(r)?r:(r?.data||[])}catch(e){list.value=DEMO;ElMessage.error(e?.message||'获取业绩数据失败')}finally{loading.value=false} }
onMounted(()=>fetchData())
</script>

<style scoped>
</style>
