<template>
  <div class="ai-assistant">
    <div v-if="!isOpen" class="ai-fab" @click="isOpen = true">
      <el-icon :size="24"><Service /></el-icon>
    </div>
    <div
      v-else
      class="ai-panel"
      :style="panelStyle"
    >
      <div class="ai-header" @mousedown="startDrag">
        <span>AI 销售助手</span>
        <div class="ai-header-actions">
          <el-button link @click="minimizePanel">
            <el-icon><Minus /></el-icon>
          </el-button>
          <el-button link @click="closePanel">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="ai-messages" ref="msgContainer">
        <div v-if="messages.length === 0" class="ai-welcome">
          <p>你好！我是 AI 销售助手，可以帮你：</p>
          <ul>
            <li>分析客户数据</li>
            <li>预测销售趋势</li>
            <li>识别高价值客户</li>
            <li>生成营销文案</li>
          </ul>
          <p>请选择下方快捷指令或直接输入问题</p>
        </div>
        <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
          <div class="msg-avatar">{{ msg.role === 'assistant' ? 'AI' : msg.role === 'system' ? 'SYS' : '我' }}</div>
          <div class="msg-content">
            <div v-if="typeof msg.content === 'string'" v-html="formatContent(msg.content)"></div>
            <div v-else-if="msg.content && msg.content.intent" class="structured-response">
              <div class="response-intent">
                <el-tag size="small" type="info">{{ msg.content.intent }}</el-tag>
              </div>
              <div v-if="msg.content.steps" class="response-steps">
                <div v-for="(step, si) in msg.content.steps" :key="si" class="step-item">
                  <el-icon><Check /></el-icon>
                  <span>{{ step }}</span>
                </div>
              </div>
              <div class="response-result">{{ msg.content.result }}</div>
            </div>
            <div v-else>{{ msg.content }}</div>
          </div>
        </div>
        <div v-if="isTyping" class="msg assistant">
          <div class="msg-avatar">AI</div>
          <div class="msg-content typing">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
      <div class="ai-quick-commands">
        <el-tag
          v-for="cmd in quickCommands"
          :key="cmd"
          class="cmd-tag"
          @click="sendCommand(cmd)"
        >
          {{ cmd }}
        </el-tag>
      </div>
      <div class="ai-input">
        <el-input
          v-model="inputText"
          placeholder="输入指令..."
          @keyup.enter="sendMessage"
          :disabled="isTyping"
        />
        <el-button type="primary" @click="sendMessage" :disabled="isTyping" :icon="Promotion">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { Service, Minus, Close, Promotion, Check } from '@element-plus/icons-vue'
import request from '@/api'

const isOpen = ref(false)
const isTyping = ref(false)
const messages = ref([])
const inputText = ref('')
const msgContainer = ref(null)

const quickCommands = ['今日优先跟进', '销售预测', 'RFM分析', '客户流失预警', '最近订单', '帮助']

const panelStyle = reactive({
  right: '20px',
  bottom: '20px',
  position: 'fixed'
})

let dragging = false
let dragStartX = 0
let dragStartY = 0
let panelOffsetX = 0
let panelOffsetY = 0

function startDrag(e) {
  dragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY

  const onMouseMove = (ev) => {
    if (!dragging) return
    const dx = ev.clientX - dragStartX
    const dy = ev.startY - dragStartY
    panelOffsetX += dx
    panelOffsetY += dy
    dragStartX = ev.clientX
    dragStartY = ev.clientY
    panelStyle.right = `${20 - panelOffsetX}px`
    panelStyle.bottom = `${20 + panelOffsetY}px`
  }

  const onMouseUp = () => {
    dragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function minimizePanel() {
  isOpen.value = false
}

function closePanel() {
  isOpen.value = false
  messages.value = []
  panelOffsetX = 0
  panelOffsetY = 0
}

function scrollToBottom() {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  })
}

function addMessage(role, content) {
  messages.value.push({ role, content })
  scrollToBottom()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  addMessage('user', text)
  inputText.value = ''
  isTyping.value = true

  try {
    const res = await request.post('/ai/agent/command', { command: text })
    const data = res.data
    if (data && data.intent) {
      addMessage('assistant', {
        intent: data.intent,
        steps: data.steps || [],
        result: data.result || data.message || ''
      })
    } else {
      addMessage('assistant', data.result || data.message || data || '收到')
    }
  } catch (err) {
    addMessage('system', '抱歉，请求失败，请稍后重试')
  } finally {
    isTyping.value = false
  }
}

function sendCommand(cmd) {
  inputText.value = cmd
  sendMessage()
}

function formatContent(content) {
  return content.replace(/\n/g, '<br>')
}

onMounted(() => {
  window.addEventListener('mousedown', (e) => {
    // Reset drag tracking if mouse up happened outside
  })
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.ai-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.ai-panel {
  width: 380px;
  height: 500px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-color-primary);
  color: #fff;
  cursor: move;
  user-select: none;
  font-size: 15px;
  font-weight: 500;
  flex-shrink: 0;
}

.ai-header-actions {
  display: flex;
  gap: 4px;
}

.ai-header-actions .el-button--link {
  color: #fff;
}

.ai-messages {
  flex: 1;
  height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
}

.ai-welcome {
  text-align: center;
  color: #909399;
  padding: 24px 12px;
  font-size: 13px;
}

.ai-welcome ul {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}

.ai-welcome li {
  padding: 4px 0;
}

.ai-welcome li::before {
  content: '· ';
  color: var(--el-color-primary);
}

.msg {
  display: flex;
  margin-bottom: 12px;
  gap: 8px;
}

.msg.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.msg.assistant .msg-avatar {
  background: #e6f7ff;
  color: #1890ff;
}

.msg.user .msg-avatar {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.msg.system .msg-avatar {
  background: #fff2f0;
  color: #ff4d4f;
}

.msg-content {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.msg.assistant .msg-content {
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.msg.user .msg-content {
  background: var(--el-color-primary);
  color: #fff;
}

.msg.system .msg-content {
  background: #fff2f0;
  color: #ff4d4f;
}

.msg-content.typing {
  padding: 12px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #bbb;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
}

.structured-response {
  font-size: 13px;
}

.response-intent {
  margin-bottom: 8px;
}

.response-steps {
  margin-bottom: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  color: #52c41a;
  font-size: 12px;
}

.response-result {
  color: #333;
  white-space: pre-wrap;
}

.ai-quick-commands {
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.cmd-tag {
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.cmd-tag:hover {
  background: var(--el-color-primary);
  color: #fff;
  border-color: var(--el-color-primary);
}

.ai-input {
  display: flex;
  gap: 8px;
  padding: 8px 12px 12px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.ai-input .el-input {
  flex: 1;
}
</style>
