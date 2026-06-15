<template>
<div class="page">
  <div class="section-hd"><h2>🎫 优惠券中心</h2></div>

  <div class="cpn-tabs">
    <button :class="{active:tab==='avail'}" @click="tab='avail'">可领取</button>
    <button :class="{active:tab==='my'}" @click="tab='my'">我的优惠券 ({{ myCoupons.length }})</button>
  </div>

  <!-- Available coupons -->
  <div v-if="tab==='avail'">
    <div v-if="availCoupons.length" class="cpn-grid">
      <div v-for="c in availCoupons" :key="c.id" class="cpn-card">
        <div class="cpn-left">
          <div class="cpn-value">¥{{ c.discount_value }}</div>
          <div class="cpn-cond">满{{ c.min_amount }}可用</div>
        </div>
        <div class="cpn-right">
          <div class="cpn-name">{{ c.name }}</div>
          <div class="cpn-stock">剩余 {{ Math.max(0, (c.total_qty||100) - (c.sent_qty||0)) }} 张</div>
          <el-button type="primary" size="small" round @click="claim(c.id)" :loading="claiming===c.id">立即领取</el-button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state"><div class="empty-icon">🎫</div><div>暂无可领取的优惠券</div></div>
  </div>

  <!-- My coupons -->
  <div v-else>
    <div v-if="myCoupons.length" class="cpn-grid">
      <div v-for="c in myCoupons" :key="c.id" class="cpn-card" :class="{used:c.status==='已使用' || c.status==='expired'}">
        <div class="cpn-left">
          <div class="cpn-value">¥{{ c.discount_value }}</div>
          <div class="cpn-cond">满{{ c.min_amount }}可用</div>
        </div>
        <div class="cpn-right">
          <div class="cpn-name">{{ c.coupon_name || c.name }}</div>
          <div class="cpn-expire">有效期至 {{ c.expire_at?.substring(0,10) || '-' }}</div>
          <el-tag :type="c.status==='已使用'?'info':c.status==='expired'?'danger':'success'" size="small">
            {{ c.status==='已使用'?'已使用':c.status==='expired'?'已过期':'可使用' }}
          </el-tag>
        </div>
      </div>
    </div>
    <div v-else class="empty-state"><div class="empty-icon">🎟️</div><div>还没有优惠券，快去领取吧！</div></div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const tab = ref('avail')
const availCoupons = ref([])
const myCoupons = ref([])
const claiming = ref(null)

async function claim(id) {
  claiming.value = id
  try {
    await request.post('/coupons/' + id + '/claim')
    ElMessage.success('领取成功！')
    myCoupons.value = await request.get('/coupons/my-coupons') || []
  } catch (e) {
    ElMessage.error(e?.message || '领取失败')
  } finally {
    claiming.value = null
  }
}

onMounted(async () => {
  try {
    const [a, m] = await Promise.all([
      request.get('/coupons/available'),
      request.get('/coupons/my-coupons'),
    ])
    availCoupons.value = a || []
    myCoupons.value = m || []
  } catch {}
})
</script>

<style scoped>
.cpn-tabs{display:flex;gap:12px;margin-bottom:20px}
.cpn-tabs button{padding:10px 24px;border:1px solid #DEE2E6;border-radius:20px;background:#fff;color:#495057;font-size:14px;cursor:pointer;transition:all .2s}
.cpn-tabs button.active{background:var(--pri,#FF6B35);color:#fff;border-color:var(--pri,#FF6B35)}
.cpn-grid{display:flex;flex-direction:column;gap:12px}
.cpn-card{display:flex;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E5E7EB;transition:all .2s}
.cpn-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06)}
.cpn-card.used{opacity:.6}
.cpn-left{width:120px;min-width:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#FF6B35,#FF8C5A);color:#fff;padding:20px 12px}
.cpn-value{font-size:28px;font-weight:800;line-height:1}
.cpn-cond{font-size:11px;margin-top:4px;opacity:.85}
.cpn-right{flex:1;display:flex;flex-direction:column;justify-content:center;padding:16px 20px;gap:8px}
.cpn-name{font-weight:600;font-size:15px}
.cpn-stock,.cpn-expire{font-size:12px;color:#909399}
</style>
