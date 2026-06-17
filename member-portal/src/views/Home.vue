<template>
<div class="mobile-page">
  <!-- Hero -->
  <div class="hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <h1>{{ notice }}</h1>
      <p>全场满200减50 · 新人送100积分 · 每日签到领好礼</p>
      <router-link to="/products" class="hero-btn">立即抢购</router-link>
    </div>
  </div>

  <!-- Categories -->
  <div class="sec">
    <div class="sec-hd"><h2>商品分类</h2></div>
    <div class="cat-scroll">
      <span class="cat-tag" :class="{on:!activeCat}" @click="activeCat='';goAll()">全部</span>
      <span v-for="c in categories" :key="c" class="cat-tag" :class="{on:activeCat===c}" @click="activeCat=c;goCat(c)">{{ catIcon(c) }} {{ c }}</span>
    </div>
  </div>

  <!-- Hot Products -->
  <div class="sec">
    <div class="sec-hd"><h2>热销爆款</h2><router-link to="/products" class="more">全部</router-link></div>
    <div class="pgrid">
      <router-link v-for="p in hotProducts" :key="p.id" :to="'/products/'+p.id" class="pcard">
        <div class="pcard-img"><div class="pcard-emoji">{{ prodEmoji(p.category) }}</div></div>
        <div class="pcard-info">
          <div class="pcard-name">{{ p.name }}</div>
          <div class="pcard-price">¥{{ p.price }}<span class="pcard-sold">已售{{ p.sales_count||0 }}</span></div>
        </div>
      </router-link>
    </div>
  </div>

  <!-- Member Tiers -->
  <div class="sec">
    <div class="sec-hd"><h2>会员权益</h2></div>
    <div class="tier-row">
      <div v-for="t in tiers" :key="t.id" class="tier" :class="'lvl'+t.id">
        <div class="tier-icon">{{ tierIcon(t.id) }}</div>
        <div class="tier-name">{{ t.name }}</div>
        <div class="tier-desc">{{ t.benefits || '会员专属福利' }}</div>
        <div class="tier-floor">消费满¥{{ t.min_spending||0 }}升级</div>
      </div>
    </div>
  </div>

  <!-- Group Buy -->
  <div class="sec" v-if="groupBuys.length">
    <div class="sec-hd"><h2>拼团优惠</h2></div>
    <div class="pgrid">
      <div v-for="g in groupBuys" :key="g.id" class="pcard" @click="$router.push('/group-buy')">
        <div class="pcard-img"><div class="pcard-emoji">👥</div></div>
        <div class="pcard-info">
          <div class="pcard-name">{{ g.title||g.product_name }}</div>
          <div class="pcard-price" style="color:#f59e0b">¥{{ (g.discount_rate*(g.price||99)).toFixed(0) }}<span class="pcard-sold">{{ g.current_members||0 }}/{{ g.min_members||3 }}人参团</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const notice = ref('新品上市 · 限时特惠')
const hotProducts = ref([])
const categories = ref([])
const tiers = ref([])
const groupBuys = ref([])
const activeCat = ref('')

const catIcons = { '家居':'🏠','美妆':'💄','文具':'✏️','数码':'📱','服饰':'👗' }
const catEmoji = { '家居':'🧴','美妆':'💋','文具':'📒','数码':'📲','服饰':'👔' }
const tierIcons = { 1:'🥉',2:'🥈',3:'🥇',4:'💎' }
function catIcon(c) { return catIcons[c]||'📦' }
function prodEmoji(c) { return catEmoji[c]||'🎁' }
function tierIcon(id) { return tierIcons[id]||'⭐' }
function goCat(c) { router.push('/products?category='+encodeURIComponent(c)) }
function goAll() { router.push('/products') }

