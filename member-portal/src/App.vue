<template>
  <div class="app">
    <header class="topbar">
      <div class="tb-inner">
        <router-link to="/" class="logo">🛍 会员商城</router-link>
        <nav class="tb-nav">
          <router-link to="/products">全部商品</router-link>
          <router-link to="/coupons">领券中心</router-link>
          <router-link to="/points">积分商城</router-link>
        </nav>
        <div class="tb-right">
          <router-link to="/cart" class="cart-btn">🛒<span v-if="cartCount" class="cart-badge">{{ cartCount }}</span></router-link>
          <template v-if="user">
            <router-link to="/orders" class="tb-link">📦 订单</router-link>
            <router-link to="/profile" class="tb-link">{{ user.nickname }}</router-link>
            <span class="tb-link logout-link" @click="logout">退出</span>
          </template>
          <template v-else>
            <router-link to="/login" class="tb-link">登录</router-link>
            <router-link to="/register" class="reg-btn">注册</router-link>
          </template>
        </div>
      </div>
    </header>
    <main class="main"><router-view /></main>
    <nav class="mobile-nav">
      <router-link to="/">🏠<span>首页</span></router-link>
      <router-link to="/products">🔍<span>发现</span></router-link>
      <router-link to="/cart">🛒<span>购物车</span></router-link>
      <router-link to="/profile">👤<span>我的</span></router-link>
    </nav>
    <footer class="footer">© 2026 会员商城 · 大学生专属购物平台</footer>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const user = ref(JSON.parse(localStorage.getItem('m_user') || 'null'))
const cartCount = ref(0)
function logout() { localStorage.removeItem('m_token'); localStorage.removeItem('m_user'); user.value = null; window.location.href = '/' }
onMounted(() => {
  const count = localStorage.getItem('m_cart_count')
  if (count) cartCount.value = parseInt(count)
})
</script>
<style scoped>
.app{min-height:100vh;display:flex;flex-direction:column;background:#F5F3F0}
.topbar{background:rgba(255,255,255,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 1px 3px rgba(0,0,0,.04);position:sticky;top:0;z-index:100}
.tb-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:32px;padding:0 20px;height:60px}
.logo{font-size:20px;font-weight:800;color:#FF6B35;text-decoration:none;letter-spacing:-.5px}
.tb-nav{display:flex;gap:20px;flex:1}
.tb-nav a{color:#6B7280;text-decoration:none;font-size:14px;font-weight:500;transition:color .2s}
.tb-nav a:hover,.tb-nav a.router-link-active{color:#FF6B35}
.tb-right{display:flex;align-items:center;gap:16px}
.tb-link{color:#6B7280;text-decoration:none;font-size:14px;cursor:pointer}
.tb-link:hover{color:#FF6B35}
.logout-link{font-size:12px;color:#9CA3AF}
.reg-btn{background:linear-gradient(135deg,#FF6B35,#F7B731);color:#fff;padding:6px 18px;border-radius:20px;font-size:13px;font-weight:600;text-decoration:none;transition:transform .2s}
.reg-btn:hover{transform:scale(1.05)}
.cart-btn{position:relative;font-size:20px;text-decoration:none}
.cart-badge{position:absolute;top:-6px;right:-8px;background:#DC2626;color:#fff;font-size:10px;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
.main{flex:1;max-width:1200px;width:100%;margin:0 auto;padding:24px 20px}
.mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-top:1px solid #E5E7EB;justify-content:space-around;padding:6px 0 2px;z-index:100}
.mobile-nav a{display:flex;flex-direction:column;align-items:center;font-size:10px;color:#9CA3AF;text-decoration:none;gap:1px}
.mobile-nav a.router-link-active{color:#FF6B35}
.footer{text-align:center;padding:24px;color:#9CA3AF;font-size:12px}
@media(max-width:768px){.mobile-nav{display:flex}.footer{padding-bottom:80px}.tb-nav{display:none}.tb-right{gap:10px}}
</style>
