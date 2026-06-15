<template>
<div class="auth-page">
  <div class="auth-card">
    <div class="auth-header">
      <router-link to="/" class="auth-logo">🛍</router-link>
      <h1>创建账号</h1>
      <p>注册即送100积分</p>
    </div>
    <el-form @submit.prevent="doRegister" size="large">
      <el-form-item><el-input v-model="phone" placeholder="手机号" prefix-icon="Phone" style="height:48px"/></el-form-item>
      <el-form-item><el-input v-model="nickname" placeholder="昵称（选填）" prefix-icon="User" style="height:48px"/></el-form-item>
      <el-form-item><el-input v-model="password" type="password" placeholder="设置密码（至少6位）" prefix-icon="Lock" show-password style="height:48px"/></el-form-item>
      <el-form-item><el-button type="primary" native-type="submit" :loading="loading" style="width:100%;height:48px;border-radius:12px;font-size:16px;font-weight:700;background:linear-gradient(135deg,#FF6B35,#F7B731);border:none">注册</el-button></el-form-item>
    </el-form>
    <div class="auth-footer">
      已有账号？<router-link to="/login" style="color:#FF6B35;font-weight:600">去登录</router-link>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const phone = ref('')
const nickname = ref('')
const password = ref('')
const loading = ref(false)

async function doRegister() {
  if (!phone.value || !password.value) return ElMessage.warning('请填写手机号和密码')
  if (password.value.length < 6) return ElMessage.warning('密码至少6位')
  loading.value = true
  try {
    const res = await request.post('/auth/register', { phone: phone.value, password: password.value, nickname: nickname.value || '用户' + phone.value.slice(-4) })
    localStorage.setItem('m_token', res.token)
    localStorage.setItem('m_user', JSON.stringify(res.user))
    ElMessage.success('注册成功！已赠送100积分')
    router.push('/')
  } catch (e) { ElMessage.error(e.message || '注册失败') }
  finally { loading.value = false }
}
</script>

<style scoped>
.auth-page{min-height:80vh;display:flex;align-items:center;justify-content:center;padding:20px}
.auth-card{background:#fff;border-radius:24px;padding:40px;width:100%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,.06)}
.auth-header{text-align:center;margin-bottom:32px}
.auth-logo{font-size:48px;display:block;margin-bottom:12px}
.auth-header h1{font-size:22px;font-weight:800;color:#1A1A2E;margin-bottom:6px}
.auth-header p{font-size:14px;color:#9CA3AF}
.auth-footer{text-align:center;margin-top:20px;font-size:14px;color:#6B7280}
</style>
