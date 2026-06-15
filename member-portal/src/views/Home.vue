<template>
<div class="page">
  <!-- Hero -->
  <div class="hero-section">
    <h1>{{ notice }}</h1>
    <p>全场满200减50 · 新人注册送100积分 · 每日签到领好礼</p>
    <router-link to="/products" class="hero-btn">立即抢购 →</router-link>
  </div>

  <!-- Flash Sale -->
  <div v-if="flashItems.length" class="flash-section">
    <div class="section-hd">
      <h2>⚡ 限时秒杀</h2>
      <div class="flash-countdown">
        <span>距结束</span><span class="cd-box">{{ countdown.h }}</span>:<span class="cd-box">{{ countdown.m }}</span>:<span class="cd-box">{{ countdown.s }}</span>
      </div>
    </div>
    <div class="flash-grid">
      <router-link v-for="f in flashItems" :key="f.id" :to="'/products/'+f.id" class="flash-card">
        <div class="flash-emoji">{{ getEmoji(f.category) }}</div>
        <div class="flash-name">{{ f.name }}</div>
        <span class="flash-price">¥{{ f.flashPrice }}</span>
        <span class="flash-orig">¥{{ f.price }}</span>
      </router-link>
    </div>
  </div>

  <!-- Categories -->
  <div class="section"><div class="section-hd"><h2>🎯 商品分类</h2></div>
    <div class="cat-pills">
      <span class="cat-pill" :class="{active:!activeCat}" @click="activeCat=''">全部</span>
      <span v-for="c in categories" :key="c" class="cat-pill" :class="{active:activeCat===c}" @click="activeCat=c;goCategory(c)">{{ getCatIcon(c) }} {{ c }}</span>
    </div>
  </div>

  <!-- Hot Products -->
  <div class="section"><div class="section-hd"><h2>🔥 热销爆款</h2><router-link to="/products" class="more">查看全部 →</router-link></div>
    <div class="prod-grid">
      <router-link v-for="p in hotProducts" :key="p.id" :to="'/products/'+p.id" class="prod-card">
        <div class="prod-img">
          <img v-if="getProdImg(p.images)" :src="getProdImg(p.images)" class="prod-img-real" />
          <div v-else class="prod-img-bg">{{ getEmoji(p.category) }}</div>
          <span v-if="p.sales_count>20" class="prod-tag">热卖</span></div>
        <div class="prod-info"><div class="prod-name">{{ p.name }}</div><div class="prod-desc">{{ p.specification }}</div>
          <div class="prod-price-row"><span class="prod-price">¥{{ p.price }}</span><span v-if="p.member_price && p.member_price<p.price" class="prod-orig">¥{{ p.price }}</span><span class="prod-sold">已售{{ p.sales_count||0 }}</span></div>
        </div>
      </router-link>
    </div>
  </div>

  <!-- Member Tiers -->
  <div class="section"><div class="section-hd"><h2>🎖️ 会员权益</h2></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
      <div v-for="t in tiers" :key="t.id" style="background:#fff;border-radius:14px;padding:20px;text-align:center;border:2px solid" :style="{borderColor:t.id===3?'#D4A574':t.id===4?'#E5E7EB':t.id===2?'#9CA3AF':'#F59E0B'}">
        <div style="font-size:28px;margin-bottom:6px">{{ tierIcon(t.id) }}</div>
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">{{ t.name }}</div>
        <div style="font-size:13px;color:#6B7280;line-height:1.6">{{ t.benefits }}</div>
        <div style="margin-top:8px;font-size:12px;color:var(--pri);font-weight:600">满¥{{ t.min_spending }}升级</div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const notice = ref('新品上市 · 限时特惠')
const flashItems = ref([])
const hotProducts = ref([])
const categories = ref([])
const tiers = ref([])
const activeCat = ref('')
const countdown = reactive({ h: '00', m: '00', s: '00' })
let timer = null

const catEmojis = { '家居': '🏠', '美妆': '💄', '文具': '✏️', '数码': '📱', '服饰': '👗' }
const prodEmojis = { '家居': '🏠', '美妆': '💄', '文具': '✏️', '数码': '📱', '服饰': '👗' }
const tierIcons = { 1: '🥉', 2: '🥈', 3: '🥇', 4: '💎' }

function getCatIcon(c) { return catEmojis[c] || '📦' }
function getEmoji(c) { return prodEmojis[c] || '🎁' }
function getProdImg(images) { if (!images) return ''; try { const arr = JSON.parse(images); return arr[0] || '' } catch { return images.startsWith('/') ? images : '' } }
function tierIcon(id) { return tierIcons[id] || '🎖' }
function goCategory(c) { router.push('/products?category=' + encodeURIComponent(c)) }

function updateCountdown() {
  const now = Date.now()
  const target = new Date().setHours(23, 59, 59, 999)
  if (now >= target) { timer && clearInterval(timer); return }
  const diff = Math.floor((target - now) / 1000)
  countdown.h = String(Math.floor(diff / 3600)).padStart(2, '0')
  countdown.m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
  countdown.s = String(diff % 60).padStart(2, '0')
}

onMounted(async () => {
  try {
    const [home, cats, ts] = await Promise.all([
      request.get('/public/home-data'),
      request.get('/products/categories'),
      request.get('/member/tiers'),
    ])
    notice.value = home.notice?.config_value || '新品上市 · 限时特惠'
    hotProducts.value = home.hotProducts || []
    categories.value = cats || []
    tiers.value = ts || []
    
    // Flash sale from config
    const cfgs = home.banners?.config_value || '[]'
    try {
      const fl = JSON.parse(cfgs)
      if (fl.length) {
        flashItems.value = fl.filter(f => f.flashPrice).map(f => {
          const p = hotProducts.value.find(x => x.id === f.productId)
          return p ? { ...p, flashPrice: f.flashPrice } : null
        }).filter(Boolean)
      }
    } catch {}
    
    // Also get flash_sale config
    try {
      const flashData = await request.get('/public/home-data')
      // Use product member_price as flash price indicator
      flashItems.value = hotProducts.value
        .filter(p => p.member_price && p.member_price < p.price * 0.6)
        .slice(0, 6)
        .map(p => ({ ...p, flashPrice: p.member_price }))
    } catch {}
  } catch (e) { console.error(e) }
  timer = setInterval(updateCountdown, 1000)
  updateCountdown()
})

onUnmounted(() => { timer && clearInterval(timer) })
</script>
