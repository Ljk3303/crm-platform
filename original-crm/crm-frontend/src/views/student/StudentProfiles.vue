<template>
<div class="page-pad">
  <div class="crm-page-header"><h1>🎓 学生画像</h1></div>
  <el-card>
    <el-table :data="students" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="phone" label="手机" width="130" />
      <el-table-column label="年级" width="90"><template #default="{row}">{{ row.profile?.grade || '-' }}</template></el-table-column>
      <el-table-column label="专业" width="120"><template #default="{row}">{{ row.profile?.major_category || '-' }}</template></el-table-column>
      <el-table-column label="校园" width="120"><template #default="{row}">{{ row.profile?.campus || '-' }}</template></el-table-column>
      <el-table-column label="生活费" width="100"><template #default="{row}">{{ row.profile?.living_expense_range || '-' }}</template></el-table-column>
      <el-table-column label="认证" width="80" align="center">
        <template #default="{row}"><el-tag :type="row.profile?.verified?'success':'info'" size="small">{{ row.profile?.verified?'已认证':'未认证' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{row}"><el-button size="small" @click="openProfile(row)">编辑</el-button></template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" title="编辑学生档案" width="500px">
    <el-form :model="profileForm" label-width="90px">
      <el-form-item :label="custName"><el-tag>{{ custName }}</el-tag></el-form-item>
      <el-form-item label="年级"><el-select v-model="profileForm.grade"><el-option v-for="g in ['大一','大二','大三','大四','研一','研二']" :key="g" :label="g" :value="g"/></el-select></el-form-item>
      <el-form-item label="专业分类"><el-input v-model="profileForm.majorCategory" placeholder="如：工科、理科"/></el-form-item>
      <el-form-item label="生活费"><el-select v-model="profileForm.livingExpenseRange"><el-option v-for="r in ['1000以下','1000-2000','2000-3000','3000以上']" :key="r" :label="r" :value="r"/></el-select></el-form-item>
      <el-form-item label="校园"><el-input v-model="profileForm.campus" placeholder="如：深圳大学城"/></el-form-item>
      <el-form-item label="宿舍"><el-input v-model="profileForm.dormitory"/></el-form-item>
      <el-form-item label="学号"><el-input v-model="profileForm.studentCardNo"/></el-form-item>
      <el-form-item label="已认证"><el-switch v-model="profileForm.verified"/></el-form-item>
    </el-form>
    <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="saveProfile">保存</el-button></template>
  </el-dialog>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const students = ref([]); const loading = ref(false)
const dialogVisible = ref(false); const custName = ref(''); const custId = ref(null)
const profileForm = ref({ grade:'', majorCategory:'', livingExpenseRange:'', campus:'', dormitory:'', studentCardNo:'', verified:false })

async function fetchData() {
  loading.value = true
  try {
    const res = await request.get('/customers')
    const custs = (res.records || []).filter(c => c.source === '小程序' || c.level === '普通')
    const enriched = []
    for (const c of custs.slice(0, 20)) {
      try { const p = await request.get('/student-profiles/' + c.id); enriched.push({ ...c, profile: (p && p.customer_id) ? p : null }) }
      catch { enriched.push({ ...c, profile: null }) }
    }
    students.value = enriched
  } catch {} finally { loading.value = false }
}

async function openProfile(row) {
  custId.value = row.id; custName.value = row.name
  if (row.profile) profileForm.value = { ...row.profile, grade: row.profile.grade||'', majorCategory: row.profile.major_category||'',
    livingExpenseRange: row.profile.living_expense_range||'', campus: row.profile.campus||'',
    dormitory: row.profile.dormitory||'', studentCardNo: row.profile.student_card_no||'', verified: !!row.profile.verified }
  else profileForm.value = { grade:'', majorCategory:'', livingExpenseRange:'', campus:'', dormitory:'', studentCardNo:'', verified:false }
  dialogVisible.value = true
}

async function saveProfile() {
  try {
    await request.post('/student-profiles', { customerId: custId.value, ...profileForm.value })
    ElMessage.success('保存成功'); dialogVisible.value = false; fetchData()
  } catch { ElMessage.error('保存失败') }
}

onMounted(fetchData)
</script>
<style scoped>.page-pad{padding:16px}</style>
