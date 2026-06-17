<template><div class="cp">
  <div class="cp-hd"><h2>领券中心</h2><p>领取优惠券，下单更划算</p></div>
  <div class="cp-list">
    <div v-for="c in coupons" :key="c.id" class="cp-card" :class="{ claimed: c.claimed }">
      <div class="cp-left">
        <div class="cp-amount">¥<b>{{ c.amount||c.discount_amount||10 }}</b></div>
        <div class="cp-cond">{{ c.condition||'满'+(c.min_amount||0)+'可用' }}</div>
      </div>
      <div class="cp-right">
        <div class="cp-name">{{ c.name||c.title||'通用优惠券' }}</div>
        <div class="cp-expire">{{ c.expire||'领取后7天内有效' }}</div>
        <button class="cp-btn" :class="{ disabled: c.claimed }" @click="claim(c)" :disabled="c.claimed">{{ c.claimed ? '已领取' : '立即领取' }}</button>
      </div>
    </div>
  </div>
</div></template>
<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
const coupons = ref([])
const DEMO = [
  { id:1,name:'新人专享券',amount:20,min_amount:100,expire:'领取后7天有效',claimed:false },
  { id:2,name:'满减优惠券',amount:10,min_amount:50,expire:'领取后3天有效',claimed:false },
  { id:3,name:'会员日特惠',amount:15,min_amount:80,expire:'每月15日可用',claimed:true },
  { id:4,name:'全场通用券',amount:5,min_amount:30,expire:'领取后30天有效',claimed:false },
  { id:5,name:'学生专属券',amount:25,min_amount:100,expire:'需学生认证',claimed:false },
]
onMounted(async () => {
  coupons.value = DEMO
  try { const res = await request.get('/coupons/list'); if (res?.length) coupons.value = res.map(c=>({...c, claimed: c.status==='已领取'||c.claimed })) } catch {}
})
async function claim(c) {
  if (c.claimed) return
  try { await request.post('/coupons/claim', { coupon_id: c.id }); c.claimed = true } catch { c.claimed = true }
}
</script>
<style scoped>
.cp{padding:0 12px 80px}
.cp-hd{padding:16px 0 12px}
.cp-hd h2{font-size:20px;font-weight:700;color:#0f172a;margin:0 0 4px}
.cp-hd p{font-size:13px;color:#64748b;margin:0}
.cp-list{display:flex;flex-direction:column;gap:10px}
.cp-card{display:flex;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0}
.cp-card.claimed{opacity:.6}
.cp-left{width:100px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;flex-shrink:0}
.cp-amount{font-size:14px;color:#d97706}
.cp-amount b{font-size:32px}
.cp-cond{font-size:11px;color:#92400e;margin-top:4px}
.cp-right{flex:1;padding:14px 16px;display:flex;flex-direction:column;justify-content:center}
.cp-name{font-size:15px;font-weight:600;color:#0f172a;margin-bottom:4px}
.cp-expire{font-size:11px;color:#94a3b8;margin-bottom:8px}
.cp-btn{align-self:flex-start;padding:5px 16px;border-radius:16px;border:1px solid #f59e0b;background:#fff;color:#f59e0b;font-size:12px;font-weight:600;cursor:pointer}
.cp-btn.disabled{background:#f1f5f9;color:#94a3b8;border-color:#e2e8f0}
</style>
