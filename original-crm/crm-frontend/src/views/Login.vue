<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-blob b1"></div>
      <div class="bg-blob b2"></div>
      <div class="bg-blob b3"></div>
    </div>
    <div class="login-card">
      <div class="login-header">
        <div class="logo-mark">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="2"/>
            <circle cx="12" cy="16" r="2.5"/><path d="M10.5 9.5L14 8.5"/><path d="M9.5 11L11 14"/><path d="M15 10L13.5 14"/>
          </svg>
        </div>
        <h1>CRM 智能销售平台</h1>
        <p>客户关系管理 · 数据驱动决策</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>
      <p class="login-hint">默认账号 admin / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api/auth'
import { setToken } from '../utils/auth'
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}
async function handleLogin() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  loading.value = true
  try { const res = await login(form); setToken(res.token); ElMessage.success('登录成功'); router.push('/') }
  catch { /* interceptor handles */ }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  position: relative; background: #F0F4FF; overflow: hidden;
}
.login-bg { position: absolute; inset: 0; }
.bg-blob {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
}
.b1 { width: 500px; height: 500px; background: #DBEAFE; top: -150px; left: -150px; }
.b2 { width: 400px; height: 400px; background: #FEF3C7; bottom: -100px; right: -100px; }
.b3 { width: 300px; height: 300px; background: #DDD6FE; top: 50%; left: 60%; }
.login-card {
  position: relative; width: 400px; padding: 48px 44px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-radius: 20px; border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 8px 40px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.04);
}
.login-header { text-align: center; margin-bottom: 40px; }
.logo-mark {
  width: 64px; height: 64px; margin: 0 auto 20px;
  background: rgba(37,99,235,0.08); border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
}
.login-header h1 { font-size: 22px; font-weight: 700; color: #1E293B; margin: 0 0 8px; letter-spacing: 0.01em; }
.login-header p { font-size: 13px; color: #94A3B8; margin: 0; }
.login-btn { width: 100%; height: 44px; font-size: 16px; border-radius: 10px !important; font-weight: 600; letter-spacing: 0.1em; }
.login-hint { text-align: center; font-size: 12px; color: #CBD5E1; margin: 28px 0 0; }
</style>
