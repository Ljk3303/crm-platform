<template>
  <div class="bubble-wrap" :class="{ fullscreen: isFullscreen }">
    <div class="bw-header">
      <span>🫧 捏泡泡</span>
      <div class="bw-actions">
        <span class="bw-score">已捏 {{ popped }} / {{ total }}</span>
        <el-button size="small" text @click="reset">🔄 刷新</el-button>
        <el-button size="small" text @click="isFullscreen = !isFullscreen">
          {{ isFullscreen ? '⊠ 退出全屏' : '⛶ 全屏' }}
        </el-button>
      </div>
    </div>
    <div class="bw-grid" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
      <div
        v-for="(b, i) in bubbles"
        :key="i"
        class="bubble"
        :class="{ popped: b.popped }"
        @click="pop(i)"
      >
        <span v-if="!b.popped" class="bubble-inner"></span>
        <span v-else class="bubble-popped">💥</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const cols = 10
const rows = 8
const total = cols * rows

const bubbles = reactive(Array.from({ length: total }, () => ({ popped: false })))
const popped = computed(() => bubbles.filter(b => b.popped).length)

function pop(i) {
  if (bubbles[i].popped) return
  bubbles[i].popped = true
  if (navigator.vibrate) navigator.vibrate(15)
}

function reset() { bubbles.forEach(b => b.popped = false) }

const isFullscreen = ref(false)
</script>

<style scoped>
.bubble-wrap {
  background: linear-gradient(135deg, #EFF6FF, #F0FDF4);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s var(--crm-ease-out);
}
.bubble-wrap.fullscreen {
  position: fixed; inset: 0; z-index: 9999;
  border-radius: 0; padding: 32px;
}
.bw-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; font-weight: 600; font-size: 15px; color: #1E293B;
  flex-wrap: wrap; gap: 8px;
}
.bw-actions { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.bw-score { color: #64748B; font-weight: 400; }
.bw-grid { display: grid; gap: 8px; max-width: 600px; margin: 0 auto; }
.bubble {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s var(--crm-ease-out);
}
.bubble-inner {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(147,197,253,0.7));
  box-shadow: inset 0 -2px 4px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.08);
  transition: all 0.1s;
}
.bubble:hover .bubble-inner { transform: scale(1.1); box-shadow: inset 0 -2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.12); }
.bubble:active .bubble-inner { transform: scale(0.9); }
.bubble.popped { cursor: default; }
.bubble.popped .bubble-inner { opacity: 0; transform: scale(0); }
.bubble-popped { font-size: 18px; animation: crm-bounce-in 0.3s var(--crm-ease-spring); }
</style>
