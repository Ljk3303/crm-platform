<template>
<div class="page-pad">
  <div class="crm-page-header"><h1>🎫 服务工单</h1></div>
  <el-card><el-table :data="tickets" v-loading="loading" stripe>
    <el-table-column prop="id" label="工单号" width="80" />
    <el-table-column prop="title" label="标题" min-width="150" />
    <el-table-column prop="customer_name" label="客户" width="100" />
    <el-table-column prop="type" label="类型" width="100" /><el-table-column prop="priority" label="优先级" width="80" />
    <el-table-column prop="status" label="状态" width="90"><template #default="{row}"><el-tag :type="row.status==='已完成'?'success':row.status==='处理中'?'warning':'info'" size="small">{{ row.status }}</el-tag></template></el-table-column>
    <el-table-column prop="created_at" label="创建时间" width="160" />
  </el-table></el-card>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const tickets = ref([]); const loading = ref(false)
onMounted(async () => { loading.value=true; try { const r = await request.get('/service-tickets-ext/list'); tickets.value = (r.records||r||[]) } catch { tickets.value=[] } finally { loading.value=false } })
</script>
<style scoped>.page-pad{padding:16px}</style>
