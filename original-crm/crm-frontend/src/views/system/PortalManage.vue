<template>
  <div class="portal-manage">
    <!-- 概览卡片 -->
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">{{ stats.totalUsers }}</div><div class="stat-label">注册用户</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.onSaleProducts }}</div><div class="stat-label">上架商品</div></div>
      <div class="stat-card"><div class="stat-val">¥{{ (stats.totalRevenue||0).toLocaleString() }}</div><div class="stat-label">累计营收</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.todaySignins }}</div><div class="stat-label">今日签到</div></div>
    </div>

    <!-- 首页配置 -->
    <h3 class="section-title">🏠 首页配置</h3>
    <el-card class="cfg-card" shadow="never">
      <el-form label-width="100px">
        <el-form-item label="Banner 轮播">
          <div v-for="(b, i) in banners" :key="i" style="margin-bottom:8px;display:flex;gap:8px">
            <el-input v-model="b.title" placeholder="标题" style="width:160px" size="small"/>
            <el-input v-model="b.subtitle" placeholder="副标题" style="width:200px" size="small"/>
            <el-color-picker v-model="b.color" size="small"/>
            <el-button type="danger" size="small" circle @click="banners.splice(i,1)">×</el-button>
          </div>
          <el-button type="primary" size="small" @click="addBanner">+ 添加Banner</el-button>
          <el-button type="success" size="small" @click="saveBanners" style="margin-left:8px">保存Banner</el-button>
        </el-form-item>
        <el-form-item label="首页公告">
          <el-input v-model="notice" type="textarea" :rows="2" placeholder="首页顶部公告"/>
          <el-button type="success" size="small" @click="saveNotice" style="margin-top:8px">保存公告</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 产品上下架管理 -->
    <h3 class="section-title">📦 产品上下架管理</h3>
    <el-card class="cfg-card" shadow="never">
      <el-table :data="products" stripe size="small" max-height="500">
        <el-table-column prop="code" label="编码" width="80"/>
        <el-table-column prop="name" label="产品名称" min-width="150"/>
        <el-table-column prop="category" label="分类" width="80"/>
        <el-table-column prop="price" label="原价" width="80"><template #default="{row}">¥{{ row.price }}</template></el-table-column>
        <el-table-column label="会员价" width="100">
          <template #default="{row}">
            <el-input-number v-model="row.member_price" :min="0" :precision="1" size="small" style="width:80px" @change="v => saveMemberPrice(row.id, v)"/>
          </template>
        </el-table-column>
        <el-table-column prop="sales_count" label="销量" width="60"/>
        <el-table-column label="上架" width="70">
          <template #default="{row}">
            <el-switch v-model="row.is_on_sale" :active-value="1" :inactive-value="0" @change="v => toggleSale(row.id, v)" size="small"/>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 注册用户管理 -->
    <h3 class="section-title">👤 注册用户</h3>
    <el-card class="cfg-card" shadow="never">
      <el-table :data="portalUsers" stripe size="small" max-height="300">
        <el-table-column prop="id" label="ID" width="50"/>
        <el-table-column prop="nickname" label="昵称" width="120"/>
        <el-table-column prop="phone" label="手机号" width="120"/>
        <el-table-column label="积分" width="80"><template #default="{row}">{{ row.available_points }}</template></el-table-column>
        <el-table-column label="消费" width="80"><template #default="{row}">¥{{ row.total_spent }}</template></el-table-column>
        <el-table-column label="CRM客户ID" width="100"><template #default="{row}">{{ row.crm_customer_id||'未关联' }}</template></el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160"/>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const stats = ref({ totalUsers: 0, onSaleProducts: 0, totalRevenue: 0, todaySignins: 0 })
const banners = ref([])
const notice = ref('')
const products = ref([])
const portalUsers = ref([])

onMounted(async () => {
  try {
    const [s, c, p, u] = await Promise.all([
      request.get('/admin/portal-stats'),
      request.get('/admin/portal-configs'),
      request.get('/products/list?page=1&size=100'),
      request.get('/admin/portal-users'),
    ])
    stats.value = s
    products.value = p.records || []
    // Parse configs
    const b = c.find(x => x.config_key === 'home_banners')
    const n = c.find(x => x.config_key === 'home_notice')
    try { banners.value = JSON.parse(b?.config_value || '[]') } catch { banners.value = [{ title: '', subtitle: '', color: '#FF6B35' }] }
    notice.value = n?.config_value || ''
    portalUsers.value = u || []
  } catch (e) { console.error(e) }
})

function addBanner() { banners.value.push({ title: '', subtitle: '', color: '#10B981' }) }
async function saveBanners() {
  try {
    await request.put('/admin/portal-configs/home_banners', { configValue: JSON.stringify(banners.value) })
    ElMessage.success('Banner已保存')
  } catch { ElMessage.error('保存失败') }
}
async function saveNotice() {
  try {
    await request.put('/admin/portal-configs/home_notice', { configValue: notice.value })
    ElMessage.success('公告已保存')
  } catch { ElMessage.error('保存失败') }
}
async function toggleSale(id, isOnSale) {
  try { await request.put(`/admin/products/${id}/toggle-sale`, { isOnSale }); ElMessage.success(isOnSale ? '已上架' : '已下架') } catch { ElMessage.error('操作失败') }
}
async function saveMemberPrice(id, memberPrice) {
  try { await request.put(`/admin/products/${id}/member-price`, { memberPrice }) } catch { ElMessage.error('保存失败') }
}
</script>

<style scoped>
.portal-manage { padding: 0; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.stat-val { font-size: 24px; font-weight: 700; color: #2563EB; }
.stat-label { font-size: 12px; color: #64748B; margin-top: 4px; }
.section-title { margin: 20px 0 12px; font-size: 16px; font-weight: 600; color: #1E293B; }
.cfg-card { border-radius: 12px; }
</style>
