<template>
<div class="portal-app">
  <!-- Top Header -->
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-dot"></span>
        <span class="logo-text">CRM 会员商城</span>
      </router-link>
      <div class="header-nav">
        <router-link to="/" exact-active-class="active">首页</router-link>
        <router-link to="/products" active-class="active">全部商品</router-link>
        <router-link to="/coupons" active-class="active">领券中心</router-link>
        <router-link to="/points" active-class="active">积分商城</router-link>
      </div>
      <div class="header-right">
        <router-link to="/cart" class="cart-link">
          <span>🛒</span><b v-if="cartCount">{{ cartCount }}</b>
        </router-link>
        <template v-if="user">
          <router-link to="/member" class="user-link">{{ user.nickname }}</router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="login-link">登录</router-link>
        </template>
      </div>
      <button class="menu-btn" @click="menuOpen=!menuOpen">☰</button>
    </div>
  </header>

  <!-- Mobile Nav Overlay -->
  <div v-if="menuOpen" class="menu-overlay" @click="menuOpen=false">
    <div class="menu-panel" @click.stop>
      <div class="menu-close" @click="menuOpen=false">✕</div>
      <router-link to="/" @click="menuOpen=false">首页</router-link>
      <router-link to="/products" @click="menuOpen=false">全部商品</router-link>
      <router-link to="/coupons" @click="menuOpen=false">领券中心</router-link>
      <router-link to="/points" @click="menuOpen=false">积分商城</router-link>
      <router-link to="/member" @click="menuOpen=false">会员中心</router-link>
      <router-link to="/cart" @click="menuOpen=false">购物车</router-link>
    </div>
  </div>

  <!-- Main Content -->
  <router-view @updateCart="updateCart" />

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <span class="logo-dot"></span>
          <span>CRM 会员商城</span>
        </div>
        <p>大学生专属购物平台 · 正品保障 · 极速退款</p>
        <div class="footer-contact">客服热线：400-888-0000</div>
      </div>
      <div class="footer-nav">
        <div class="footer-col">
          <h4>购物指南</h4>
          <router-link to="/products">全部商品</router-link>
          <router-link to="/coupons">领券中心</router-link>
          <router-link to="/points">积分兑换</router-link>
          <router-link to="/group-buy">拼团优惠</router-link>
        </div>
        <div class="footer-col">
          <h4>会员服务</h4>
          <router-link to="/member">会员中心</router-link>
          <router-link to="/orders">我的订单</router-link>
          <router-link to="/profile">个人信息</router-link>
          <router-link to="/student-verify">学生认证</router-link>
        </div>
        <div class="footer-col">
          <h4>帮助支持</h4>
          <router-link to="/feedback">意见反馈</router-link>
          <a href="#">常见问题</a>
          <a href="#">退换政策</a>
          <a href="#">隐私协议</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      © 2026 CRM Platform · 粤ICP备12345678号 · 用心服务每位会员
    </div>
  </footer>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const cartCount = ref(0)
const user = ref(null)
const menuOpen = ref(false)

function updateCart() {
  cartCount.value = parseInt(localStorage.getItem('m_cart_count') || '0')
}
onMounted(() => {
  updateCart()
  user.value = JSON.parse(localStorage.getItem('m_user') || 'null')
  // Listen for storage changes
  window.addEventListener('storage', () => {
    updateCart()
    user.value = JSON.parse(localStorage.getItem('m_user') || 'null')
  })
})
</script>

<style>
/* ===== MINISO-Inspired Portal Design ===== */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

:root {
  --brand-red: #dc2626;
  --brand-dark: #1a1a2e;
  --brand-gold: #f59e0b;
  --white: #ffffff;
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-400: #a3a3a3;
  --gray-600: #525252;
  --gray-800: #262626;
  --radius: 12px;
  --shadow: 0 2px 20px rgba(0,0,0,.06);
}

*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;background:var(--white);color:var(--gray-800);-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}

/* Header */
.header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray-200)}
.header-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;height:64px;padding:0 24px;gap:32px}
.logo{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:800;color:var(--brand-dark)}
.logo-dot{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#dc2626,#f59e0b);position:relative;flex-shrink:0}
.logo-dot::after{content:'';position:absolute;inset:5px;background:var(--white);border-radius:50%}
.header-nav{display:flex;gap:24px;flex:1}
.header-nav a{font-size:14px;font-weight:500;color:var(--gray-600);padding:4px 0;border-bottom:2px solid transparent;transition:all .15s}
.header-nav a:hover,.header-nav a.active{color:var(--brand-dark);border-bottom-color:var(--brand-red)}
.header-right{display:flex;align-items:center;gap:16px}
.cart-link{position:relative;font-size:20px;display:flex;align-items:center}
.cart-link b{position:absolute;top:-6px;right:-8px;background:var(--brand-red);color:var(--white);font-size:10px;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700}
.user-link{font-size:13px;color:var(--gray-600);font-weight:500}
.login-link{font-size:13px;background:var(--brand-dark);color:var(--white);padding:6px 18px;border-radius:20px;font-weight:500;transition:opacity .15s}
.login-link:hover{opacity:.9}
.menu-btn{display:none;background:none;border:none;font-size:22px;cursor:pointer;color:var(--gray-800)}
.menu-overlay{display:none}

/* Footer */
.footer{background:var(--brand-dark);color:rgba(255,255,255,.7);margin-top:60px}
.footer-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:280px 1fr;gap:48px;padding:56px 24px 40px}
.footer-logo{display:flex;align-items:center;gap:8px;color:var(--white);font-size:18px;font-weight:700;margin-bottom:16px}
.footer-brand p{font-size:13px;line-height:1.7;margin-bottom:12px}
.footer-contact{font-size:13px;color:var(--brand-gold)}
.footer-nav{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
.footer-col h4{color:var(--white);font-size:14px;font-weight:600;margin-bottom:16px}
.footer-col a{display:block;font-size:13px;color:rgba(255,255,255,.6);padding:4px 0;transition:color .15s}
.footer-col a:hover{color:var(--white)}
.footer-bottom{max-width:1200px;margin:0 auto;padding:16px 24px;border-top:1px solid rgba(255,255,255,.08);font-size:12px;color:rgba(255,255,255,.4);text-align:center}

@media(max-width:768px){
  .header-nav,.header-right{display:none}
  .menu-btn{display:block;margin-left:auto}
  .header-inner{padding:0 16px;height:56px}
  .menu-overlay{display:block;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.4)}
  .menu-panel{position:fixed;top:0;right:0;width:280px;height:100%;background:var(--white);padding:20px;display:flex;flex-direction:column;gap:8px;animation:slideIn .3s ease}
  .menu-panel a{display:block;padding:14px 16px;font-size:15px;font-weight:500;color:var(--gray-800);border-radius:8px;transition:background .15s}
  .menu-panel a:hover{background:var(--gray-50)}
  .menu-close{text-align:right;font-size:18px;cursor:pointer;padding:8px;color:var(--gray-400)}
  .footer-inner{grid-template-columns:1fr;gap:32px;padding:40px 20px 32px}
  .footer-nav{grid-template-columns:repeat(2,1fr)}
}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
</style>
