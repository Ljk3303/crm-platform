<template>
  <div class="mgr-page">
    <h2>🎫 优惠券管理</h2>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">{{ stats.total }}</div><div class="stat-label">券模板</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.granted }}</div><div class="stat-label">已发放</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.used }}</div><div class="stat-label">已使用</div></div>
      <div class="stat-card"><div class="stat-val">{{ stats.unused }}</div><div class="stat-label">未使用</div></div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="tab" style="margin-bottom:16px">
      <el-tab-pane label="券模板" name="templates"/>
      <el-tab-pane label="发放记录" name="records"/>
    </el-tabs>

    <!-- Templates -->
    <div v-if="tab==='templates'">
      <el-button type="primary" @click="showCreate=true" style="margin-bottom:12px">+ 创建优惠券</el-button>
      <el-card shadow="never" style="border-radius:12px">
        <el-table :data="coupons" stripe size="small">
          <el-table-column prop="id" label="ID" width="50"/>
          <el-table-column prop="name" label="券名称" min-width="150"/>
          <el-table-column label="面额" width="80"><template #default="{row}">¥{{ row.discount_value }}</template></el-table-column>
          <el-table-column label="门槛" width="80"><template #default="{row}">¥{{ row.min_amount||0 }}</template></el-table-column>
          <el-table-column prop="total_qty" label="总量" width="60"/>
          <el-table-column label="操作" width="200">
            <template #default="{row}">
              <el-button size="small" type="primary" @click="openGrant(row)">发放</el-button>
              <el-button size="small" @click="editCoupon(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="delCoupon(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- Records -->
    <div v-if="tab==='records'">
      <el-card shadow="never" style="border-radius:12px">
        <el-table :data="grantRecords" stripe size="small" max-height="500">
          <el-table-column prop="coupon_name" label="券名称" width="150"/>
          <el-table-column prop="customer_name" label="客户" width="120"/>
          <el-table-column prop="status" label="状态" width="80"><template #default="{row}"><el-tag :type="row.status==='已使用'?'success':row.status==='已过期'?'info':'warning'" size="small">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column prop="used_at" label="使用时间" width="160"/>
          <el-table-column prop="created_at" label="发放时间" width="160"/>
        </el-table>
      </el-card>
    </div>

    <!-- Create Dialog -->
    <el-dialog v-model="showCreate" :title="editingCoupon?'编辑优惠券':'创建优惠券'" width="420px">
      <el-form label-width="80px">
        <el-form-item label="券名称"><el-input v-model="form.name" placeholder="如：满200减50"/></el-form-item>
        <el-form-item label="优惠面额"><el-input-number v-model="form.discountValue" :min="1" style="width:100%"/></el-form-item>
        <el-form-item label="使用门槛"><el-input-number v-model="form.minAmount" :min="0" style="width:100%" placeholder="0表示无门槛"/></el-form-item>
        <el-form-item label="发行数量"><el-input-number v-model="form.totalQty" :min="1" :max="9999" style="width:100%"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreate=false">取消</el-button><el-button type="primary" @click="saveCoupon">保存</el-button></template>
    </el-dialog>

    <!-- Grant Dialog -->
    <el-dialog v-model="showGrant" title="发放优惠券" width="380px">
      <p style="margin-bottom:12px">券：<b>{{ grantCoupon?.name }}</b> 面额 ¥{{ grantCoupon?.discount_value }}</p>
      <el-select v-model="grantCustomerId" filterable remote placeholder="搜索客户" :remote-method="searchCustomers" style="width:100%">
        <el-option v-for="c in customerOptions" :key="c.id" :label="c.name + ' (' + c.phone + ')'" :value="c.id"/>
      </el-select>
      <template #footer><el-button @click="showGrant=false">取消</el-button><el-button type="primary" @click="doGrant">确认发放</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const tab = ref('templates')
const stats = ref({ total: 0, granted: 0, used: 0, unused: 0 })
const coupons = ref([])
const grantRecords = ref([])
const customerOptions = ref([])
const showCreate = ref(false)
const showGrant = ref(false)
const editingCoupon = ref(false)
const grantCoupon = ref(null)
const grantCustomerId = ref(null)
const form = reactive({ id: null, name: '', discountValue: 10, minAmount: 0, totalQty: 100 })

onMounted(async () => {
  try {
    const [s, c, r] = await Promise.all([
      request.get('/admin/coupons/stats'),
      request.get('/admin/coupons'),
      request.get('/admin/coupons/records'),
    ])
    stats.value = s; coupons.value = c || []; grantRecords.value = r || []
  } catch {}
})

async function searchCustomers(q) {
  if (!q) return
  try { customerOptions.value = await request.get('/customers?keyword='+q).then(r => r.records?.slice(0,10)||[]) } catch {}
}

function editCoupon(row) {
  Object.assign(form, { id: row.id, name: row.name, discountValue: row.discount_value, minAmount: row.min_amount||0, totalQty: row.total_qty })
  editingCoupon.value = true; showCreate.value = true
}
async function saveCoupon() {
  if (!form.name) return ElMessage.warning('请输入券名称')
  try {
    if (editingCoupon.value) await request.put('/admin/coupons/'+form.id, form)
    else await request.post('/admin/coupons', form)
    ElMessage.success(editingCoupon.value?'已更新':'已创建')
    showCreate.value = false; editingCoupon.value = false
    Object.assign(form, { id: null, name: '', discountValue: 10, minAmount: 0, totalQty: 100 })
    coupons.value = await request.get('/admin/coupons')
    stats.value = await request.get('/admin/coupons/stats')
  } catch {}
}
async function delCoupon(id) {
  try { await ElMessageBox.confirm('确定删除？'); await request.delete('/admin/coupons/'+id); coupons.value = coupons.value.filter(c => c.id !== id); ElMessage.success('已删除') } catch {}
}
function openGrant(c) { grantCoupon.value = c; grantCustomerId.value = null; showGrant.value = true }
async function doGrant() {
  if (!grantCustomerId.value) return ElMessage.warning('请选择客户')
  try {
    await request.post('/admin/coupons/grant', { couponId: grantCoupon.value.id, customerId: grantCustomerId.value })
    ElMessage.success('优惠券已发放')
    showGrant.value = false
    grantRecords.value = await request.get('/admin/coupons/records')
    stats.value = await request.get('/admin/coupons/stats')
  } catch { ElMessage.error('发放失败') }
}
</script>

<style scoped>
.mgr-page { padding: 0; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.stat-val { font-size: 24px; font-weight: 700; color: #2563EB; }
.stat-label { font-size: 12px; color: #64748B; margin-top: 4px; }
</style>
