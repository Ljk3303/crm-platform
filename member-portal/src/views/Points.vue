<template>
<div class="page">
  <div class="pts-banner">
    <div class="pts-val">{{ balance.available_points || 0 }}</div>
    <div class="pts-label">可用积分</div>
    <div style="margin-top:12px;font-size:13px;opacity:.8">累计获得 {{ balance.total_points || 0 }} 积分</div>
  </div>

  <div class="checkin-bar">
    <div class="checkin-days">
      <div v-for="d in 7" :key="d" class="checkin-day" :class="{done:d<=signData.continuousDays, today:d===signData.continuousDays+1}">{{ d }}</div>
    </div>
    <el-button type="primary" :disabled="signData.signed" @click="doSign" size="large" round style="min-width:100px">
      {{ signData.signed ? '已签到' : '签到 +' + (Math.min(signData.continuousDays+1,7)*5 + (signData.continuousDays>=6?20:0)) }}
    </el-button>
  </div>

  <div class="section"><div class="section-hd"><h2>🎁 积分商城</h2></div>
    <div class="prod-grid">
      <div v-for="e in exchangeItems" :key="e.name" class="exchange-card" @click="doExchange(e)">
        <div class="ex-icon">{{ e.icon }}</div>
        <div class="ex-name">{{ e.name }}</div>
        <div class="ex-pts">{{ e.points }} 积分</div>
        <el-button size="small" round type="primary" :disabled="(balance.available_points||0)<e.points" :loading="exchanging===e.name">
          {{ (balance.available_points||0)>=e.points ? '立即兑换' : '积分不足' }}
        </el-button>
      </div>
    </div>
  </div>

  <div class="section"><div class="section-hd"><h2>📋 积分明细</h2></div>
    <div v-if="records.length" style="background:#fff;border-radius:14px;overflow:hidden">
      <div v-for="r in records" :key="r.id" style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #F3F4F6">
        <div><div style="font-weight:500;font-size:14px">{{ r.reason || r.type }}</div><div style="font-size:12px;color:#9CA3AF">{{ r.created_at?.substring(0,16) }}</div></div>
        <div :style="{color:r.type==='收入'?'#059669':'#DC2626',fontWeight:700,fontSize:15}">{{ r.type==='收入'?'+':'-' }}{{ r.points }}分</div>
      </div>
    </div>
    <div v-else class="empty-state"><div class="empty-icon">📊</div><div>暂无积分记录</div></div>
  </div>
</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const balance = ref({ available_points: 0, total_points: 0 })
const signData = reactive({ signed: false, continuousDays: 0 })
const records = ref([])
const exchangeItems = ref([])
const exchanging = ref(null)

const defaultExchangeItems = [
  { name: '5元无门槛券', points: 500, icon: '🎫', type: 'coupon' },
  { name: '10元满减券', points: 800, icon: '💰', type: 'coupon' },
  { name: '品牌帆布袋', points: 1200, icon: '🛍️', type: 'gift' },
  { name: '限量徽章套装', points: 2000, icon: '🏅', type: 'gift' },
  { name: '保温杯(马卡龙)', points: 3000, icon: '🥤', type: 'gift' },
  { name: '蓝牙音箱', points: 5000, icon: '🔊', type: 'gift' },
]

onMounted(async () => {
  try {
    const [b, s, r] = await Promise.all([
      request.get('/points/balance'),
      request.get('/points/sign-status'),
      request.get('/points/records'),
    ])
    balance.value = b
    signData.signed = s.signed
    signData.continuousDays = s.records?.[0]?.continuous_days || 0
    records.value = r || []
  } catch {}
  // Load exchange items - try dynamic import first
  try {
    const mod = await import('../data/exchange.json')
    exchangeItems.value = mod.default || mod
  } catch {
    exchangeItems.value = defaultExchangeItems
  }
})

async function doSign() {
  try {
    const r = await request.post('/points/sign')
    balance.value.available_points += r.points
    balance.value.total_points += r.points
    signData.signed = true
    signData.continuousDays = r.continuousDays
    ElMessage.success('签到成功！+' + r.points + '积分')
  } catch (e) { ElMessage.error(e.message || '签到失败') }
}

async function doExchange(item) {
  try {
    await ElMessageBox.confirm(`确认用 ${item.points} 积分兑换「${item.name}」？`, '确认兑换', {
      confirmButtonText: '确认兑换', cancelButtonText: '取消', type: 'warning'
    })
  } catch { return }
  
  exchanging.value = item.name
  try {
    await request.post('/points/exchange', { exchangeType: item.type || 'coupon', pointsCost: item.points })
    balance.value.available_points -= item.points
    ElMessage.success('兑换成功！')
    // Refresh records
    records.value = await request.get('/points/records') || []
  } catch (e) {
    ElMessage.error(e?.message || '兑换失败')
  } finally {
    exchanging.value = null
  }
}
</script>

<style scoped>
.exchange-card{background:#fff;border-radius:14px;padding:20px;text-align:center;border:1px solid #E5E7EB;cursor:pointer;transition:all .2s}
.exchange-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-2px)}
.ex-icon{font-size:40px;margin-bottom:8px}
.ex-name{font-weight:600;font-size:14px;margin-bottom:6px}
.ex-pts{color:var(--pri);font-weight:700;font-size:15px;margin-bottom:10px}
</style>
