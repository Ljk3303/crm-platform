<template>
<div class="page">
  <div class="section-hd"><h2>全部商品</h2></div>
  <!-- Search & Filter -->
  <div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap">
    <el-input v-model="keyword" placeholder="搜索商品..." prefix-icon="Search" style="max-width:300px" clearable @input="search" size="large"/>
    <el-select v-model="sortBy" placeholder="排序" style="width:140px" size="large" @change="search"><el-option label="综合排序" value=""/><el-option label="价格从低到高" value="price_asc"/><el-option label="价格从高到低" value="price_desc"/><el-option label="销量优先" value="sales"/></el-select>
  </div>
  <!-- Categories -->
  <div class="cat-pills"><span class="cat-pill" :class="{active:!activeCat}" @click="activeCat='';fetch()">全部</span><span v-for="c in categories" :key="c" class="cat-pill" :class="{active:activeCat===c}" @click="activeCat=c;fetch()">{{ getCatIcon(c) }} {{ c }}</span></div>
  <!-- Products -->
  <div v-if="loading" class="prod-grid"><div v-for="i in 8" :key="i" class="prod-card"><div class="skeleton" style="height:180px"/><div style="padding:14px"><div class="skeleton" style="height:18px;width:70%;margin-bottom:8px"/><div class="skeleton" style="height:24px;width:40%"/></div></div></div>
  <div v-else-if="products.length" class="prod-grid">
    <router-link v-for="p in products" :key="p.id" :to="'/products/'+p.id" class="prod-card">
      <div class="prod-img">
        <div class="prod-img-bg" :style="{background:getBg(p.category)}">{{ getEmoji(p.category) }}</div>
        <span v-if="p.member_price && p.member_price<p.price*0.7" class="prod-tag">秒杀</span>
        <span v-if="p.sales_count>20" class="prod-tag new">热卖</span>
      </div>
      <div class="prod-info">
        <div class="prod-name">{{ p.name }}</div>
        <div class="prod-desc">{{ p.specification }}</div>
        <div class="prod-price-row">
          <span class="prod-price">¥{{ p.member_price || p.price }}</span>
          <span v-if="p.member_price && p.member_price<p.price" class="prod-orig">¥{{ p.price }}</span>
          <span class="prod-sold" v-if="p.sales_count">{{ p.sales_count }}+已售</span>
        </div>
      </div>
    </router-link>
  </div>
  <div v-else class="empty-state"><div class="empty-icon">🔍</div><div>没有找到相关商品</div></div>
  <!-- Pagination -->
  <div v-if="total>20" style="margin-top:24px;text-align:center">
    <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev,pager,next" @current-change="fetch"/>
  </div>
</div>
</template>

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

const catEmojis = { '家居': '🏠', '美妆': '💄', '文具': '✏️', '数码': '📱', '服饰': '👗' }
const catBgs = { '家居': '#F0F9FF', '美妆': '#FDF2F8', '文具': '#F5F3FF', '数码': '#F0FDF4', '服饰': '#FFF7ED' }
function getCatIcon(c) { return catEmojis[c] || '📦' }
function getEmoji(c) { return catEmojis[c] || '🎁' }
function getBg(c) { return catBgs[c] || '#F8FAFC' }

async function fetch() {
  loading.value = true
  try {
    const params = { page: page.value, size: 20 }
    if (activeCat.value) params.category = activeCat.value
    if (keyword.value) params.keyword = keyword.value
    if (sortBy.value) params.sort = sortBy.value
    const res = await request.get('/products/list', { params })
    products.value = res.records || []
    total.value = res.total || 0
  } catch {}
  loading.value = false
}

let searchTimer = null
function search() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetch() }, 400)
}

onMounted(async () => {
  try { categories.value = await request.get('/products/categories') } catch {}
  if (route.query.category) activeCat.value = route.query.category
  fetch()
})
</script>
