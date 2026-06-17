<template><div class="pl">
  <div class="pl-top">
    <div class="pl-search"><input v-model="keyword" placeholder="搜索商品..." @input="search" /></div>
    <div class="pl-sort">
      <span :class="{on:sortBy===''}" @click="sortBy='';fetch()">综合</span>
      <span :class="{on:sortBy==='sales'}" @click="sortBy='sales';fetch()">销量</span>
      <span :class="{on:sortBy==='price_asc'}" @click="sortBy='price_asc';fetch()">价格↑</span>
      <span :class="{on:sortBy==='price_desc'}" @click="sortBy='price_desc';fetch()">价格↓</span>
    </div>
  </div>
  <div class="pl-cats">
    <span :class="{on:!activeCat}" @click="activeCat='';fetch()">全部</span>
    <span v-for="c in categories" :key="c" :class="{on:activeCat===c}" @click="activeCat=c;fetch()">
      {{ cIcons[c] }} {{ c }}
    </span>
  </div>
  <div v-if="loading" class="pl-skel">
    <div v-for="i in 4" :key="i" class="pl-skel-card"></div>
  </div>
  <div v-else class="pl-grid">
    <router-link v-for="p in products" :key="p.id" :to="'/products/'+p.id" class="pl-card">
      <div class="pl-card-img"><div class="pl-emoji">{{ pEmoji(p.category) }}</div></div>
      <div class="pl-card-info">
        <div class="pl-card-name">{{ p.name }}</div>
        <div class="pl-card-price">¥{{ p.price }}<span>{{ p.sales_count||0 }}件已售</span></div>
      </div>
    </router-link>
  </div>
  <div class="pl-page" v-if="total>20">
    <button v-for="i in pages" :key="i" :class="{on:page===i}" @click="page=i;fetch()">{{ i }}</button>
  </div>
</div></template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
const route = useRoute()
const products = ref([]), categories = ref([]), activeCat = ref(''), keyword = ref(''), sortBy = ref(''), page = ref(1), total = ref(0), loading = ref(true)
const cIcons = { '家居':'🏠','美妆':'💄','文具':'✏️','数码':'📱','服饰':'👗' }, eMap = { '家居':'🧴','美妆':'💋','文具':'📒','数码':'📲','服饰':'👔' }
function pEmoji(c) { return eMap[c]||'🎁' }
const pages = computed(() => { const n = Math.ceil(total.value/20); return Array.from({length:Math.min(n,5)},(_,i)=>i+1) })
const DEMO = [
  { id:18,name:'日系简约双肩包',category:'服饰',price:129.9,sales_count:17 },{ id:5,name:'马克杯',category:'家居',price:67,sales_count:4 },
  { id:1,name:'面膜套装',category:'美妆',price:59.9,sales_count:2 },{ id:16,name:'香薰加湿器',category:'家居',price:89.9,sales_count:1 },
  { id:2,name:'手帐本',category:'文具',price:35,sales_count:1 },{ id:10,name:'三丽鸥笔袋',category:'文具',price:29.9,sales_count:3 },
  { id:3,name:'遮光眼罩',category:'家居',price:25,sales_count:5 },{ id:7,name:'帆布袋',category:'服饰',price:39.9,sales_count:2 },
  { id:12,name:'保温杯',category:'家居',price:49.9,sales_count:6 },{ id:4,name:'无线耳机',category:'数码',price:199,sales_count:8 },
  { id:8,name:'防晒霜',category:'美妆',price:79.9,sales_count:7 },{ id:9,name:'笔记本套装',category:'文具',price:45,sales_count:3 },
]
async function fetch() {
  loading.value = true
  try { const params = { page: page.value, size: 20 }; if (activeCat.value) params.category = activeCat.value; if (keyword.value) params.keyword = keyword.value; if (sortBy.value) params.sort = sortBy.value
    const res = await request.get('/products/list', { params }); if (res?.records?.length) { products.value = res.records; total.value = res.total||0 } else { products.value = DEMO; total.value = DEMO.length }
  } catch { products.value = DEMO; total.value = DEMO.length }
  loading.value = false
}
let timer = null
function search() { clearTimeout(timer); timer = setTimeout(()=>{page.value=1;fetch()},400) }
onMounted(async () => {
  if (route.query.category) activeCat.value = route.query.category
  try { const cats = await request.get('/products/categories'); if (cats?.length) categories.value = cats } catch { categories.value = ['美妆','文具','家居','服饰','数码'] }
  fetch()
})
</script>
<style scoped>
.pl{max-width:1200px;margin:0 auto;padding:20px 24px 60px}
.pl-top{display:flex;align-items:center;gap:16px;margin-bottom:16px}
.pl-search{flex:1}
.pl-search input{width:100%;height:42px;padding:0 16px;border:1px solid #e5e5e5;border-radius:10px;font-size:14px;outline:none;transition:border-color .15s}
.pl-search input:focus{border-color:#1a1a2e}
.pl-sort{display:flex;gap:14px;font-size:13px;color:#737373;flex-shrink:0}
.pl-sort span{cursor:pointer;white-space:nowrap}
.pl-sort span.on{color:#dc2626;font-weight:600}
.pl-cats{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin-bottom:20px;padding:4px 0}
.pl-cats::-webkit-scrollbar{display:none}
.pl-cats span{flex-shrink:0;padding:8px 16px;border-radius:20px;font-size:13px;background:#f5f5f5;color:#525252;cursor:pointer;white-space:nowrap;transition:all .15s}
.pl-cats span.on{background:#1a1a2e;color:#fff}
.pl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.pl-card{background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e5e5;transition:all .2s;text-decoration:none;color:inherit;display:block}
.pl-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.08)}
.pl-card-img{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#fafafa}
.pl-emoji{font-size:48px}
.pl-card-info{padding:14px 16px}
.pl-card-name{font-size:14px;font-weight:500;color:#1a1a2e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:6px}
.pl-card-price{font-size:18px;font-weight:700;color:#dc2626;display:flex;align-items:baseline;gap:8px}
.pl-card-price span{font-size:11px;color:#a3a3a3;font-weight:400}
.pl-skel{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.pl-skel-card{background:#f5f5f5;border-radius:14px;aspect-ratio:.8;animation:sk-pulse 1.5s ease-in-out infinite}
@keyframes sk-pulse{0%,100%{opacity:1}50%{opacity:.5}}
.pl-page{display:flex;justify-content:center;gap:8px;padding:30px 0}
.pl-page button{width:36px;height:36px;border-radius:8px;border:1px solid #e5e5e5;background:#fff;font-size:14px;cursor:pointer;transition:all .15s}
.pl-page button.on{background:#1a1a2e;color:#fff;border-color:#1a1a2e}
@media(max-width:900px){.pl-grid{grid-template-columns:repeat(2,1fr)}.pl-skel{grid-template-columns:repeat(2,1fr)}}
</style>
