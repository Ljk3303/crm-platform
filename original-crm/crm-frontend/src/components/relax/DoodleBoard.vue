<template>
  <div class="doodle-wrap">
    <div class="doodle-header">
      <span>🎨 随手涂鸦</span>
      <div class="doodle-actions">
        <el-button size="small" text @click="clear">🗑 清除</el-button>
        <el-button size="small" text @click="save">💾 保存</el-button>
      </div>
    </div>
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="200"
      class="doodle-canvas"
      @mousedown="startDraw"
      @mousemove="draw"
      @mouseup="stopDraw"
      @mouseleave="stopDraw"
      @touchstart.prevent="startTouch"
      @touchmove.prevent="drawTouch"
      @touchend="stopDraw"
    />
    <div class="doodle-colors">
      <span
        v-for="c in colors"
        :key="c"
        class="color-dot"
        :class="{ active: color === c }"
        :style="{ background: c }"
        @click="color = c"
      />
      <span class="size-label">粗细</span>
      <el-slider v-model="brushSize" :min="1" :max="10" style="width: 100px" />
    </div>
    <div v-if="saved.length" class="doodle-gallery">
      <div v-for="(img, i) in saved" :key="i" class="doodle-thumb">
        <img :src="img" alt="doodle" @click="preview = img" />
        <span class="doodle-badge">#{{ i + 1 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const canvasRef = ref(null)
const color = ref('#2563EB')
const brushSize = ref(3)
const drawing = ref(false)
const saved = ref([])
const preview = ref(null)
const canvasWidth = 320

const colors = ['#2563EB', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#1E293B']

let ctx = null

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
})

function startDraw(e) { drawing.value = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY) }
function draw(e) { if (!drawing.value) return; ctx.strokeStyle = color.value; ctx.lineWidth = brushSize.value; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke() }
function stopDraw() { drawing.value = false }
function startTouch(e) { const t = e.touches[0]; const r = canvasRef.value.getBoundingClientRect(); drawing.value = true; ctx.beginPath(); ctx.moveTo(t.clientX-r.left, t.clientY-r.top) }
function drawTouch(e) { if (!drawing.value) return; const t = e.touches[0]; const r = canvasRef.value.getBoundingClientRect(); ctx.strokeStyle = color.value; ctx.lineWidth = brushSize.value; ctx.lineTo(t.clientX-r.left, t.clientY-r.top); ctx.stroke() }
function clear() { ctx.clearRect(0, 0, canvasWidth, 200) }
function save() { const data = canvasRef.value.toDataURL(); saved.value.push(data); clear() }
</script>

<style scoped>
.doodle-wrap {
  background: linear-gradient(135deg, #FEFCE8, #F0FDF4);
  border-radius: 16px;
  padding: 16px;
}
.doodle-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #1E293B; }
.doodle-canvas { border-radius: 12px; background: white; cursor: crosshair; width: 100%; border: 1px solid #E2E8F0; }
.doodle-colors { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.color-dot { width: 20px; height: 20px; border-radius: 50%; cursor: pointer; transition: transform 0.15s; border: 2px solid transparent; }
.color-dot.active { transform: scale(1.3); border-color: #1E293B; }
.color-dot:hover { transform: scale(1.2); }
.size-label { font-size: 12px; color: #94A3B8; margin-left: 8px; }
.doodle-gallery { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; }
.doodle-thumb { position: relative; flex-shrink: 0; }
.doodle-thumb img { width: 60px; height: 40px; border-radius: 6px; cursor: pointer; border: 1px solid #E2E8F0; object-fit: cover; }
.doodle-badge { position: absolute; bottom: 2px; right: 2px; font-size: 9px; background: rgba(0,0,0,0.5); color: white; padding: 1px 4px; border-radius: 4px; }
</style>
