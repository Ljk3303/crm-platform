<template><div class="pt">
  <div class="pt-card">
    <div class="pt-hd">我的积分</div>
    <div class="pt-num">{{ points }}<small>积分</small></div>
    <div class="pt-sub">可用积分：{{ points }} · 累计获得：{{ totalPoints }}</div>
    <button class="pt-sign" @click="sign">{{ signed ? '今日已签到' : '签到领积分' }}</button>
  </div>
  <div class="pt-card">
    <div class="pt-card-hd">积分兑换</div>
    <div class="pt-grid">
      <div v-for="g in gifts" :key="g.id" class="pt-gift" @click="exchange(g)">
        <div class="pt-g-emoji">{{ giftEmoji(g.id) }}</div>
        <div class="pt-g-name">{{ g.name }}</div>
        <div class="pt-g-pts">{{ g.points }}积分</div>
      </div>
    </div>
  </div>
  <div class="pt-card">
    <div class="pt-card-hd">积分记录</div>
    <div v-for="r in records" :key="r.id" class="pt-r">
      <div class="pt-r-info"><div class="pt-r-nm">{{ r.reason }}</div><div class="pt-r-tm">{{ r.time||r.created_at }}</div></div>
      <div class="pt-r-pts" :class="{plus:r.points>0}">{{ r.points>0?'+':'' }}{{ r.points }}</div>
    </div>
  </div>
</div></template>
<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
const points = ref(0)
const totalPoints = ref(0)
const signed = ref(false)
const records = ref([])
const gifts = ref([
  { id:1,name:'5元优惠券',points:100 },
  { id:2,name:'10元优惠券',points:200 },
  { id:3,name:'小风扇',points:300 },
  { id:4,name:'保温杯',points:500 },
  { id:5,name:'蓝牙音箱',points:1000 },
  { id:6,name:'双肩包',points:2000 },
])
function giftEmoji(id) { return ['🎫','🎫','🌀','🥤','🔊','🎒'][(id-1)%6] }
const DEMO_RECORDS = [
  { id:1,reason:'每日签到',points:10,time:'今天 08:30' },
  { id:2,reason:'购物奖励',points:50,time:'昨天 14:20' },
  { id:3,reason:'分享商品',points:5,time:'昨天 10:00' },
  { id:4,reason:'新人注册',points:100,time:'3天前' },
]
onMounted(async () => {
  points.value = 165
  totalPoints.value = 265
  records.value = DEMO_RECORDS
  try {
    const res = await request.get('/points/info')
    if (res) { points.value = res.available_points||res.points||165; totalPoints.value = res.total_points||265 }
  } catch {}
  try { const r = await request.get('/points/records'); if (r?.length) records.value = r } catch {}
})
async function sign() {
  if (signed.value) return
  points.value += 10
  signed.value = true
  try { await request.post('/points/sign') } catch {}
}
async function exchange(g) {
  if (points.value < g.points) return alert('积分不足')
  points.value -= g.points
  alert('兑换成功！')
  try { await request.post('/points/exchange', { gift_id: g.id, points: g.points }) } catch {}
}
</script>
<style scoped>
.pt{padding:0 12px 80px}
.pt-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:12px;border:1px solid #e2e8f0}
.pt-hd{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:8px}
.pt-num{font-size:36px;font-weight:700;color:#3b82f6;font-family:monospace;line-height:1.1}
.pt-num small{font-size:14px;font-weight:400;color:#94a3b8;margin-left:4px}
.pt-sub{font-size:12px;color:#94a3b8;margin:6px 0 12px}
.pt-sign{width:100%;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.pt-card-hd{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:10px}
.pt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.pt-gift{text-align:center;padding:12px 8px;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer;transition:background .15s}
.pt-gift:active{background:#f0f9ff}
.pt-g-emoji{font-size:28px;margin-bottom:4px}
.pt-g-name{font-size:12px;font-weight:500;color:#0f172a}
.pt-g-pts{font-size:11px;color:#f59e0b;font-weight:600;margin-top:2px}
.pt-r{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9}
.pt-r:last-child{border-bottom:none}
.pt-r-nm{font-size:13px;color:#475569;font-weight:500}
.pt-r-tm{font-size:11px;color:#94a3b8}
.pt-r-pts{font-size:14px;font-weight:700;color:#dc2626;font-family:monospace}
.pt-r-pts.plus{color:#16a34a}
</style>
