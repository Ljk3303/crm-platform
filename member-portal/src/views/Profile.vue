<template><div>
  <div v-if="user" class="profile-card"><div class="pf-avatar">{{ (user.nickname||'?')[0] }}</div><h3>{{ user.nickname }}</h3><p>{{ user.phone }}</p><div class="pf-stats"><div><b>{{ user.available_points||0 }}</b><br>积分</div><div><b>¥{{ (user.total_spent||0).toFixed(0) }}</b><br>消费</div></div></div>
  <div class="pf-menu"><router-link to="/orders">📦 我的订单</router-link><router-link to="/student-verify">🎓 学生认证</router-link><router-link to="/favorites">❤️ 我的收藏</router-link><router-link to="/group-buy">🤝 拼团购买</router-link><router-link to="/address">📍 收货地址</router-link><router-link to="/coupons">🎫 我的优惠券</router-link><router-link to="/points">💰 积分管理</router-link><router-link to="/member">🎖 会员等级</router-link><router-link to="/feedback">💬 意见反馈</router-link></div>
</div></template>
<script setup>import { ref, onMounted } from 'vue'; import request from '@/utils/request'; const user = ref(null); onMounted(async () => { try { user.value = await request.get('/auth/profile') } catch {} });</script>
<style scoped>
.profile-card{background:#fff;border-radius:16px;padding:32px;text-align:center;margin-bottom:16px}.pf-avatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FF6B35,#F7B731);color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;margin:0 auto 12px}.pf-stats{display:flex;gap:40px;justify-content:center;margin-top:16px;color:#636E72}
.pf-menu{display:flex;flex-direction:column;gap:1px}.pf-menu a{padding:16px 20px;background:#fff;text-decoration:none;color:#2D3436;display:flex;align-items:center;gap:12px;font-size:15px}.pf-menu a:hover{background:#FFF5F0}
</style>
