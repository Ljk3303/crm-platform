<template>
  <div class="pomodoro" :class="mode">
    <div class="pomo-header">
      <span class="pomo-icon">{{ mode === 'work' ? '🍅' : '☕' }}</span>
      <span class="pomo-mode">{{ mode === 'work' ? '专注工作中' : '休息时间' }}</span>
    </div>

    <!-- 环形进度 -->
    <div class="pomo-ring" @click="toggle">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" stroke-width="6" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          :stroke="mode === 'work' ? '#2563EB' : '#F59E0B'"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
          transform="rotate(-90 50 50)"
          style="transition: stroke-dashoffset 0.5s linear"
        />
      </svg>
      <div class="pomo-time">
        <span class="minutes">{{ minutes }}</span>
        <span class="colon">:</span>
        <span class="seconds">{{ seconds }}</span>
      </div>
    </div>

    <el-button
      :type="running ? 'danger' : 'primary'"
      round size="large"
      @click="toggle"
      class="pomo-btn"
    >
      {{ running ? '⏸ 暂停' : '▶ 开始' }}
    </el-button>

    <div class="pomo-info">
      完成 {{ sessions }} 个番茄 · {{ mode === 'rest' ? '休息中...' : '加油！' }}
    </div>

    <!-- 白噪音选择 -->
    <div v-if="mode === 'rest'" class="white-noise animate-in">
      <span class="noise-label">🎵 白噪音</span>
      <div class="noise-buttons">
        <el-button size="small" :type="noise === 'rain' ? 'primary' : 'default'" round @click="noise = 'rain'">🌧 雨声</el-button>
        <el-button size="small" :type="noise === 'cafe' ? 'primary' : 'default'" round @click="noise = 'cafe'">☕ 咖啡馆</el-button>
        <el-button size="small" :type="noise === 'forest' ? 'primary' : 'default'" round @click="noise = 'forest'">🌲 森林</el-button>
        <el-button size="small" :type="noise === 'none' ? 'primary' : 'default'" round @click="noise = 'none'">🔇 关闭</el-button>
      </div>
    </div>

    <!-- 呼吸引导 -->
    <div v-if="mode === 'rest'" class="breathing animate-in">
      <div class="breath-circle" :class="{ inhale: breathPhase === 'inhale' }">
        <span>{{ breathPhase === 'inhale' ? '吸气' : '呼气' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const WORK_TIME = 25 * 60
const REST_TIME = 5 * 60
const circumference = 2 * Math.PI * 42

const mode = ref('work') // 'work' | 'rest'
const timeLeft = ref(WORK_TIME)
const running = ref(false)
const sessions = ref(0)
const noise = ref('none')
const breathPhase = ref('inhale')

let timer = null
let breathTimer = null

const minutes = computed(() => String(Math.floor(timeLeft.value / 60)).padStart(2, '0'))
const seconds = computed(() => String(timeLeft.value % 60).padStart(2, '0'))
const progressOffset = computed(() => {
  const total = mode.value === 'work' ? WORK_TIME : REST_TIME
  return circumference * (1 - timeLeft.value / total)
})

function toggle() {
  running.value = !running.value
  if (running.value) startTimer()
  else stopTimer()
}

function startTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (timeLeft.value <= 0) {
      switchMode()
      return
    }
    timeLeft.value--
  }, 1000)
}

function stopTimer() { clearInterval(timer) }

function switchMode() {
  clearInterval(timer)
  if (mode.value === 'work') {
    sessions.value++
    mode.value = 'rest'
    timeLeft.value = REST_TIME
    startBreathing()
  } else {
    mode.value = 'work'
    timeLeft.value = WORK_TIME
    stopBreathing()
  }
  if (running.value) startTimer()
}

function startBreathing() {
  clearInterval(breathTimer)
  breathPhase.value = 'inhale'
  breathTimer = setInterval(() => {
    breathPhase.value = breathPhase.value === 'inhale' ? 'exhale' : 'inhale'
  }, 4000)
}

function stopBreathing() { clearInterval(breathTimer) }

onUnmounted(() => { clearInterval(timer); clearInterval(breathTimer) })
</script>

<style scoped>
.pomodoro {
  background: linear-gradient(135deg, #F0F4FF, #FFF7ED);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: background 0.5s;
}
.pomodoro.rest { background: linear-gradient(135deg, #FFF7ED, #FEF3C7); }
.pomo-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px; }
.pomo-icon { font-size: 24px; }
.pomo-mode { font-size: 16px; font-weight: 600; color: #1E293B; }

.pomo-ring { position: relative; width: 140px; height: 140px; margin: 0 auto 16px; cursor: pointer; }
.pomo-ring svg { width: 100%; height: 100%; }
.pomo-time { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 2px; }
.minutes, .seconds { font-size: 28px; font-weight: 700; color: #1E293B; font-family: var(--crm-font-mono); }
.colon { font-size: 24px; color: #94A3B8; }

.pomo-btn { margin-bottom: 12px; }
.pomo-info { font-size: 12px; color: #94A3B8; margin-bottom: 16px; }

.white-noise { margin-top: 16px; }
.noise-label { display: block; font-size: 13px; color: #64748B; margin-bottom: 8px; font-weight: 500; }
.noise-buttons { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }

.breathing { margin-top: 16px; display: flex; justify-content: center; }
.breath-circle {
  width: 80px; height: 80px; border-radius: 50%;
  background: var(--relax-gradient-1);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600; color: #92400E;
  transition: transform 4s ease-in-out;
}
.breath-circle.inhale { transform: scale(1.5); }
</style>
