<template>
<div class="page" v-if="product">
  <div class="detail-layout">
    <!-- Gallery -->
    <div class="detail-gallery"><div class="gallery-main" :style="{background:getBg(product.category)}"><span style="font-size:120px">{{ getEmoji(product.category) }}</span></div></div>
    <!-- Info -->
    <div class="detail-info">
      <div class="detail-cat">{{ product.category }}</div>
      <h1>{{ product.name }}</h1>
      <div class="detail-desc">{{ product.specification }}</div>
      <div class="detail-price-block">
        <div class="detail-price-row">
          <span class="detail-price">¥{{ product.member_price || product.price }}</span>
          <span v-if="product.member_price && product.member_price<product.price" class="detail-orig">¥{{ product.price }}</span>
          <span v-if="product.member_price && product.member_price<product.price*0.7" class="detail-discount">闪购价</span>
        </div>
        <div class="detail-sales">{{ product.sales_count || 0 }}+ 已售</div>
      </div>
      <div class="detail-actions">
        <el-input-number v-model="qty" :min="1" :max="99" size="large" style="margin-right:12px"/>
        <el-button type="primary" size="large" @click="addCart" :loading="addingCart" style="flex:1;height:48px;border-radius:12px">加入购物车</el-button>
        <el-button size="large" @click="toggleFav" :type="favorited?'warning':''" :loading="togglingFav" circle style="margin-left:8px;width:48px;height:48px;font-size:20px">{{ favorited ? '❤️' : '🤍' }}</el-button>
      </div>
      <div class="detail-meta">
        <div class="meta-item"><span>编码</span><span>{{ product.code }}</span></div>
        <div class="meta-item"><span>分类</span><span>{{ product.category }}</span></div>
        <div class="meta-item"><span>单位</span><span>{{ product.unit }}</span></div>
      </div>
    </div>
  </div>

  <!-- Reviews -->
  <div class="section" style="margin-top:32px"><div class="section-hd"><h2>💬 用户评价 ({{ reviews.length }})</h2></div>
    <div v-if="reviews.length">
      <div v-for="r in reviews" :key="r.id" class="review-card">
        <div class="rv-hd"><span class="rv-user">{{ r.nickname }}</span><span class="rv-stars">{{ '⭐'.repeat(r.rating) }}</span><span class="rv-time">{{ r.created_at?.substring(0,10) }}</span></div>
        <div class="rv-body">{{ r.content }}</div>
      </div>
    </div>
    <div v-else class="empty-state"><div class="empty-icon">💬</div><div>暂无评价，快来第一个评价吧~</div></div>
    <!-- Write review -->
    <div v-if="isLoggedIn" style="margin-top:16px;background:#fff;border-radius:14px;padding:20px">
      <div style="font-weight:600;margin-bottom:12px">写评价</div>
      <div style="margin-bottom:8px"><el-rate v-model="myRating"/></div>
      <el-input v-model="myReview" type="textarea" :rows="2" placeholder="分享你的使用感受..."/>
      <el-button type="primary" size="small" @click="submitReview" :loading="submitting" style="margin-top:8px">发表评价 (+10积分)</el-button>
    </div>
  </div>
</div>

<!-- Loading state -->
<div class="page loading-state" v-else-if="loading">
  <div class="loading-spinner">⏳</div>
  <div style="color:#6B7280;margin-top:12px">正在加载商品详情...</div>
</div>

<!-- Error state -->
<div class="page error-state" v-else>
  <div style="font-size:48px">😕</div>
  <div style="color:#6B7280;margin:12px 0">{{ errorMsg }}</div>
  <el-button @click="loadProduct" type="primary">重新加载</el-button>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const product = ref(null)
const reviews = ref([])
const qty = ref(1)
const favorited = ref(false)
const myRating = ref(5)
const myReview = ref('')
const isLoggedIn = ref(!!localStorage.getItem('m_token'))
const loading = ref(true)
const addingCart = ref(false)
const togglingFav = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

