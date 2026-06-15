<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    size="380px"
    :with-header="false"
    :before-close="handleClose"
    custom-class="relax-drawer"
  >
    <div class="relax-container">
      <div class="relax-header">
        <span class="relax-title">🎈 今日放松</span>
        <el-button :icon="Close" circle size="small" @click="visible = false" class="close-btn" />
      </div>

      <!-- 每日一笑 -->
      <div class="relax-section joke-section">
        <div class="section-header">
          <span class="section-icon">😂</span>
          <span class="section-title">每日一笑</span>
          <el-button size="small" text type="primary" @click="nextJoke">换一个</el-button>
        </div>
        <div class="joke-card" :key="jokeIndex">
          <p class="joke-text">{{ currentJoke }}</p>
          <div class="joke-actions">
            <el-button size="small" :type="liked ? 'warning' : 'default'" round @click="likeJoke">
              👍 {{ jokeLikes }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 毒鸡汤 -->
      <div class="relax-section soup-section">
        <div class="section-header">
          <span class="section-icon">🍵</span>
          <span class="section-title">毒鸡汤</span>
          <el-button size="small" text type="primary" @click="nextSoup">换一碗</el-button>
        </div>
        <div class="soup-card" :key="soupIndex">
          <p class="soup-text">{{ currentSoup }}</p>
          <el-button size="small" round class="copy-btn" @click="copySoup">
            📋 复制
          </el-button>
        </div>
      </div>

      <!-- 冷知识 -->
      <div class="relax-section fact-section">
        <div class="section-header">
          <span class="section-icon">💡</span>
          <span class="section-title">冷知识</span>
          <span class="fact-counter">{{ factIndex + 1 }}/{{ facts.length }}</span>
        </div>
        <div class="fact-card" :key="factIndex">
          <p class="fact-text">{{ currentFact }}</p>
          <div class="fact-dots">
            <span v-for="(_, i) in facts" :key="i" class="dot" :class="{ active: i === factIndex }" @click="factIndex = i" />
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// Jokes
const jokes = [
  '为什么程序员不喜欢大自然？因为虫子太多了。', '面试官："你简历上说精通 Office？" 我："是的，我特别精通 Word 的关闭按钮。"',
  '老板说这个需求很简单，结果我加班了三天，最后他说"还是用第一版吧"。', '今天去面试，HR问我：你最大的缺点是什么？我说：诚实。HR说：我不觉得诚实是缺点。我说：我他妈才不在乎你怎么觉得。',
  '产品经理：这个功能明天能上线吗？程序员：能，但用户可能不太喜欢。产品经理：为什么？程序员：因为它充满了 bug。',
  '我的人生就像公交车：有人上车，有人下车，但司机永远不在我想去的那条路线上。', '两个程序员聊天："我昨天把我家的智能家居系统重写了一遍。" "为什么？" "灯的开关反应太慢了。"',
]
const jokeIndex = ref(0)
const jokeLikes = ref(0)
const liked = ref(false)
const currentJoke = computed(() => jokes[jokeIndex.value])
function nextJoke() { jokeIndex.value = (jokeIndex.value + 1) % jokes.length; liked.value = false }
function likeJoke() { if (!liked.value) { jokeLikes.value++; liked.value = true } }

// Soup (毒鸡汤)
const soups = [
  '努力不一定会成功，但不努力一定会很舒服。', '只要是石头，到哪里都不会发光的。',
  '今天解决不了的事情，也别着急，因为明天可能还是解决不了。', '很多时候你不逼自己一把，你就不知道你还有把事情搞砸的本事。',
  '上帝为你关上一扇门，然后就去睡觉了。', '你以为有钱人很快乐吗？没错，他们的快乐你根本想象不到。',
  '人生就是这样，有欢笑也有泪水。一部分人主要负责欢笑，另一部分人主要负责泪水。',
]
const soupIndex = ref(0)
const currentSoup = computed(() => soups[soupIndex.value])
function nextSoup() { soupIndex.value = (soupIndex.value + 1) % soups.length }
function copySoup() { navigator.clipboard.writeText(currentSoup.value).catch(() => {}) }

// Facts (冷知识)
const facts = [
  '考拉指纹与人类指纹几乎无法区分，连电子显微镜都分不出来。', '你无法在同一天既看到满月又看到新月。',
  '袋鼠不会向后跳。', '一个闪电的能量足以烤 10 万片面包。',
  '猫头鹰的眼球是管状的，不能转动，所以它们必须转头看东西（能转 270 度）。',
]
const factIndex = ref(0)
const currentFact = computed(() => facts[factIndex.value])
let factTimer = null
function startFactCarousel() {
  factTimer = setInterval(() => { factIndex.value = (factIndex.value + 1) % facts.length }, 5000)
}
startFactCarousel()

function handleClose() { visible.value = false }
</script>

<style scoped>
.relax-drawer :deep(.el-drawer__body) { padding: 0; background: linear-gradient(180deg, #F8FAFC 0%, #FFF7ED 100%); }
.relax-container { padding: 24px 20px; }
.relax-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.relax-title { font-size: 20px; font-weight: 700; color: #1E293B; }
.close-btn { border: none !important; background: rgba(0,0,0,0.04) !important; }
.relax-section { margin-bottom: 24px; }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.section-icon { font-size: 20px; }
.section-title { font-size: 15px; font-weight: 600; color: #1E293B; flex: 1; }
.joke-card, .soup-card, .fact-card {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.joke-text, .soup-text, .fact-text { font-size: 14px; line-height: 1.7; color: #334155; margin: 0 0 12px 0; }
.joke-actions { display: flex; justify-content: flex-end; }
.copy-btn { background: rgba(0,0,0,0.04) !important; border: none !important; }
.fact-counter { font-size: 12px; color: #94A3B8; }
.fact-dots { display: flex; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #CBD5E1; cursor: pointer; transition: all 0.2s; }
.dot.active { background: var(--crm-accent); width: 24px; border-radius: 4px; }
</style>
