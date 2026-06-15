<template><div><h2>🎖 会员中心</h2><div v-if="tier" class="member-card" :style="{borderColor:tier.currentTier.id===4?'#D4A574':'#F7B731'}"><div class="mc-badge">{{ tier.currentTier.id===4?'💎':tier.currentTier.id===3?'🥇':tier.currentTier.id===2?'🥈':'🥉' }}</div><h3>{{ tier.currentTier.name }}</h3><div class="mc-spent">累计消费 ¥{{ tier.totalSpent.toFixed(2) }}</div><div v-if="tier.nextTier" class="mc-progress"><div class="mp-bar"><div class="mp-fill" :style="{width:tier.progress+'%'}"></div></div><div>距{{ tier.nextTier.name }}还需 ¥{{ (tier.nextTier.min_spending - tier.totalSpent).toFixed(2) }}</div></div><div v-else>已是最高等级 🎉</div></div>
    <div class="benefits"><div v-for="t in tiers" :key="t.id" class="b-card" :class="{active:tier?.currentTier?.id===t.id}"><div>{{ t.id===4?'💎':t.id===3?'🥇':t.id===2?'🥈':'🥉' }} {{ t.name }}</div><div>¥{{ t.min_spending }}</div><div>{{ Math.round((1-t.discount_rate)*100) }}折</div></div></div>
  </div></template>
<script setup>import { ref, onMounted } from 'vue'; import request from '@/utils/request';
const tier = ref(null); const tiers = ref([]);
onMounted(async () => { try { tier.value = await request.get('/member/my-tier'); tiers.value = await request.get('/member/tiers') } catch {} });
</script>
<style scoped>
.member-card{background:#fff;border-radius:16px;padding:32px;text-align:center;border:3px solid;margin-bottom:20px}
.mc-badge{font-size:48px;margin-bottom:12px}.mc-spent{font-size:16px;color:#636E72;margin:8px 0}
.mc-progress{margin-top:16px}.mp-bar{height:8px;background:#F0F0F0;border-radius:4px;overflow:hidden;margin-bottom:8px}.mp-fill{height:100%;background:linear-gradient(90deg,#F7B731,#FF6B35);border-radius:4px;transition:width .5s}
.benefits{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.b-card{padding:16px;background:#fff;border-radius:12px;text-align:center;border:2px solid #F0F0F0}.b-card.active{border-color:#FF6B35;background:#FFF5F0}
</style>
