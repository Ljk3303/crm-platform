<template><div class="pp">
  <div class="pp-search"><input v-model="keyword" placeholder="搜索商品" @input="search" class="mobile-input" /></div>
  <div class="cat-scroll"><span class="cat-tag" :class="{on:!activeCat}" @click="activeCat='';fetch()">全部</span><span v-for="c in categories" :key="c" class="cat-tag" :class="{on:activeCat===c}" @click="activeCat=c;fetch()">{{ c }}</span></div>
  <div class="pp-sort"><span :class="{on:sortBy===''}" @click="sortBy='';fetch()">综合</span><span :class="{on:sortBy==='sales'}" @click="sortBy='sales';fetch()">销量</span><span :class="{on:sortBy==='price_asc'}" @click="sortBy='price_asc';fetch()">价格↑</span><span :class="{on:sortBy==='price_desc'}" @click="sortBy='price_desc';fetch()">价格↓</span></div>
  <div v-if="loading" class="mobile-skeleton"><div class="sk-card" v-for="i in 4" :key="i"></div></div>
  <div v-else class="pgrid"><router-link v-for="p in products" :key="p.id" :to="'/products/'+p.id" class="pcard">
    <div class="pcard-img"><div class="pcard-emoji">{{ catEmo(p.category) }}</div></div>
    <div class="pcard-info"><div class="pcard-name">{{ p.name }}</div><div class="pcard-price">¥{{ p.price }}<span class="pcard-sold">{{ p.sales_count||0 }}件</span></div></div>
  </router-link></div>
  <el-pagination v-if="total>20" v-model:current-page="page" :page-size="20" :total="total" layout="prev,pager,next" @current-change="fetch" small class="pp-page"/>
</div></template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
const route = useRoute()
const products = ref([])
const categories = ref([])
const activeCat = ref('')
const keyword = ref('')
const sortBy = ref('')
const page = ref(1)
const total = ref(0)
const loading = ref(true)
const catE = { '家居':'🧴','美妆':'💋','文具':'📒','数码':'📲','服饰':'👔' }
function catEmo(c) { return catE[c]||'🎁' }
const DEMO = [
  { id:18,name:'日系简约双肩包',category:'服饰',price:129.9,sales_count:17 },
  { id:5,name:'马克杯',category:'家居',price:67,sales_count:4 },
  { id:1,name:'面膜套装',category:'美妆',price:59.9,sales_count:2 },
  { id:16,name:'香薰加湿器',category:'家居',price:89.9,sales_count:1 },
  { id:2,name:'手帐本',category:'文具',price:35,sales_count:1 },
  { id:10,name:'三丽鸥笔袋',category:'文具',price:29.9,sales_count:3 },
  { id:3,name:'遮光眼罩',category:'家居',price:25,sales_count:5 },
  { id:7,name:'帆布袋',category:'服饰',price:39.9,sales_count:2 },
  { id:12,name:'保温杯',category:'家居',price:49.9,sales_count:6 },
  { id:4,name:'无线耳机',category:'数码',price:199,sales_count:8 },
  { id:8,name:'防晒霜',category:'美妆',price:79.9,sales_count:7 },
  { id:9,name:'笔记本套装',category:'文具',price:45,sales_count:3 },
]
async function fetch() {
  loading.value = true
  try {
    const params = { page: page.value, size: 20 }
    if (activeCat.value) params.category = activeCat.value
    if (keyword.value) params.keyword = keyword.value
    if (sortBy.value) params.sort = sortBy.value
    const res = await request.get('/products/list', { params })
    if (res?.records?.length) { products.value = res.records; total.value = res.total||0; }
    else { products.value = DEMO; total.value = DEMO.length }
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
.pp{padding:0 12px 80px}
.pp-search{padding:10px 0}
.cat-scroll{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:4px 0 10px}
.cat-scroll::-webkit-scrollbar{display:none}
.cat-tag{flex-shrink:0;padding:6px 14px;border-radius:16px;font-size:12px;background:#f1f5f9;color:#475569;cursor:pointer;white-space:nowrap}
.cat-tag.on{background:#3b82f6;color:#fff}
.pp-sort{display:flex;gap:16px;padding:8px 0 12px;font-size:13px;color:#94a3b8}
.pp-sort span{cursor:pointer}
.pp-sort span.on{color:#3b82f6;font-weight:600}
.pgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.pcard{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;text-decoration:none;color:inherit;transition:transform .1s}
.pcard:active{transform:scale(.97)}
.pcard-img{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#f8fafc}
.pcard-emoji{font-size:36px}
.pcard-info{padding:10px 12px}
.pcard-name{font-size:13px;font-weight:500;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pcard-price{font-size:15px;font-weight:700;color:#ef4444;margin-top:4px;display:flex;align-items:baseline;gap:6px}
.pcard-sold{font-size:11px;font-weight:400;color:#94a3b8}
.pp-page{padding:20px 0;display:flex;justify-content:center}
.mobile-skeleton{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.sk-card{background:#f1f5f9;border-radius:12px;aspect-ratio:.8;animation:sk-pulse 1.5s ease-in-out infinite}@keyframes sk-pulse{0%,100%{opacity:1}50%{opacity:.5}}
</style>
