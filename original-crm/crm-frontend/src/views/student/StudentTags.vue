<template>
<div class="page-pad">
  <div class="crm-page-header"><h1>🏷️ 智能标签</h1><el-button type="primary" @click="showAssign=true">分配标签</el-button></div>
  <el-card>
    <el-table :data="tagList" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="标签名" width="150" />
      <el-table-column prop="category" label="分类" width="100" /><el-table-column prop="description" label="描述" />
      <el-table-column label="使用数" width="80" align="center"><template #default="{row}">{{ row.customer_count || 0 }}</template></el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="showAssign" title="为客户分配标签" width="450px">
    <el-form label-width="80px">
      <el-form-item label="客户"><el-select v-model="assignCustId" filterable placeholder="搜索客户" style="width:100%">
        <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id"/>
      </el-select></el-form-item>
      <el-form-item label="标签"><el-select v-model="assignTagId" placeholder="选择标签" style="width:100%">
        <el-option v-for="t in tagList" :key="t.id" :label="t.name" :value="t.id"/>
      </el-select></el-form-item>
    </el-form>
    <template #footer><el-button @click="showAssign=false">取消</el-button><el-button type="primary" @click="doAssign">确认分配</el-button></template>
  </el-dialog>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const tagList = ref([]); const customers = ref([]); const loading = ref(false)
const showAssign = ref(false); const assignCustId = ref(null); const assignTagId = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    tagList.value = await request.get('/customer-tags') || []
    const res = await request.get('/customers'); customers.value = (res.records || []).slice(0, 50)
  } catch {} finally { loading.value = false }
})

async function doAssign() {
  if (!assignCustId.value || !assignTagId.value) { ElMessage.warning('请选择客户和标签'); return }
  try {
    await request.post('/customer-tags/assign', { customerId: assignCustId.value, tagId: assignTagId.value })
    ElMessage.success('分配成功'); showAssign.value = false
  } catch { ElMessage.error('分配失败') }
}
</script>
<style scoped>.page-pad{padding:16px}</style>
