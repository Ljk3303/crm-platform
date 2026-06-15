<template>
<div class="page">
  <div class="section-hd"><h2>🛒 购物车</h2></div>
  <div v-if="items.length">
    <div v-for="c in items" :key="c.id" class="cart-row">
      <div class="cr-info">
        <span class="cr-emoji">🛍️</span>
        <div class="cr-detail">
          <div class="cr-name">{{ c.product_name }}</div>
          <div class="cr-price">¥{{ c.price }}</div>
        </div>
        <div class="cr-qty">
          <el-input-number v-model="c.quantity" :min="1" :max="99" size="small" @change="updateQty(c)"/>
        </div>
        <div class="cr-sub">¥{{ (c.price*c.quantity).toFixed(2) }}</div>
        <el-button type="danger" size="small" circle @click="remove(c.id)">×</el-button>
      </div>
    </div>

    <!-- Coupon Selection -->
    <div v-if="myCoupons.length" class="coupon-section">
      <div class="coupon-title">🎫 选择优惠券</div>
      <div class="coupon-list">
        <div
          v-for="c in myCoupons"
          :key="c.id"
          class="coupon-item"
          :class="{selected: selectedCouponId===c.id, disabled: c.min_amount>total}"
          @click="selectCoupon(c)"
        >
          <div class="coupon-left">
            <div class="coupon-value">¥{{ c.discount_value }}</div>
            <div class="coupon-cond">满{{ c.min_amount }}可用</div>
          </div>
          <div class="coupon-right">
            <div class="coupon-name">{{ c.coupon_name }}</div>
            <div class="coupon-expire">有效期至 {{ c.expire_at?.substring(0,10) }}</div>
            <el-tag v-if="c.min_amount>total" type="danger" size="small">未达门槛</el-tag>
            <el-tag v-else-if="selectedCouponId===c.id" type="success" size="small">已选</el-tag>
          </div>
        </div>
      </div>
      <div v-if="selectedCouponId" class="coupon-discount">
        <span>优惠券抵扣：</span><strong>-¥{{ discountAmount.toFixed(2) }}</strong>
      </div>
    </div>

    <div class="cart-footer">
      <div class="cf-total">
        <div>小计 ¥{{ total.toFixed(2) }}</div>
        <div v-if="discountAmount>0">优惠 -¥{{ discountAmount.toFixed(2) }}</div>
        <div class="cf-price">实付 ¥{{ finalTotal.toFixed(2) }}</div>
      </div>
      <el-button type="primary" size="large" @click="checkout" :loading="submitting" style="padding:12px 40px;border-radius:14px;font-size:16px;font-weight:700">立即结算</el-button>
    </div>
  </div>
  <div v-else class="empty-state"><div class="empty-icon">🛒</div><div>购物车空空如也</div><router-link to="/products" class="hero-btn" style="display:inline-block;margin-top:12px">去逛逛 →</router-link></div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const items = ref([])
const submitting = ref(false)
const myCoupons = ref([])
const selectedCouponId = ref(null)

const total = computed(() => items.value.reduce((s, c) => s + c.price * c.quantity, 0))
const selectedCoupon = computed(() => myCoupons.value.find(c => c.id === selectedCouponId.value))
const discountAmount = computed(() => {
  if (!selectedCoupon.value || selectedCoupon.value.min_amount > total.value) return 0
  return Math.min(selectedCoupon.value.discount_value, total.value)
})
const finalTotal = computed(() => Math.max(0, total.value - discountAmount.value))

function selectCoupon(c) {
  if (c.min_amount > total.value) return
  if (selectedCouponId.value === c.id) { selectedCouponId.value = null; return }
  selectedCouponId.value = c.id
}

onMounted(async () => {
  try { items.value = await request.get('/cart/list') } catch {}
  try { myCoupons.value = await request.get('/coupons/my-coupons') || []; myCoupons.value = myCoupons.value.filter(c => c.status!=='已使用' && c.status!=='expired') } catch {}
})

async function updateQty(c) { try { await request.put('/cart/' + c.id, { quantity: c.quantity }) } catch {} }
async function remove(id) { try { await request.delete('/cart/' + id); items.value = items.value.filter(i => i.id !== id) } catch {} }
async function checkout() {
  if (!items.value.length) return
  submitting.value = true
  try {
    const r = await request.post('/orders/create', { couponGrantId: selectedCouponId.value || 0 })
    items.value = []
    let msg = '下单成功！实付 ¥' + finalTotal.value.toFixed(2)
    if (discountAmount.value > 0) msg += '（优惠券抵 ¥' + discountAmount.value.toFixed(2) + '）'
    msg += '，获得 +' + r.pointsEarned + ' 积分'
    ElMessage.success(msg)
    router.push('/orders')
  } catch (e) { ElMessage.error(e.message || '下单失败') }
  finally { submitting.value = false }
}
</script>

<style scoped>
.cart-row{background:#fff;border-radius:14px;padding:16px 20px;margin-bottom:8px}
.cr-info{display:flex;align-items:center;gap:16px}
.cr-emoji{font-size:32px;width:56px;height:56px;background:#F5F3F0;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cr-detail{flex:1;min-width:0}
.cr-name{font-weight:600;font-size:14px;margin-bottom:4px}
.cr-price{color:#FF6B35;font-weight:600;font-size:13px}
.cr-qty{flex-shrink:0}
.cr-sub{font-size:18px;font-weight:800;color:#FF6B35;min-width:70px;text-align:right}

.coupon-section{background:#fff;border-radius:14px;padding:20px;margin-top:12px}
.coupon-title{font-weight:700;font-size:15px;margin-bottom:12px}
.coupon-list{display:flex;flex-direction:column;gap:8px}
.coupon-item{display:flex;border-radius:10px;overflow:hidden;border:2px solid #E5E7EB;cursor:pointer;transition:all .2s}
.coupon-item:hover{border-color:#FF6B35}
.coupon-item.selected{border-color:#FF6B35;background:#FFF7ED}
.coupon-item.disabled{opacity:.5;cursor:not-allowed}
.coupon-left{width:90px;min-width:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#FF6B35,#FF8C5A);color:#fff;padding:14px 8px}
.coupon-value{font-size:22px;font-weight:800;line-height:1}
.coupon-cond{font-size:10px;margin-top:3px;opacity:.85}
.coupon-right{flex:1;display:flex;align-items:center;justify-content:space-between;padding:8px 16px;gap:12px}
.coupon-name{font-weight:600;font-size:14px}
.coupon-expire{font-size:11px;color:#909399}
.coupon-discount{padding-top:12px;border-top:1px dashed #E5E7EB;margin-top:12px;text-align:right;color:#059669;font-size:15px}

.cart-footer{background:#fff;border-radius:14px;padding:20px 24px;margin-top:16px;display:flex;align-items:flex-end;justify-content:flex-end;gap:24px}
.cf-total{font-size:13px;color:#6B7280;text-align:right}
.cf-total div{margin-bottom:4px}
.cf-price{font-size:28px;font-weight:900;color:#FF6B35}
</style>
