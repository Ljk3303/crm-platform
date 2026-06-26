<template>
<div class="home">
  <!-- Hero Banner Swiper -->
  <div class="hero-swiper" ref="swiperRef">
    <div class="swiper-track" :style="{transform:'translateX(-'+(currentSlide*100)+'%)'}">
      <div v-for="(b,i) in banners" :key="i" class="swiper-slide"
        :style="{background: b.bg}">
        <div class="slide-content">
          <div class="slide-tag">{{ b.tag }}</div>
          <h2>{{ b.title }}</h2>
          <p>{{ b.desc }}</p>
          <router-link :to="b.link" class="slide-btn">{{ b.btn }}</router-link>
        </div>
        <div class="slide-emoji">{{ b.emoji }}</div>
      </div>
    </div>
    <div class="swiper-dots">
      <span v-for="(b,i) in banners" :key="i" :class="{active:i===currentSlide}" @click="currentSlide=i"></span>
    </div>
    <button class="swiper-arrow left" @click="prev">‹</button>
    <button class="swiper-arrow right" @click="next">›</button>
  </div>

  <!-- Stats Counter -->
  <div class="stats">
    <div class="container">
      <div class="stats-row">
        <div class="stat" v-for="s in statsData" :key="s.label">
          <div class="stat-num">{{ s.num }}<small>{{ s.unit }}</small></div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Category Pills -->
  <section class="section">
    <div class="container">
      <div class="section-hd">
        <h2>商品分类</h2>
        <p>精选好物，一站购齐</p>
      </div>
      <div class="cat-scroll">
        <span :class="['cat-item',{on:!activeCat}]" @click="activeCat='';goAll()"><span class="cat-icon">🔥</span>全部</span>
        <span v-for="c in categories" :key="c" :class="['cat-item',{on:activeCat===c}]" @click="activeCat=c;goCat(c)">
          <span class="cat-icon">{{ catIcons[c] }}</span>{{ c }}
        </span>
      </div>
    </div>
  </section>

  <!-- Hot Products Carousel -->
  <section class="section bg-gray">
    <div class="container">
      <div class="section-hd">
        <h2>热销爆款</h2>
        <p>千万会员的选择</p>
        <router-link to="/products" class="more-link">查看全部 →</router-link>
      </div>
      <div class="prod-scroll" ref="prodScroll">
        <div class="prod-track">
          <router-link v-for="p in hotProducts" :key="p.id" :to="'/products/'+p.id" class="prod-card">
            <div class="prod-img">
              <div class="prod-emoji">{{ getEmoji(p.category) }}</div>
              <div v-if="p.sales_count>10" class="prod-badge">HOT</div>
            </div>
            <div class="prod-info">
              <div class="prod-name">{{ p.name }}</div>
              <div class="prod-price">{{ (p.member_price||p.price) }}
                <span class="prod-orig" v-if="p.member_price">¥{{ p.price }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </section>

  <!-- Member Tiers -->
  <section class="section">
    <div class="container">
      <div class="section-hd">
        <h2>会员权益</h2>
        <p>消费越多，权益越大</p>
      </div>
      <div class="tier-row">
        <div v-for="t in tiers" :key="t.id" :class="['tier-card','lvl'+t.id]">
          <div class="tier-badge">{{ tierIcons[t.id] }}</div>
          <h3>{{ t.name }}</h3>
          <div class="tier-benefits">{{ t.benefits || '会员专属折扣' }}</div>
          <div class="tier-min">满¥{{ (t.min_spending||0) }}升级</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Group Buy -->
  <section class="section" v-if="groupBuys.length">
    <div class="container">
      <div class="section-hd">
        <h2>拼团特惠</h2>
        <p>叫上朋友一起省</p>
      </div>
      <div class="prod-scroll">
        <div class="prod-track">
          <div v-for="g in groupBuys" :key="g.id" class="prod-card gb" @click="$router.push('/group-buy')">
            <div class="prod-img gb-img">
              <div class="prod-emoji">👥</div>
              <div class="gb-tag">{{ g.discount_rate ? Math.round(g.discount_rate*10)+'折' : '拼团' }}</div>
            </div>
            <div class="prod-info">
              <div class="prod-name">{{ g.title || g.product_name }}</div>
              <div class="prod-price gb-price">
                ¥{{ (g.discount_rate*(g.price||99)).toFixed(0) }}
                <span class="gb-status">{{ g.current_members||0 }}/{{ g.min_members||3 }}人参团</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- News/Blog -->
  <section class="section">
    <div class="container">
      <div class="section-hd">
        <h2>最新动态</h2>
        <p>校园活动 · 品牌资讯</p>
      </div>
      <div class="news-grid">
        <div v-for="n in news" :key="n.id" class="news-card">
          <div class="news-img" :style="{background:n.color}">
            <div class="news-emoji">{{ n.emoji }}</div>
          </div>
          <div class="news-body">
            <div class="news-date">{{ n.date }}</div>
            <h4>{{ n.title }}</h4>
            <p>{{ n.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
const router = useRouter()

const currentSlide = ref(0)
const activeCat = ref('')
const hotProducts = ref([])
const categories = ref([])
const tiers = ref([])
const groupBuys = ref([])
let autoSlide = null
let swiperTimer = null

const banners = ref([
  { bg:'linear-gradient(135deg,#1a1a2e 0%,#2d1b3d 100%)', tag:'新品上市', title:'2026 春季新品', desc:'全场满200减50 · 会员折上折', link:'/products', btn:'立即抢购', emoji:'🛍️' },
  { bg:'linear-gradient(135deg,#dc2626 0%,#991b1b 100%)', tag:'限时秒杀', title:'会员日特惠', desc:'精选爆款低至5折 · 限时24小时', link:'/coupons', btn:'领券抢购', emoji:'🔥' },
  { bg:'linear-gradient(135deg,#0f766e 0%,#0d9488 100%)', tag:'学生专属', title:'大学生认证福利', desc:'学生认证送100积分 · 专属折扣', link:'/student-verify', btn:'立即认证', emoji:'🎓' },
  { bg:'linear-gradient(135deg,#d97706 0%,#b45309 100%)', tag:'拼团优惠', title:'3人成团更便宜', desc:'低至6折 · 分享好友一起省', link:'/group-buy', btn:'开团拼单', emoji:'👥' },
])

const statsData = [
  { num:'2.8', unit:'万', label:'注册会员' },
  { num:'5.6', unit:'万+', label:'订单总量' },
  { num:'98', unit:'%', label:'好评率' },
  { num:'300', unit:'+', label:'合作品牌' },
]

const catIcons = { '家居':'🏠','美妆':'💄','文具':'✏️','数码':'📱','服饰':'👗' }
const catEmojis = { '家居':'🧴','美妆':'💋','文具':'📒','数码':'📲','服饰':'👔' }
const tierIcons = { 1:'🥉',2:'🥈',3:'🥇',4:'💎' }
function getEmoji(c) { return catEmojis[c]||'🎁' }
function goCat(c) { router.push('/products?category='+encodeURIComponent(c)) }
function goAll() { router.push('/products') }
function prev() { currentSlide.value = currentSlide.value===0?banners.length-1:currentSlide.value-1 }
function next() { currentSlide.value = currentSlide.value===banners.length-1?0:currentSlide.value+1 }

const news = [
  { id:1, title:'2026春季新品发布', date:'06-15', desc:'全新美妆系列上线 · 限时9折', emoji:'🌸', color:'linear-gradient(135deg,#fce7f3,#fbcfe8)' },
  { id:2, title:'会员日回馈活动', date:'06-10', desc:'积分翻倍 · 满额抽奖', emoji:'🎁', color:'linear-gradient(135deg,#fef3c7,#fde68a)' },
  { id:3, title:'大学城校园活动', date:'06-05', desc:'六城联动推广 · 好礼送不停', emoji:'🏫', color:'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
]

// Demo data
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
    { id:1,name:'铜牌会员',benefits:'9.5折 · 积分获取',min_spending:0 },
    { id:2,name:'银牌会员',benefits:'9折 · 生日好礼',min_spending:500 },
    { id:3,name:'金牌会员',benefits:'8.5折 · 免运费',min_spending:2000 },
    { id:4,name:'钻石会员',benefits:'8折 · 专属客服',min_spending:5000 },
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
    if (res?.banners?.length) banners.value = res.banners
    if (res?.hotProducts?.length) hotProducts.value = res.hotProducts
    if (res?.tiers?.length) tiers.value = res.tiers
    if (res?.groupBuys?.length) groupBuys.value = res.groupBuys
  } catch {}
  try { const cats = await request.get('/products/categories'); if (cats?.length) categories.value = cats } catch {}
  autoSlide = setInterval(next, 5000)
})

onUnmounted(() => { clearInterval(autoSlide) })
</script>

<style scoped>
.home{overflow:hidden}
.container{max-width:1200px;margin:0 auto;padding:0 24px}

/* Hero Swiper */
.hero-swiper{position:relative;height:420px;overflow:hidden}
.swiper-track{display:flex;height:100%;transition:transform .6s cubic-bezier(.4,0,.2,1)}
.swiper-slide{min-width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:24px;padding:0 24px}
.slide-content{flex:1;max-width:520px;color:#fff;animation:fadeUp .6s ease}
.slide-tag{display:inline-block;background:rgba(255,255,255,.2);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:.5px;margin-bottom:12px;backdrop-filter:blur(8px)}
.slide-content h2{font-size:36px;font-weight:800;margin:0 0 8px;letter-spacing:-.5px;line-height:1.2}
.slide-content p{font-size:16px;margin:0 0 20px;opacity:.85}
.slide-btn{display:inline-block;background:#fff;color:#1a1a2e;padding:12px 32px;border-radius:28px;font-size:14px;font-weight:700;transition:transform .15s}
.slide-btn:hover{transform:translateY(-2px)}
.slide-emoji{font-size:100px;opacity:.6;flex-shrink:0}
.swiper-dots{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:8px}
.swiper-dots span{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.4);cursor:pointer;transition:all .3s}
.swiper-dots span.active{background:#fff;width:28px;border-radius:5px}
.swiper-arrow{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);border:none;color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;backdrop-filter:blur(8px)}
.swiper-arrow:hover{background:rgba(255,255,255,.3)}
.swiper-arrow.left{left:16px}.swiper-arrow.right{right:16px}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

/* Stats */
.stats{padding:32px 0;background:#fff}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.stat{text-align:center;padding:20px}
.stat-num{font-size:36px;font-weight:900;color:#1a1a2e;line-height:1.2;letter-spacing:-1px}
.stat-num small{font-size:16px;font-weight:600;color:#dc2626;margin-left:2px}
.stat-label{font-size:13px;color:#737373;margin-top:4px}

/* Sections */
.section{padding:48px 0}
.section.bg-gray{background:#fafafa}
.section-hd{text-align:center;margin-bottom:32px}
.section-hd h2{font-size:28px;font-weight:800;color:#1a1a2e;margin:0 0 6px;letter-spacing:-.5px}
.section-hd p{font-size:14px;color:#737373;margin:0}
.more-link{display:inline-block;margin-top:8px;font-size:13px;color:#dc2626;font-weight:600}

/* Categories */
.cat-scroll{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:4px 0;justify-content:center;flex-wrap:wrap}
.cat-scroll::-webkit-scrollbar{display:none}
.cat-item{display:inline-flex;align-items:center;gap:4px;padding:10px 20px;border-radius:24px;font-size:14px;font-weight:500;background:#f5f5f5;color:#525252;cursor:pointer;white-space:nowrap;transition:all .15s}
.cat-item:hover{background:#e5e5e5}
.cat-item.on{background:#1a1a2e;color:#fff}
.cat-icon{font-size:16px}

/* Product Carousel */
.prod-scroll{overflow-x:auto;scrollbar-width:none;padding:4px 0 8px}
.prod-scroll::-webkit-scrollbar{display:none}
.prod-track{display:flex;gap:16px}
.prod-card{flex-shrink:0;width:220px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e5e5;transition:all .2s;cursor:pointer;display:block}
.prod-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.08)}
.prod-img{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#fafafa;position:relative}
.prod-emoji{font-size:48px}
.prod-badge{position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#dc2626,#ea580c);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px}
.prod-info{padding:14px 16px}
.prod-name{font-size:14px;font-weight:500;color:#1a1a2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:6px}
.prod-price{font-size:18px;font-weight:700;color:#dc2626;display:flex;align-items:baseline;gap:6px}
.prod-price::before{content:'¥';font-size:12px}
.prod-orig{font-size:12px;color:#a3a3a3;text-decoration:line-through;font-weight:400}
/* Group Buy */
.prod-card.gb .prod-img.gb-img{background:linear-gradient(135deg,#fef3c7,#fde68a)}
.gb-tag{position:absolute;top:8px;right:8px;background:#f59e0b;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px}
.gb-price{color:#f59e0b!important}
.gb-status{font-size:11px;font-weight:400;color:#737373}

/* Tiers */
.tier-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.tier-card{text-align:center;padding:28px 20px;border-radius:16px;border:2px solid #e5e5e5;transition:all .2s}
.tier-card:hover{transform:translateY(-4px)}
.tier-card.lvl3{border-color:#f59e0b;background:linear-gradient(135deg,#fffbeb,#fef3c7)}
.tier-card.lvl4{border-color:#6366f1;background:linear-gradient(135deg,#eef2ff,#e0e7ff)}
.tier-badge{font-size:32px;margin-bottom:8px}
.tier-card h3{font-size:16px;font-weight:700;color:#1a1a2e;margin:0 0 8px}
.tier-benefits{font-size:13px;color:#525252;line-height:1.6}
.tier-min{margin-top:12px;font-size:12px;color:#dc2626;font-weight:600}

/* News */
.news-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.news-card{border-radius:14px;overflow:hidden;border:1px solid #e5e5e5;background:#fff;transition:all .2s}
.news-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.08)}
.news-img{width:100%;height:140px;display:flex;align-items:center;justify-content:center}
.news-emoji{font-size:48px}
.news-body{padding:16px 20px}
.news-date{font-size:11px;color:#a3a3a3;font-weight:500;margin-bottom:6px}
.news-body h4{font-size:15px;font-weight:600;color:#1a1a2e;margin:0 0 6px}
.news-body p{font-size:13px;color:#525252;margin:0;line-height:1.5}

@media(max-width:768px){
  .hero-swiper{height:320px}
  .slide-content h2{font-size:24px}
  .slide-emoji{font-size:60px}
  .swiper-arrow{display:none}
  .stats-row{grid-template-columns:repeat(2,1fr)}
  .prod-card{width:160px}
  .tier-row{grid-template-columns:repeat(2,1fr)}
  .news-grid{grid-template-columns:1fr}
  .section{padding:32px 0}
}
</style>
