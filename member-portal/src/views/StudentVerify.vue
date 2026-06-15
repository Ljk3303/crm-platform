<template>
<div class="page">
  <div class="section-hd"><h2>🎓 学生认证</h2></div>

  <!-- Already submitted -->
  <div v-if="profile.verified === 1" class="verify-card success">
    <div class="verify-badge">✅</div>
    <h3>认证已通过</h3>
    <div class="verify-info">
      <div><span>学号</span>{{ profile.student_card_no }}</div>
      <div><span>年级</span>{{ profile.grade }}</div>
      <div><span>校园</span>{{ profile.campus }}</div>
      <div><span>专业</span>{{ profile.major_category || '-' }}</div>
    </div>
    <el-tag type="success" size="large">已认证学生身份</el-tag>
  </div>

  <!-- Pending -->
  <div v-else-if="profile.student_card_no" class="verify-card pending">
    <div class="verify-badge">⏳</div>
    <h3>认证审核中</h3>
    <div class="verify-info">
      <div><span>学号</span>{{ profile.student_card_no }}</div>
      <div><span>年级</span>{{ profile.grade }}</div>
      <div><span>校园</span>{{ profile.campus }}</div>
    </div>
    <el-tag type="warning" size="large">等待管理员审核</el-tag>
  </div>

  <!-- Not verified -->
  <div v-else class="verify-card form">
    <div class="verify-badge">🎓</div>
    <h3>学生身份认证</h3>
    <p style="color:#6B7280;margin-bottom:24px">认证后可享受专属学生优惠和活动</p>
    <el-form :model="form" label-width="90px" style="max-width:420px;margin:0 auto">
      <el-form-item label="学号" required><el-input v-model="form.studentCardNo" placeholder="请输入学号" maxlength="30"/></el-form-item>
      <el-form-item label="年级" required>
        <el-select v-model="form.grade" style="width:100%" placeholder="请选择">
          <el-option v-for="g in ['大一','大二','大三','大四','研一','研二','研三']" :key="g" :label="g" :value="g"/>
        </el-select>
      </el-form-item>
      <el-form-item label="专业分类"><el-input v-model="form.majorCategory" placeholder="如：工科、理科、文科"/></el-form-item>
      <el-form-item label="生活费用">
        <el-select v-model="form.livingExpenseRange" style="width:100%">
          <el-option v-for="r in ['1000以下','1000-2000','2000-3000','3000-5000','5000以上']" :key="r" :label="r" :value="r"/>
        </el-select>
      </el-form-item>
      <el-form-item label="所在校园" required><el-input v-model="form.campus" placeholder="如：深圳大学"/></el-form-item>
      <el-form-item label="宿舍楼"><el-input v-model="form.dormitory" placeholder="如：南区3栋"/></el-form-item>
      <el-form-item>
        <el-button type="primary" size="large" @click="submit" :loading="submitting" style="width:100%">提交认证</el-button>
      </el-form-item>
    </el-form>
  </div>

  <!-- Benefits -->
  <div class="benefits-card">
    <h4>🎁 学生认证权益</h4>
    <div class="benefit-list">
      <div>🎫 每月专属优惠券</div><div>💰 购物额外95折</div>
      <div>🎪 校园活动优先参与</div><div>📦 免费校园配送</div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const profile = ref({})
const submitting = ref(false)
const form = reactive({ studentCardNo:'', grade:'', majorCategory:'', livingExpenseRange:'', campus:'', dormitory:'' })

onMounted(async () => {
  try { profile.value = await request.get('/auth/student-profile') || {} } catch {}
})

async function submit() {
  if (!form.studentCardNo || !form.grade || !form.campus) { ElMessage.warning('请填写学号、年级和校园信息'); return }
  submitting.value = true
  try {
    await request.post('/auth/student-verify', form)
    ElMessage.success('认证信息已提交，请等待审核')
    profile.value = { ...form, verified: 0 }
  } catch (e) { ElMessage.error(e?.message || '提交失败') }
  finally { submitting.value = false }
}
</script>

<style scoped>
.verify-card{background:#fff;border-radius:16px;padding:32px;text-align:center;margin-bottom:16px}
.verify-card.success{border:2px solid #10B981}
.verify-card.pending{border:2px solid #F59E0B}
.verify-badge{font-size:48px;margin-bottom:12px}
.verify-card h3{font-size:20px;margin-bottom:8px}
.verify-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;max-width:320px;margin:16px auto;font-size:14px}
.verify-info span{color:#909399;margin-right:6px}
.benefits-card{background:#FFF7ED;border-radius:16px;padding:24px}
.benefits-card h4{margin-bottom:12px}
.benefit-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px;color:#636E72}
</style>
