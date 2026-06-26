<template>
<div class="client-mgr">
  <div class="page-header">
    <h2>🛍️ 客户端管理中心</h2>
    <p class="sub">管理会员商城商品、库存、首页配置、用户和排版</p>
  </div>

  <div class="stats-row">
    <div class="stat-card"><div class="stat-val">{{ stats.totalUsers||0 }}</div><div class="stat-label">注册用户</div></div>
    <div class="stat-card"><div class="stat-val">{{ stats.onSaleProducts||0 }}</div><div class="stat-label">在售商品</div></div>
    <div class="stat-card"><div class="stat-val">¥{{ ((stats.totalRevenue||0)/10000).toFixed(1) }}万</div><div class="stat-label">累计营收</div></div>
    <div class="stat-card"><div class="stat-val">{{ stats.todaySignins||0 }}</div><div class="stat-label">今日活跃</div></div>
  </div>

  <el-tabs v-model="activeTab" type="border-card">
    <!-- Tab 1: 商品管理 -->
    <el-tab-pane label="📦 商品管理" name="products">
      <div class="tab-toolbar">
        <el-button type="primary" @click="showProductDialog(null)">+ 新增商品</el-button>
        <el-select v-model="filterCat" placeholder="分类筛选" clearable style="width:140px;margin-left:8px" @change="loadProducts">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c"/>
        </el-select>
        <el-input v-model="filterKeyword" placeholder="搜索商品名称..." style="width:200px;margin-left:8px" clearable @change="loadProducts"/>
      </div>
      <el-table :data="products" stripe size="small" max-height="500" v-loading="loading">
        <el-table-column prop="code" label="编码" width="80"/>
        <el-table-column prop="name" label="商品名称" min-width="160">
          <template #default="{row}">
            <el-input v-if="row._editing" v-model="row.name" size="small"/>
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="80"/>
        <el-table-column label="原价" width="90">
          <template #default="{row}">
            <el-input-number v-if="row._editing" v-model="row.price" :min="0" :precision="1" size="small" style="width:80px"/>
            <span v-else>¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="会员价" width="90">
          <template #default="{row}">
            <el-input-number v-model="row.member_price" :min="0" :precision="1" size="small" style="width:80px" @change="v=>saveMemberPrice(row.id,v)"/>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="80">
          <template #default="{row}">
            <span :style="{color: (row._stock||0)<10?'#EF4444':(row._stock||0)<30?'#F59E0B':'#10B981'}">{{ row._stock||0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sales_count" label="销量" width="60"/>
        <el-table-column label="状态" width="80">
          <template #default="{row}">
            <el-switch v-model="row.is_on_sale" :active-value="1" :inactive-value="0" @change="v=>toggleSale(row.id,v)" size="small"/>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{row}">
            <el-button type="primary" size="small" link @click="editProduct(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="deleteProduct(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>

    <!-- Tab 2: 库存管理 -->
    <el-tab-pane label="📊 库存管理" name="inventory">
      <div class="tab-toolbar">
        <el-alert :title="`低库存预警: ${lowStock.length} 个商品库存不足`" type="warning" :closable="false" v-if="lowStock.length"/>
      </div>
      <el-table :data="inventory" stripe size="small" v-loading="loading">
        <el-table-column prop="product_code" label="编码" width="80"/>
        <el-table-column prop="product_name" label="商品" min-width="160"/>
        <el-table-column label="当前库存" width="100">
          <template #default="{row}">
            <span :style="{color:row.quantity<10?'#EF4444':row.quantity<30?'#F59E0B':'#10B981',fontWeight:'700'}">{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最低库存" width="100"><template #default="{row}">{{ row.min_quantity||10 }}</template></el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="80"/>
        <el-table-column label="调整库存" width="200">
          <template #default="{row}">
            <el-input-number v-model="row._newQty" :min="0" size="small" style="width:100px"/>
            <el-button type="primary" size="small" @click="adjustStock(row)" style="margin-left:8px">更新</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>

    <!-- Tab 3: 首页配置 -->
    <el-tab-pane label="🏠 首页排版" name="homepage">
      <el-card shadow="never" class="cfg-card">
        <template #header><b>Banner 轮播图配置</b></template>
        <div v-for="(b,i) in banners" :key="i" style="margin-bottom:8px;display:flex;gap:8px;align-items:center">
          <el-input v-model="b.title" placeholder="标题" style="width:140px" size="small"/>
          <el-input v-model="b.subtitle" placeholder="副标题" style="width:180px" size="small"/>
          <el-color-picker v-model="b.color" size="small"/>
          <el-input v-model="b.link" placeholder="跳转链接" style="width:160px" size="small"/>
          <el-button type="danger" size="small" circle @click="banners.splice(i,1)">×</el-button>
        </div>
        <el-button type="primary" size="small" @click="addBanner">+ 添加Banner</el-button>
        <el-button type="success" size="small" @click="saveBanners" style="margin-left:8px">💾 保存</el-button>
      </el-card>

      <el-card shadow="never" class="cfg-card" style="margin-top:12px">
        <template #header><b>首页公告</b></template>
        <el-input v-model="notice" type="textarea" :rows="3" placeholder="首页顶部滚动公告"/>
        <el-button type="success" size="small" @click="saveNotice" style="margin-top:8px">💾 保存公告</el-button>
      </el-card>

      <el-card shadow="never" class="cfg-card" style="margin-top:12px">
        <template #header><b>板块显示开关</b></template>
        <el-form label-width="140px">
          <el-form-item label="热门商品板块"><el-switch v-model="sectionHot" @change="saveSection('hot',sectionHot)"/></el-form-item>
          <el-form-item label="会员等级板块"><el-switch v-model="sectionTiers" @change="saveSection('tiers',sectionTiers)"/></el-form-item>
          <el-form-item label="拼团活动板块"><el-switch v-model="sectionGroup" @change="saveSection('group',sectionGroup)"/></el-form-item>
          <el-form-item label="新闻资讯板块"><el-switch v-model="sectionNews" @change="saveSection('news',sectionNews)"/></el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="cfg-card" style="margin-top:12px">
        <template #header><b>主题配色</b></template>
        <el-form label-width="100px">
          <el-form-item label="主色调"><el-color-picker v-model="themeColor" @change="saveTheme"/></el-form-item>
          <el-form-item label="背景色"><el-color-picker v-model="themeBg" @change="saveTheme"/></el-form-item>
          <el-form-item label="按钮色"><el-color-picker v-model="themeBtn" @change="saveTheme"/></el-form-item>
        </el-form>
      </el-card>
    </el-tab-pane>

    <!-- Tab 4: 用户管理 -->
    <el-tab-pane label="👥 用户管理" name="users">
      <el-table :data="portalUsers" stripe size="small" max-height="400">
        <el-table-column prop="id" label="ID" width="50"/>
        <el-table-column prop="nickname" label="昵称" width="120"/>
        <el-table-column prop="phone" label="手机号" width="130"/>
        <el-table-column label="积分" width="80"><template #default="{row}">{{ row.available_points||0 }}</template></el-table-column>
        <el-table-column label="消费总额" width="100"><template #default="{row}">¥{{ (row.total_spent||0).toFixed(0) }}</template></el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{row}">
            <el-tag :type="row.status===1?'success':'danger'" size="small">{{ row.status===1?'正常':'禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160"/>
        <el-table-column label="操作" width="100">
          <template #default="{row}">
            <el-button size="small" @click="toggleUserStatus(row)">{{ row.status===1?'禁用':'启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>

    <!-- Tab 5: 优惠券 -->
    <el-tab-pane label="🎫 优惠券" name="coupons">
      <div class="tab-toolbar">
        <el-button type="primary" size="small" @click="showCouponDialog=!showCouponDialog">+ 创建优惠券</el-button>
      </div>
      <div v-if="showCouponDialog" style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:12px">
        <el-form :inline="true" size="small">
          <el-form-item label="名称"><el-input v-model="cForm.name" placeholder="优惠券名称"/></el-form-item>
          <el-form-item label="面额"><el-input-number v-model="cForm.value" :min="1"/></el-form-item>
          <el-form-item label="门槛"><el-input-number v-model="cForm.minAmount" :min="0"/></el-form-item>
          <el-form-item label="数量"><el-input-number v-model="cForm.qty" :min="1"/></el-form-item>
          <el-form-item><el-button type="success" @click="createCoupon">创建</el-button></el-form-item>
        </el-form>
      </div>
      <el-table :data="coupons" stripe size="small">
        <el-table-column prop="name" label="名称" min-width="140"/>
        <el-table-column label="面额" width="80"><template #default="{row}">¥{{ row.discount_value }}</template></el-table-column>
        <el-table-column label="满减门槛" width="90"><template #default="{row}">¥{{ row.min_amount }}</template></el-table-column>
        <el-table-column label="剩余/总量" width="100"><template #default="{row}">{{ (row.total_qty||0)-(row.used_qty||0) }} / {{ row.total_qty||0 }}</template></el-table-column>
      </el-table>
    </el-tab-pane>
  </el-tabs>

  <!-- Product Edit Dialog -->
  <el-dialog v-model="productDialog" :title="editingProduct?.id?'编辑商品':'新增商品'" width="500px">
    <el-form label-width="80px">
      <el-form-item label="编码"><el-input v-model="pForm.code"/></el-form-item>
      <el-form-item label="名称"><el-input v-model="pForm.name"/></el-form-item>
      <el-form-item label="分类"><el-select v-model="pForm.category"><el-option v-for="c in categories" :key="c" :label="c" :value="c"/></el-select></el-form-item>
      <el-form-item label="规格"><el-input v-model="pForm.specification"/></el-form-item>
      <el-form-item label="单位"><el-input v-model="pForm.unit"/></el-form-item>
      <el-form-item label="原价"><el-input-number v-model="pForm.price" :min="0" :precision="1"/></el-form-item>
      <el-form-item label="会员价"><el-input-number v-model="pForm.member_price" :min="0" :precision="1"/></el-form-item>
    </el-form>
    <template #footer><el-button @click="productDialog=false">取消</el-button><el-button type="primary" @click="saveProduct">保存</el-button></template>
  </el-dialog>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('products')
const loading = ref(false)
const stats = ref({})
const products = ref([])
const inventory = ref([])
const portalUsers = ref([])
const coupons = ref([])
const banners = ref([])
const notice = ref('')
const filterCat = ref('')
const filterKeyword = ref('')
const categories = ref(['家居','美妆','文具','数码','服饰','食品'])

// Homepage sections
const sectionHot = ref(true)
const sectionTiers = ref(true)
const sectionGroup = ref(true)
const sectionNews = ref(true)
const themeColor = ref('#FF6B35')
const themeBg = ref('#F8FAFC')
const themeBtn = ref('#3B82F6')

// Product dialog
const productDialog = ref(false)
const editingProduct = ref(null)
const pForm = ref({ code:'',name:'',category:'家居',specification:'',unit:'个',price:0,member_price:0 })

// Coupon dialog
const showCouponDialog = ref(false)
const cForm = ref({ name:'',value:10,minAmount:50,qty:100 })

const lowStock = computed(() => inventory.value.filter(i=>i.quantity<(i.min_quantity||10)))

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    const [s, c] = await Promise.all([
      request.get('/admin/portal-stats'),
      request.get('/admin/portal-configs'),
    ])
    stats.value = s
    const b = c.find(x=>x.config_key==='home_banners')
    const n = c.find(x=>x.config_key==='home_notice')
    try { banners.value = JSON.parse(b?.config_value||'[]') } catch { banners.value = [{title:'限时特惠',subtitle:'全场低至5折',color:'#FF6B35',link:'/products'}] }
    notice.value = n?.config_value||''
    // Load theme configs
    const tc = c.find(x=>x.config_key==='theme_color')
    if (tc) themeColor.value = tc.config_value
    const tb = c.find(x=>x.config_key==='theme_bg')
    if (tb) themeBg.value = tb.config_value
  } catch {}
  await loadProducts()
  await loadInventory()
  // Merge inventory quantities into products
  const invMap = {}
  inventory.value.forEach(i => { invMap[i.product_code] = i.quantity })
  products.value.forEach(p => { p._stock = invMap[p.code] || 0 })
  loadUsers()
  loadCoupons()
  loading.value = false
}

async function loadProducts() {
  try {
    const r = await request.get('/products/list',{params:{page:1,size:200,category:filterCat.value||undefined}})
    products.value = (r.records||[]).map(p=>({...p,_editing:false}))
  } catch {}
}
async function loadInventory() {
  try {
    const r = await request.get('/inventory')
    inventory.value = (r||[]).map(i=>({...i,_newQty:i.quantity,_productName:i.product_name}))
  } catch {}
}
async function loadUsers() {
  try { portalUsers.value = await request.get('/admin/portal-users') || [] } catch {}
}
async function loadCoupons() {
  try { coupons.value = await request.get('/coupons') || [] } catch {}
}

function showProductDialog(row) {
  editingProduct.value = row
  if (row) { pForm.value = {...row} }
  else { pForm.value = {code:'',name:'',category:'家居',specification:'',unit:'个',price:0,member_price:0} }
  productDialog.value = true
}
async function saveProduct() {
  try {
    if (editingProduct.value?.id) {
      await request.put('/products',{...pForm.value,id:editingProduct.value.id})
      ElMessage.success('商品已更新')
    } else {
      await request.post('/products',pForm.value)
      ElMessage.success('商品已创建')
    }
    productDialog.value = false
    loadProducts()
  } catch (e) { ElMessage.error('保存失败: '+(e.message||'')) }
}
async function deleteProduct(id) {
  try {
    await ElMessageBox.confirm('确定删除该商品？','确认',{type:'warning'})
    await request.delete('/products/'+id)
    ElMessage.success('已删除')
    loadProducts()
  } catch {}
}
function editProduct(row) {
  row._editing = !row._editing
  if (!row._editing) saveProductSilent(row)
}
async function saveProductSilent(row) {
  try { await request.put('/products',{...row,id:row.id}) } catch {}
}
async function toggleSale(id,isOnSale) {
  try { await request.put('/admin/products/'+id+'/toggle-sale',{isOnSale}); ElMessage.success(isOnSale?'已上架':'已下架') } catch {}
}
async function saveMemberPrice(id,memberPrice) {
  try { await request.put('/admin/products/'+id+'/member-price',{memberPrice}); ElMessage.success('会员价已更新') } catch {ElMessage.error('保存失败')}
}

async function adjustStock(row) {
  try {
    await request.put('/admin/inventory/'+row.product_id+'/stock',{newQty:row._newQty})
    row.quantity = row._newQty
    ElMessage.success('库存已更新')
  } catch { ElMessage.error('更新失败') }
}

function addBanner() { banners.value.push({title:'',subtitle:'',color:'#10B981',link:'/products'}) }
async function saveBanners() {
  try { await request.put('/admin/portal-configs/home_banners',{configValue:JSON.stringify(banners.value)}); ElMessage.success('Banner已保存') } catch {}
}
async function saveNotice() {
  try { await request.put('/admin/portal-configs/home_notice',{configValue:notice.value}); ElMessage.success('公告已保存') } catch {}
}
async function saveSection(key,val) {
  try { await request.put('/admin/portal-configs/section_'+key,{configValue:val?'1':'0'}) } catch {}
}
async function saveTheme() {
  try {
    await request.put('/admin/portal-configs/theme_color',{configValue:themeColor.value})
    await request.put('/admin/portal-configs/theme_bg',{configValue:themeBg.value})
    await request.put('/admin/portal-configs/theme_btn',{configValue:themeBtn.value})
    ElMessage.success('主题已保存')
  } catch {}
}
async function createCoupon() {
  if (!cForm.value.name) return ElMessage.warning('请输入名称')
  try { await request.post('/coupons',{name:cForm.value.name,discountValue:cForm.value.value,minAmount:cForm.value.minAmount,totalQty:cForm.value.qty}); ElMessage.success('优惠券已创建'); showCouponDialog.value=false; loadCoupons() } catch {}
}
async function toggleUserStatus(row) {
  try { await request.put('/admin/portal-users/'+row.id+'/status',{status:row.status===1?0:1}); row.status=row.status===1?0:1; ElMessage.success('状态已更新') } catch {}
}
</script>

<style scoped>
.client-mgr{padding:0}
.page-header{margin-bottom:20px}
.page-header h2{font-size:20px;font-weight:700;color:#1E293B;margin-bottom:4px}
.sub{font-size:13px;color:#64748B}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.stat-card{background:#fff;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.stat-val{font-size:24px;font-weight:700;color:#2563EB}
.stat-label{font-size:12px;color:#64748B;margin-top:4px}
.tab-toolbar{margin-bottom:12px}
.cfg-card{border-radius:12px;margin-bottom:0}
</style>