// Demo data (shown immediately, replaced by API if available)
const DEMO = {
  products: [
    { id:18,name:'日系简约双肩包',category:'服饰',price:129.9,member_price:99.9,sales_count:17 },
    { id:5,name:'马克杯',category:'家居',price:67,member_price:49,sales_count:4 },
    { id:1,name:'面膜套装',category:'美妆',price:59.9,member_price:39.9,sales_count:2 },
    { id:16,name:'香薰加湿器',category:'家居',price:89.9,member_price:69.9,sales_count:1 },
    { id:2,name:'手帐本',category:'文具',price:35,member_price:25,sales_count:1 },
    { id:10,name:'三丽鸥笔袋',category:'文具',price:29.9,sales_count:3 },
    { id:3,name:'遮光眼罩',category:'家居',price:25,sales_count:5 },
    { id:7,name:'帆布袋',category:'服饰',price:39.9,sales_count:2 },
  ],
  cats: ['美妆','文具','家居','服饰','数码'],
  tiers: [
    { id:1,name:'铜牌会员',benefits:'基础折扣 9.5折',min_spending:0 },
    { id:2,name:'银牌会员',benefits:'9折 + 生日礼',min_spending:500 },
    { id:3,name:'金牌会员',benefits:'8.5折 + 包邮',min_spending:2000 },
    { id:4,name:'钻石会员',benefits:'8折 + 专属客服',min_spending:5000 },
  ],
  groupBuys: [
    { id:1,title:'面膜套装3人团',discount_rate:0.7,price:59.9,min_members:3,current_members:2 },
    { id:2,title:'双肩包5人团',discount_rate:0.6,price:129.9,min_members:5,current_members:3 },
  ]
}

onMounted(async () => {
  hotProducts.value = DEMO.products
  categories.value = DEMO.cats
  tiers.value = DEMO.tiers
  groupBuys.value = DEMO.groupBuys
  try {
    const res = await request.get('/public/home-data')
    notice.value = res?.notice?.config_value || notice.value
    if (res?.hotProducts?.length) hotProducts.value = res.hotProducts
    if (res?.tiers?.length) tiers.value = res.tiers
    if (res?.groupBuys?.length) groupBuys.value = res.groupBuys
  } catch {}
  try {
    const cats = await request.get('/products/categories')
    if (cats?.length) categories.value = cats
  } catch {}
})
</script>

<style scoped>
.mobile-page{padding-bottom:80px}
/* Hero */
.hero{position:relative;margin:0 12px 14px;border-radius:18px;overflow:hidden;background:linear-gradient(135deg,#3b82f6,#6366f1);box-shadow:0 6px 24px rgba(59,130,246,.2)}
.hero-content{position:relative;z-index:1;padding:32px 24px;color:#fff}
.hero h1{font-size:22px;font-weight:800;margin:0 0 6px}
.hero p{font-size:13px;margin:0 0 18px;opacity:.9}
.hero-btn{display:inline-block;background:#fff;color:#2563eb;padding:10px 24px;border-radius:22px;font-weight:700;font-size:14px;text-decoration:none}
/* sections */
.sec{padding:0 12px;margin-bottom:18px}
.sec-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.sec-hd h2{font-size:16px;font-weight:700;color:#0f172a;margin:0}
.more{font-size:13px;color:#3b82f6;text-decoration:none}
/* categories */
.cat-scroll{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:4px 0}
.cat-scroll::-webkit-scrollbar{display:none}
.cat-tag{flex-shrink:0;padding:7px 16px;border-radius:18px;font-size:13px;background:#f1f5f9;color:#475569;cursor:pointer;white-space:nowrap;transition:all .15s}
.cat-tag.on{background:#3b82f6;color:#fff}
/* products grid */
.pgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.pcard{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;text-decoration:none;color:inherit;transition:transform .1s;cursor:pointer}
.pcard:active{transform:scale(.97)}
.pcard-img{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#f8fafc}
.pcard-emoji{font-size:36px}
.pcard-info{padding:10px 12px}
.pcard-name{font-size:13px;font-weight:500;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pcard-price{font-size:15px;font-weight:700;color:#ef4444;margin-top:4px;display:flex;align-items:baseline;gap:6px}
.pcard-sold{font-size:11px;font-weight:400;color:#94a3b8}
/* tiers */
.tier-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.tier{background:#fff;border-radius:12px;padding:16px 10px;text-align:center;border:2px solid #e2e8f0}
.tier.lvl3{border-color:#f59e0b;background:#fffbeb}
.tier.lvl4{border-color:#6366f1;background:#eef2ff}
.tier-icon{font-size:22px;margin-bottom:4px}
.tier-name{font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px}
.tier-desc{font-size:11px;color:#64748b;line-height:1.4}
.tier-floor{margin-top:6px;font-size:10px;color:#3b82f6;font-weight:600}
@media(max-width:480px){.tier-row{grid-template-columns:repeat(2,1fr)}}
</style>
