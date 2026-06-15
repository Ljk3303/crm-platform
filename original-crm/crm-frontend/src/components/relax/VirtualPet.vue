<template>
  <div
    v-if="!hidden"
    class="virtual-pet"
    :class="{ idle: isIdle, happy: justFed, hidden: hiding }"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @mousedown="startDrag"
    @contextmenu.prevent="showMenu"
  >
    <!-- 宠物身体 -->
    <div class="pet-body" @click="feed" title="点击喂食 🐟">
      <div class="pet-emoji">{{ isIdle ? '😴' : justFed ? '😻' : mood }}</div>
      <div class="pet-name">旺财</div>
      <div class="pet-intimacy">❤️ {{ intimacy }}</div>
      <transition name="bubble">
        <div v-if="justFed" class="feed-effect">+1 ❤️</div>
      </transition>
    </div>

    <!-- 右键菜单 -->
    <transition name="fade">
      <div v-if="menuVisible" class="pet-menu" @click.stop>
        <div class="menu-item" @click="hidePet">🙈 暂时隐藏</div>
        <div class="menu-item danger" @click="permaHide">🚫 永久隐藏</div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const moods = ['🐱', '😺', '😸', '😹', '😻', '😼', '😽', '🙀']
const mood = ref('🐱')
const intimacy = ref(10)
const isIdle = ref(false)
const justFed = ref(false)
const hidden = ref(false)
const hiding = ref(false)
const menuVisible = ref(false)

const pos = reactive({ x: 0, y: 0 })
const dragOffset = reactive({ x: 0, y: 0 })
let dragging = false
let idleTimer = null

onMounted(() => {
  pos.x = window.innerWidth - 100
  pos.y = window.innerHeight - 160
  resetIdleTimer()
  mood.value = moods[Math.floor(Math.random() * moods.length)]
})

function resetIdleTimer() {
  clearTimeout(idleTimer)
  isIdle.value = false
  idleTimer = setTimeout(() => { isIdle.value = true }, 30000)
}

function feed() {
  intimacy.value++
  justFed.value = true
  mood.value = '😻'
  resetIdleTimer()
  setTimeout(() => { justFed.value = false; mood.value = moods[Math.floor(Math.random()*moods.length)] }, 1500)
  menuVisible.value = false
}

function startDrag(e) {
  if (e.target.closest('.pet-menu')) return
  dragging = true
  dragOffset.x = e.clientX - pos.x
  dragOffset.y = e.clientY - pos.y
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  menuVisible.value = false
}

function onDrag(e) {
  if (!dragging) return
  pos.x = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 80))
  pos.y = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100))
}

function stopDrag() { dragging = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag) }

function showMenu() { menuVisible.value = !menuVisible.value }
function hidePet() { hiding.value = true; setTimeout(() => hidden.value = true, 300); menuVisible.value = false }
function permaHide() { hidden.value = true; localStorage.setItem('pet-hidden', 'true'); menuVisible.value = false }

// 暴露方法供外部调用
defineExpose({ cheer, resetVisibility })

function cheer() {
  mood.value = '😸'
  intimacy.value++
  justFed.value = true
  setTimeout(() => { justFed.value = false; mood.value = moods[Math.floor(Math.random()*moods.length)] }, 1500)
}

function resetVisibility() {
  if (localStorage.getItem('pet-hidden') !== 'true') {
    hidden.value = false
    hiding.value = false
  }
}

onUnmounted(() => { clearTimeout(idleTimer); document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag) })
</script>

<style scoped>
.virtual-pet {
  position: fixed;
  z-index: 9998;
  cursor: grab;
  user-select: none;
  transition: transform 0.3s var(--crm-ease-spring);
}
.virtual-pet:active { cursor: grabbing; }
.virtual-pet.idle { animation: petIdle 2s ease-in-out infinite; }
.virtual-pet.hidden { transform: scale(0); opacity: 0; pointer-events: none; }

@keyframes petIdle {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-3px) rotate(1deg); }
  75% { transform: translateY(-3px) rotate(-1deg); }
}

.pet-body {
  width: 72px; height: 72px;
  background: var(--relax-gradient-2);
  border-radius: 50%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  cursor: pointer;
  transition: transform 0.2s var(--crm-ease-spring);
  position: relative;
}
.pet-body:hover { transform: scale(1.1); }
.pet-body:active { transform: scale(0.95); }

.pet-emoji { font-size: 28px; line-height: 1; }
.pet-name { font-size: 10px; color: #64748B; margin-top: 2px; font-weight: 600; }
.pet-intimacy { font-size: 9px; color: #EF4444; position: absolute; bottom: -18px; white-space: nowrap; }

.feed-effect {
  position: absolute; top: -20px;
  font-size: 14px; color: #EF4444; font-weight: 700;
  animation: floatUp 1.2s ease-out forwards;
}
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-30px) scale(1.3); }
}

.pet-menu {
  position: absolute; bottom: 80px; right: 0;
  background: white; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  overflow: hidden; min-width: 140px;
  animation: crm-bounce-in 0.3s var(--crm-ease-spring);
}
.menu-item {
  padding: 10px 16px; font-size: 13px; cursor: pointer;
  transition: background 0.15s;
}
.menu-item:hover { background: #F1F5F9; }
.menu-item.danger { color: #EF4444; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.bubble-enter-active { animation: crm-bounce-in 0.3s var(--crm-ease-spring); }
.bubble-leave-active { animation: floatUp 0.8s ease-out forwards; }
</style>