const catEmojis = { '家居': '🏠', '美妆': '💄', '文具': '✏️', '数码': '📱', '服饰': '👗' }
const catBgs = { '家居': '#F0F9FF', '美妆': '#FDF2F8', '文具': '#F5F3FF', '数码': '#F0FDF4', '服饰': '#FFF7ED' }
function getEmoji(c) { return catEmojis[c] || '🎁' }
function getBg(c) { return catBgs[c] || '#F8FAFC' }

async function loadProduct() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await request.get('/products/' + route.params.id)
    product.value = res
    reviews.value = res.reviews || []
    // Record browse
    if (isLoggedIn.value) {
      try { await request.post('/products/' + route.params.id + '/browse') } catch {}
    }
  } catch (e) {
    errorMsg.value = e.message || '商品加载失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

onMounted(loadProduct)

async function addCart() {
  isLoggedIn.value = !!localStorage.getItem('m_token')
  if (!isLoggedIn.value) return ElMessage.warning('请先登录')
  addingCart.value = true
  try {
    await request.post('/cart/add', { productId: product.value.id, quantity: qty.value })
    ElMessage.success('已加入购物车')
  } catch (e) {
    ElMessage.error(e.message || '加入购物车失败')
  } finally {
    addingCart.value = false
  }
}

async function toggleFav() {
  isLoggedIn.value = !!localStorage.getItem('m_token')
  if (!isLoggedIn.value) return ElMessage.warning('请先登录')
  togglingFav.value = true
  try {
    const r = await request.post('/products/' + product.value.id + '/favorite')
    favorited.value = r.favorited
    ElMessage.success(r.favorited ? '已收藏' : '已取消')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    togglingFav.value = false
  }
}

async function submitReview() {
  if (!myReview.value.trim()) return ElMessage.warning('请输入评价内容')
  submitting.value = true
  try {
    await request.post('/products/' + product.value.id + '/review', { rating: myRating.value, content: myReview.value })
    ElMessage.success('评价发表成功！+10积分')
    myReview.value = ''
    myRating.value = 5
    const updated = await request.get('/products/' + product.value.id)
    reviews.value = updated.reviews || []
  } catch (e) {
    ElMessage.error(e.message || '评价发表失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.detail-layout{display:grid;grid-template-columns:1fr 1fr;gap:32px}
@media(max-width:768px){.detail-layout{grid-template-columns:1fr}}
.detail-gallery{position:sticky;top:20px}
.gallery-main{width:100%;aspect-ratio:1;border-radius:20px;display:flex;align-items:center;justify-content:center}
.detail-cat{font-size:13px;color:var(--pri);font-weight:600;margin-bottom:6px}
.detail-info h1{font-size:26px;font-weight:800;margin-bottom:8px}
.detail-desc{color:#6B7280;margin-bottom:20px}
.detail-price-block{background:var(--pri-light);border-radius:14px;padding:16px 20px;margin-bottom:24px}
.detail-price-row{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.detail-price{font-size:32px;font-weight:900;color:var(--pri)}
.detail-orig{font-size:14px;color:#9CA3AF;text-decoration:line-through}
.detail-discount{background:var(--danger);color:#fff;font-size:11px;padding:2px 6px;border-radius:4px}
.detail-sales{font-size:12px;color:#6B7280}
.detail-actions{display:flex;align-items:center;margin-bottom:24px}
.detail-meta{margin-top:20px}
.meta-item{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:13px}
.meta-item span:first-child{color:#9CA3AF}
.review-card{background:#fff;border-radius:12px;padding:16px;margin-bottom:10px}
.rv-hd{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.rv-user{font-weight:600;font-size:14px}
.rv-stars{font-size:12px}
.rv-time{font-size:12px;color:#9CA3AF;margin-left:auto}
.rv-body{font-size:13px;color:#4B5563;line-height:1.6}
.loading-state{text-align:center;padding:80px 20px}
.loading-spinner{font-size:48px;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.error-state{text-align:center;padding:80px 20px}
</style>
