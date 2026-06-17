<template><div class="mp">
  <div v-if="!isLogin" class="mp-login">
    <div class="mp-login-av">{{ largeEmoji }}</div>
    <h3>登录解锁更多权益</h3>
    <p>积分兑换 · 会员折扣 · 专属客服</p>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
      <router-link to="/login" class="mobile-btn primary" style="width:auto;padding:0 28px">登录</router-link>
      <router-link to="/register" class="mobile-btn outline" style="width:auto;padding:0 28px">注册</router-link>
    </div>
  </div>
  <template v-else>
    <div class="mp-card">
      <div class="mp-top"><div class="mp-av">{{ user?.nickname?.[0]||'?' }}</div><div><div class="mp-nm">{{ user?.nickname||'会员' }}</div><div class="mp-lv">{{ tier?.name||'铜牌会员' }}</div></div><div class="mp-pts">{{ user?.total_points||0 }}<small>积分</small></div></div>
      <div class="mp-act"><div @click="$router.push('/orders')">📦<span>我的订单</span></div><div @click="$router.push('/coupons')">🎫<span>领券中心</span></div><div @click="$router.push('/points')">🎁<span>积分商城</span></div><div @click="$router.push('/favorites')">❤️<span>我的收藏</span></div></div>
    </div>
    <div class="mp-card">
      <div class="mp-card-hd">会员权益</div>
      <div class="mp-benefits"><div v-for="b in benefits" :key="b" class="mp-b">✅ {{ b }}</div></div>
    </div>
    <div class="mp-card">
      <div class="mp-card-hd">快捷操作</div>
      <div class="mp-links"><router-link to="/profile">👤 个人中心</router-link><router-link to="/address">📍 地址管理</router-link><router-link to="/feedback">💬 意见反馈</router-link><router-link to="/student-verify">🎓 学生认证</router-link></div>
    </div>
  </template>
</div></template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'
const isLogin = computed(() => !!localStorage.getItem('m_token'))
const user = ref(null)
const tier = ref(null)
const benefits = ref(['基础折扣 9.5 折','积分翻倍','生日专属礼品','优先客服','免费试用','专属活动'])
const largeEmoji = '🎁'
onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem('m_user')||'null')
  try { const res = await request.get('/member/tiers'); if (res?.length) { const u = user.value; if (u?.member_tier_id) { const t = res.find(t=>t.id===u.member_tier_id); if (t) tier.value = t; benefits.value = (t.benefits||'9.5折折扣').split(';') } else { tier.value = res[0]; if (res[0]?.benefits) benefits.value = res[0].benefits.split(';') } } } catch {}
})
</script>
<style scoped>
.mp{padding:0 12px 80px;min-height:100vh}
.mp-login{text-align:center;padding:60px 20px}
.mp-login-av{font-size:48px;margin-bottom:12px}
.mp-login h3{font-size:18px;font-weight:700;color:#0f172a;margin:0 0 4px}
.mp-login p{font-size:13px;color:#64748b;margin:0}
.mp-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:12px;border:1px solid #e2e8f0}
.mp-card-hd{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px}
.mp-top{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.mp-av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0}
.mp-nm{font-size:16px;font-weight:600;color:#0f172a}
.mp-lv{font-size:12px;color:#f59e0b;font-weight:500}
.mp-pts{margin-left:auto;font-size:22px;font-weight:700;color:#3b82f6;font-family:monospace}
.mp-pts small{font-size:12px;font-weight:400;color:#94a3b8;display:block;text-align:right}
.mp-act{display:grid;grid-template-columns:repeat(4,1fr);text-align:center;gap:8px}
.mp-act div{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:14px;cursor:pointer;color:#475569}
.mp-act div span{font-size:11px;color:#64748b}
.mp-benefits{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.mp-b{font-size:12px;color:#475569;padding:6px 10px;background:#f8fafc;border-radius:8px}
.mp-links{display:flex;flex-direction:column;gap:2px}
.mp-links a{display:block;padding:10px 0;color:#475569;text-decoration:none;font-size:14px;border-bottom:1px solid #f1f5f9}
.mp-links a:last-child{border-bottom:none}
</style>
