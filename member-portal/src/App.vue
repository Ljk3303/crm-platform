<template>
  <div class="app">
    <header class="mobile-header">
      <router-link to="/" class="logo-text" style="text-decoration:none;font-size:18px;font-weight:700;color:#0f172a;">CRM 会员商城</router-link>
      <div style="flex:1"></div>
      <router-link to="/cart" style="position:relative;font-size:20px;text-decoration:none;padding:6px;">
        🛒<span v-if="cartCount" style="position:absolute;top:0;right:0;background:#ef4444;color:#fff;font-size:10px;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;">{{ cartCount }}</span>
      </router-link>
    </header>

    <main class="app-home"><router-view /></main>

    <nav class="mobile-tabbar">
      <router-link to="/" class="tab-item" exact-active-class="active">
        <span class="tab-icon">🏠</span><span>首页</span>
      </router-link>
      <router-link to="/products" class="tab-item" active-class="active">
        <span class="tab-icon">🔍</span><span>发现</span>
      </router-link>
      <router-link to="/cart" class="tab-item" active-class="active">
        <span class="tab-icon">🛒</span><span>购物车</span>
      </router-link>
      <router-link to="/profile" class="tab-item" active-class="active">
        <span class="tab-icon">👤</span><span>我的</span>
      </router-link>
    </nav>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const cartCount = ref(0)
onMounted(() => {
  const count = localStorage.getItem('m_cart_count')
  if (count) cartCount.value = parseInt(count)
})
</script>
<style scoped>
.app{min-height:100vh;display:flex;flex-direction:column;background:#f8fafc}
.app-home{flex:1;padding-bottom:calc(60px + env(safe-area-inset-bottom, 0px) + 16px)}
</style>
