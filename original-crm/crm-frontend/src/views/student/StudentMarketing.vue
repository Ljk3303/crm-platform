<template>
<div class="page-pad">
  <div class="crm-page-header"><h1>🎪 校园活动</h1><el-button type="primary" @click="showAdd=true">创建活动</el-button></div>
  <el-card><el-table :data="campaigns" v-loading="loading" stripe>
    <el-table-column prop="name" label="活动名称" min-width="140" />
    <el-table-column prop="campus" label="校园" width="120" /><el-table-column prop="type" label="类型" width="100" />
    <el-table-column label="时间" width="200"><template #default="{row}">{{ row.start_date }} ~ {{ row.end_date }}</template></el-table-column>
    <el-table-column label="预算" width="100"><template #default="{row}">¥{{ row.budget }}</template></el-table-column>
    <el-table-column label="参与" width="80" align="center"><template #default="{row}">{{ row.participant_count||0 }}</template></el-table-column>
    <el-table-column prop="status" label="状态" width="90"><template #default="{row}"><el-tag size="small">{{ row.status }}</el-tag></template></el-table-column>
  </el-table></el-card>

  <el-dialog v-model="showAdd" title="创建校园活动" width="450px">
    <el-form label-width="80px">
      <el-form-item label="名称"><el-input v-model="addForm.name"/></el-form-item>
      <el-form-item label="校园"><el-input v-model="addForm.campus" placeholder="如：深圳大学"/></el-form-item>
      <el-form-item label="类型"><el-select v-model="addForm.type" style="width:100%"><el-option label="线下路演" value="线下路演"/><el-option label="线上推广" value="线上推广"/><el-option label="校园讲座" value="校园讲座"/><el-option label="社团合作" value="社团合作"/></el-select></el-form-item>
      <el-form-item label="开始"><el-date-picker v-model="addForm.startDate" style="width:100%"/></el-form-item>
      <el-form-item label="结束"><el-date-picker v-model="addForm.endDate" style="width:100%"/></el-form-item>
      <el-form-item label="预算"><el-input-number v-model="addForm.budget" :min="0" style="width:100%"/></el-form-item>
    </el-form>
    <template #footer><el-button @click="showAdd=false">取消</el-button><el-button type="primary" @click="doAdd">创建</el-button></template>
  </el-dialog>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const campaigns = ref([]); const loading = ref(false); const showAdd = ref(false)
const addForm = ref({ name:'', campus:'', type:'线下路演', startDate:'', endDate:'', budget:0 })

onMounted(async () => { loading.value=true; try { campaigns.value = await request.get('/campus-campaigns') || [] } catch {} finally { loading.value=false } })

async function doAdd() {
  if (!addForm.value.name) { ElMessage.warning('请输入活动名称'); return }
  try { await request.post('/campus-campaigns', addForm.value); ElMessage.success('创建成功'); showAdd.value=false; campaigns.value = await request.get('/campus-campaigns') || [] } catch { ElMessage.error('创建失败') }
}
</script>
<style scoped>.page-pad{padding:16px}</style>
