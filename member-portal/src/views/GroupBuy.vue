<template>
<div class="page">
  <div class="section-hd"><h2>🤝 拼团购买</h2></div>
  <div v-if="groups.length" class="prod-grid">
    <div v-for="g in groups" :key="g.id" class="gb-card">
      <div class="gb-badge">{{ g.min_members }}人团</div>
      <div class="gb-img">{{ '🛍️' }}</div>
      <div class="gb-info">
        <div class="gb-name">{{ g.title || g.product_name }}</div>
        <div class="gb-progress"><el-progress :percentage="Math.round(g.current_members/g.min_members*100)" :color="'#FF6B35'"/></div>
        <div class="gb-meta">已有{{ g.current_members }}/{{ g.min_members }}人参团</div>
        <div class="gb-price-row">
          <span class="gb-price">{{ Math.round((g.discount_rate||0.7)*100) }}折</span>
          <span class="gb-orig">¥{{ g.price }}</span>
        </div>
        <el-button type="primary" size="small" round @click="joinGroup(g)" style="width:100%;margin-top:8px">立即参团</el-button>
      </div>
    </div>
  </div>
  <div v-else class="empty-state"><div class="empty-icon">🤝</div><div>暂无拼团活动</div></div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
const groups = ref([])
onMounted(async () => { try { const r = await request.get('/public/group-buys'); groups.value = r || [] } catch {} })
async function joinGroup(g) { try { await request.post('/public/group-buys/' + g.id + '/join'); ElMessage.success('参团成功！已加入「' + g.title + '」拼团'); const r = await request.get('/public/group-buys'); groups.value = r || [] } catch(e) { ElMessage.error(e?.message || '参团失败') } }
</script>

<style scoped>
.gb-card{background:#fff;border-radius:14px;padding:0;overflow:hidden;border:2px solid #FF6B35;position:relative}
.gb-badge{position:absolute;top:8px;left:8px;background:#FF6B35;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px}
.gb-img{height:100px;display:flex;align-items:center;justify-content:center;font-size:48px;background:#FFF7ED}
.gb-info{padding:14px}
.gb-name{font-weight:600;margin-bottom:8px}
.gb-meta{font-size:12px;color:#64748B;margin:4px 0}
.gb-price-row{display:flex;align-items:baseline;gap:6px;margin-top:4px}
.gb-price{font-size:20px;font-weight:800;color:#FF6B35}
.gb-orig{font-size:11px;color:#9CA3AF;text-decoration:line-through}
</style>
