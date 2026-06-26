<template>
  <div class="ai-page">
    <!-- Left sidebar: scenarios -->
    <aside class="ai-side">
      <div class="ai-side-hd">
        <div class="ai-logo">
          <div class="ai-logo-dot"></div>
          <span>AI 智能助手</span>
        </div>
        <button class="new-chat-btn" @click="newChat"><el-icon><Plus/></el-icon>新建对话</button>
      </div>
      <div class="ai-side-body">
        <div class="ai-side-section">智能场景</div>
        <div
          v-for="s in scenarios"
          :key="s.id"
          :class="['ai-scenario', { active: scenarioId === s.id }]"
          @click="scenarioId = s.id"
        >
          <el-icon :size="16"><component :is="s.icon"/></el-icon>
          <div class="ai-scenario-info">
            <div class="ai-scenario-name">{{ s.name }}</div>
            <div class="ai-scenario-desc">{{ s.desc }}</div>
          </div>
        </div>

        <div class="ai-side-section" style="margin-top:18px">历史对话</div>
        <div class="ai-history">
          <div v-for="h in history" :key="h.id" class="ai-history-item" @click="loadHistory(h)">
            <el-icon><ChatDotRound/></el-icon>
            <span class="hi-title">{{ h.title }}</span>
            <span class="hi-time">{{ h.time }}</span>
          </div>
          <div v-if="!history.length" class="ai-empty">暂无历史对话</div>
        </div>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="ai-main">
      <header class="ai-main-hd">
        <div>
          <h2>{{ currentScenario.name }}</h2>
          <p class="ai-hd-sub">{{ currentScenario.desc }} · 基于真实数据库智能分析</p>
        </div>
        <div class="ai-hd-stats">
          <div class="ai-stat">
            <span class="ai-stat-num">{{ stats.todayQueries }}</span>
            <span class="ai-stat-label">今日咨询</span>
          </div>
          <div class="ai-stat">
            <span class="ai-stat-num">{{ stats.accuracy }}%</span>
            <span class="ai-stat-label">准确率</span>
          </div>
        </div>
      </header>

      <div class="ai-conversation" ref="convRef">
        <!-- Welcome -->
        <div v-if="!messages.length" class="ai-welcome">
          <div class="ai-welcome-icon">
            <el-icon :size="40"><MagicStick/></el-icon>
          </div>
          <h3>你好，{{ userName }}！我是 CRM 智能助手</h3>
          <p class="ai-welcome-sub">我可以帮你查询业务数据、分析客户行为、生成营销文案、预测销售趋势</p>
          <div class="ai-quick-grid">
            <div v-for="q in quickPrompts" :key="q.label" class="ai-quick" @click="sendCommand(q.text)">
              <el-icon :size="18" :color="q.color"><component :is="q.icon"/></el-icon>
              <div>
                <div class="ai-quick-label">{{ q.label }}</div>
                <div class="ai-quick-desc">{{ q.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <template v-else>
          <div v-for="(m, i) in messages" :key="i" :class="['msg-row', m.role]">
            <div class="msg-avatar" :class="m.role">
              <el-icon v-if="m.role==='assistant'" :size="18"><MagicStick/></el-icon>
              <el-icon v-else-if="m.role==='system'" :size="18"><Warning/></el-icon>
              <el-icon v-else :size="18"><User/></el-icon>
            </div>
            <div class="msg-card">
              <div class="msg-head">
                <span class="msg-name">{{ m.role==='assistant'?'AI 助手':m.role==='system'?'系统提示':'我' }}</span>
                <span class="msg-time">{{ m.time }}</span>
              </div>
              <!-- Plain text -->
              <div v-if="m.type==='text' || typeof m.content === 'string'" class="msg-text" v-html="formatContent(m.content)"></div>
              <!-- Structured -->
              <div v-else class="msg-structured">
                <div v-if="m.content.intent" class="msg-intent">
                  <el-tag size="small" :type="m.role==='system'?'danger':'info'" effect="light" round>
                    <el-icon><Aim/></el-icon>{{ m.content.intent }}
                  </el-tag>
                </div>
                <div v-if="m.content.steps && m.content.steps.length" class="msg-steps">
                  <div v-for="(s,si) in m.content.steps" :key="si" class="step-row">
                    <span class="step-num">{{ si+1 }}</span>
                    <span>{{ s }}</span>
                  </div>
                </div>
                <div v-if="m.content.result" class="msg-result">
                  <div v-if="typeof m.content.result === 'string'" v-html="formatContent(m.content.result)"></div>
                  <div v-else-if="m.content.result.summary" class="r-summary">{{ m.content.result.summary }}</div>
                  <div v-if="m.content.result.customers" class="r-customers">
                    <div v-for="c in m.content.result.customers" :key="c.name" class="r-cust">
                      <el-avatar :size="28" :style="{background:'#3b82f6'}">{{ c.name?.substring(0,1) }}</el-avatar>
                      <div class="r-cust-info">
                        <div class="r-cust-name">{{ c.name }}</div>
                        <div class="r-cust-meta">{{ c.phone || c.source || '' }}</div>
                      </div>
                      <el-tag size="small" :type="c.level==='高价值'?'danger':c.level==='潜力客户'?'warning':'info'">{{ c.level || '客户' }}</el-tag>
                    </div>
                  </div>
                  <div v-if="m.content.result.tiers" class="r-tiers">
                    <div v-for="t in m.content.result.tiers" :key="t.tier" class="r-tier">
                      <div class="r-tier-name">{{ t.tier }}</div>
                      <div class="r-tier-bar"><div class="r-tier-fill" :style="{width:t.pct+'%'}"></div></div>
                      <div class="r-tier-val">{{ t.count }}人 · {{ t.pct }}%</div>
                    </div>
                  </div>
                  <div v-if="m.content.result.suggestions" class="r-suggestions">
                    <div v-for="(s,i) in m.content.result.suggestions" :key="i" class="r-sug">
                      <el-icon color="#3b82f6"><Promotion/></el-icon>{{ s }}
                    </div>
                  </div>
                  <div v-if="m.content.result.hotProducts" class="r-products">
                    <div v-for="p in m.content.result.hotProducts" :key="p.name" class="r-prod">
                      <el-icon color="#f59e0b" :size="16"><Goods/></el-icon>
                      <div class="r-prod-name">{{ p.name }}</div>
                      <div class="r-prod-price">¥{{ p.price }}</div>
                    </div>
                  </div>
                  <div v-if="m.content.result && typeof m.content.result === 'object' && !m.content.result.summary && !m.content.result.customers && !m.content.result.tiers && !m.content.result.suggestions && !m.content.result.hotProducts" class="r-stats">
                    <div v-for="(v,k) in m.content.result" :key="k" class="r-stat-row">
                      <span class="r-stat-key">{{ k }}</span>
                      <span class="r-stat-val">{{ v }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="isTyping" class="msg-row assistant">
          <div class="msg-avatar assistant"><el-icon :size="18"><MagicStick/></el-icon></div>
          <div class="msg-card">
            <div class="msg-head"><span class="msg-name">AI 助手</span><span class="msg-time">思考中...</span></div>
            <div class="typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="ai-quick-row">
        <div v-for="q in quickPrompts" :key="q.label" class="ai-quick-pill" @click="sendCommand(q.text)">
          <el-icon :size="13" :color="q.color"><component :is="q.icon"/></el-icon>{{ q.label }}
        </div>
      </div>

      <!-- Input area -->
      <div class="ai-input-wrap">
        <div class="ai-input-box">
          <textarea
            v-model="inputText"
            placeholder="问我任何业务问题，例如：今天有多少待办、本月销售预测、搜索客户..."
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="isTyping"
            rows="1"
          ></textarea>
          <button class="ai-send" :disabled="!inputText.trim() || isTyping" @click="sendMessage">
            <el-icon :size="18"><Promotion/></el-icon>
            <span>发送</span>
          </button>
        </div>
        <div class="ai-input-tip">Enter 发送 · Shift+Enter 换行 · 内容基于实时业务数据</div>
      </div>
    </main>

    <!-- Right insight panel -->
    <aside class="ai-insight">
      <div class="insight-hd">
        <h4>智能洞察</h4>
        <span class="text-muted text-sm">实时分析</span>
      </div>
      <div class="insight-body">
        <div class="insight-card">
          <div class="ic-icon" style="background:#dbeafe;color:#2563eb"><el-icon :size="18"><DataAnalysis/></el-icon></div>
          <div class="ic-info">
            <div class="ic-title">客户健康度</div>
            <div class="ic-num">82<span class="ic-unit">/100</span></div>
            <div class="ic-trend up">↑ 较上周 +3</div>
          </div>
        </div>
        <div class="insight-card">
          <div class="ic-icon" style="background:#dcfce7;color:#16a34a"><el-icon :size="18"><TrendCharts/></el-icon></div>
          <div class="ic-info">
            <div class="ic-title">预测本月销售</div>
            <div class="ic-num">¥38.6<span class="ic-unit">万</span></div>
            <div class="ic-trend up">↑ 完成度 76%</div>
          </div>
        </div>
        <div class="insight-card">
          <div class="ic-icon" style="background:#fee2e2;color:#dc2626"><el-icon :size="18"><Warning/></el-icon></div>
          <div class="ic-info">
            <div class="ic-title">高风险客户</div>
            <div class="ic-num">{{ insight.highRisk }}<span class="ic-unit">位</span></div>
            <div class="ic-trend down">需立即跟进</div>
          </div>
        </div>
        <div class="insight-card">
          <div class="ic-icon" style="background:#fef3c7;color:#d97706"><el-icon :size="18"><Star/></el-icon></div>
          <div class="ic-info">
            <div class="ic-title">高价值机会</div>
            <div class="ic-num">{{ insight.highValue }}</div>
            <div class="ic-trend up">商机价值 ¥12.8万</div>
          </div>
        </div>

        <div class="insight-hd" style="margin-top:6px"><h4>AI 推荐</h4></div>
        <div class="recommend-list">
          <div v-for="r in recommends" :key="r.title" class="rec-item">
            <el-icon :color="r.color" :size="16"><component :is="r.icon"/></el-icon>
            <div>
              <div class="rec-title">{{ r.title }}</div>
              <div class="rec-desc">{{ r.desc }}</div>
            </div>
            <button class="rec-btn" @click="sendCommand(r.cmd)">执行</button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, computed, watch } from 'vue'
import {
  Plus, MagicStick, User, Warning, ChatDotRound, Aim, Promotion, Goods, DataAnalysis,
  TrendCharts, Star, Document, Histogram, Search, Coin, Refresh, Discount, Bell, PieChart, Promotion as Promo
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const userName = localStorage.getItem('realName') || '管理员'
const inputText = ref('')
const isTyping = ref(false)
const messages = ref([])
const convRef = ref(null)
const scenarioId = ref('assistant')

const stats = reactive({ todayQueries: 0, accuracy: 96 })
const insight = reactive({ highRisk: 0, highValue: 0 })
const history = ref([])

const scenarios = [
  { id:'assistant',  name:'智能助手',      desc:'业务问题智能解答',     icon:'MagicStick' },
  { id:'customer',   name:'客户分析',      desc:'RFM分层 / 画像 / 流失', icon:'User' },
  { id:'sales',      name:'销售预测',      desc:'趋势 / 漏斗 / 排行',   icon:'TrendCharts' },
  { id:'product',    name:'商品分析',      desc:'热销 / 库存 / 转化',   icon:'Goods' },
  { id:'copy',       name:'文案生成',      desc:'营销话术一键产出',     icon:'Document' },
  { id:'workflow',   name:'工作流',        desc:'智能任务派发',         icon:'Promotion' },
]

const currentScenario = computed(() => scenarios.find(s => s.id === scenarioId.value) || scenarios[0])

const quickPrompts = [
  { label:'今日概览',  desc:'日程、待办、关键数据', text:'今日', icon:'DataAnalysis', color:'#3b82f6' },
  { label:'数据统计',  desc:'客户/订单/产品总数', text:'统计', icon:'Histogram', color:'#22c55e' },
  { label:'待办跟进',  desc:'高价值客户提醒', text:'跟进', icon:'Bell', color:'#f59e0b' },
  { label:'销售预测',  desc:'AI 趋势预估', text:'预测', icon:'TrendCharts', color:'#8b5cf6' },
  { label:'RFM分层',  desc:'客户价值分层', text:'rfm', icon:'PieChart', color:'#ec4899' },
  { label:'流失预警',  desc:'高风险客户', text:'流失', icon:'Warning', color:'#ef4444' },
  { label:'热销产品',  desc:'TOP商品分析', text:'产品', icon:'Goods', color:'#f59e0b' },
  { label:'生成文案',  desc:'营销话术', text:'生成一段618促销文案', icon:'Document', color:'#06b6d4' },
]

const recommends = [
  { title:'跟进昨日未联系客户', desc:'AI 已筛出 5 位高价值客户', cmd:'跟进', icon:'Bell', color:'#3b82f6' },
  { title:'发送618营销文案', desc:'为美妆类客户生成', cmd:'生成一段618美妆促销文案', icon:'Document', color:'#22c55e' },
  { title:'查看本月销售预测', desc:'基于历史数据 AI 预估', cmd:'预测', icon:'TrendCharts', color:'#8b5cf6' },
  { title:'分析流失客户原因', desc:'AI 给出挽留建议', cmd:'流失', icon:'Warning', color:'#ef4444' },
]

function newChat() {
  messages.value = []
  inputText.value = ''
}

function loadHistory(h) {
  messages.value = h.messages || []
  nextTick(scrollToBottom)
}

function scrollToBottom() {
  nextTick(() => {
    if (convRef.value) convRef.value.scrollTop = convRef.value.scrollHeight
  })
}

function nowTime() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

async function sendCommand(cmd) {
  inputText.value = cmd
  await sendMessage()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return
  messages.value.push({ role:'user', content:text, time: nowTime() })
  inputText.value = ''
  isTyping.value = true
  stats.todayQueries++
  scrollToBottom()
  try {
    const res = await request.post('/ai/agent/command', { command: text })
    if (res && res.intent) {
      messages.value.push({
        role:'assistant',
        time: nowTime(),
        content: { intent: res.intent, steps: res.steps||[], result: res.result||res.message||'' }
      })
    } else if (typeof res === 'string') {
      messages.value.push({ role:'assistant', content:res, time: nowTime() })
    } else {
      messages.value.push({ role:'assistant', content:res?.result||res?.message||JSON.stringify(res), time: nowTime() })
    }
    // save to history (only first user message)
    saveHistory(text)
  } catch (err) {
    messages.value.push({ role:'system', content:'抱歉，请求失败：' + (err?.message||'网络错误'), time: nowTime() })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

function saveHistory(firstText) {
  const t = firstText.substring(0, 20) + (firstText.length>20?'..':'')
  const existing = history.value.findIndex(h => h.title === t)
  if (existing >= 0) history.value.splice(existing, 1)
  history.value.unshift({ id: Date.now(), title: t, time: nowTime(), messages: [...messages.value] })
  if (history.value.length > 10) history.value = history.value.slice(0, 10)
}

function formatContent(s) {
  if (!s) return ''
  return String(s).replace(/\n/g, '<br>')
}

async function loadInsights() {
  try {
    const dashData = await request.get('/dashboard/stats')
    insight.highValue = dashData?.totalOpportunities || dashData?.active_opportunities || 0
    if (dashData) {
      stats.todayQueries = dashData.customers || dashData.totalCustomers || 0
      stats.accuracy = dashData.orders ? Math.min(100, Math.round(dashData.orders / (dashData.customers||1) * 100)) : 96
    }
  } catch {}
  try {
    const source = await request.get('/analytics/customer-source')
    insight.totalCustomers = source?.reduce((s,r)=>s+(r.count||r.value||0), 0) || 0
  } catch {}
  try {
    const rank = await request.get('/analytics/employee-ranking')
    if (rank && rank.length > 0) {
      insight.topAmount = rank[0].amount || rank[0].total_sales
      insight.topEmployee = rank[0].name || rank[0].real_name
    }
  } catch {}
}

onMounted(() => {
  loadInsights()
})
</script>

<style scoped>
.ai-page{display:grid;grid-template-columns:240px 1fr 280px;height:calc(100vh - 56px);background:#f8fafc;overflow:hidden}
.ai-page *{box-sizing:border-box}

/* === Side === */
.ai-side{background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column}
.ai-side-hd{padding:16px;border-bottom:1px solid #f1f5f9}
.ai-logo{display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;color:#0f172a;margin-bottom:12px}
.ai-logo-dot{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);position:relative}
.ai-logo-dot::after{content:'';position:absolute;inset:6px;background:#fff;border-radius:50%}
.new-chat-btn{width:100%;height:34px;display:flex;align-items:center;justify-content:center;gap:4px;border-radius:8px;background:#0f172a;color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s}
.new-chat-btn:hover{background:#1e293b}
.ai-side-body{padding:10px;overflow-y:auto;flex:1}
.ai-side-section{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;padding:8px 10px 6px}
.ai-scenario{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;color:#475569;margin-bottom:2px;transition:all .15s}
.ai-scenario:hover{background:#f1f5f9;color:#0f172a}
.ai-scenario.active{background:#eff6ff;color:#2563eb;font-weight:500}
.ai-scenario.active :deep(svg){color:#2563eb}
.ai-scenario-info{flex:1;min-width:0}
.ai-scenario-name{font-size:13px;font-weight:500}
.ai-scenario-desc{font-size:11px;color:#94a3b8;margin-top:1px}
.ai-scenario.active .ai-scenario-desc{color:#3b82f6}
.ai-history-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;cursor:pointer;font-size:12px;color:#64748b;transition:all .15s}
.ai-history-item:hover{background:#f8fafc;color:#0f172a}
.hi-title{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hi-time{font-size:10px;color:#cbd5e1;flex-shrink:0}
.ai-empty{padding:20px;text-align:center;font-size:12px;color:#cbd5e1}

/* === Main === */
.ai-main{display:flex;flex-direction:column;overflow:hidden}
.ai-main-hd{padding:18px 24px;border-bottom:1px solid #e2e8f0;background:#fff;display:flex;align-items:center;justify-content:space-between}
.ai-main-hd h2{font-size:18px;font-weight:600;color:#0f172a;margin:0 0 2px 0}
.ai-hd-sub{margin:0;font-size:12px;color:#64748b}
.ai-hd-stats{display:flex;gap:24px}
.ai-stat{text-align:right}
.ai-stat-num{display:block;font-size:20px;font-weight:700;color:#0f172a;font-family:var(--crm-font-mono)}
.ai-stat-label{font-size:11px;color:#94a3b8}

.ai-conversation{flex:1;overflow-y:auto;padding:20px 32px;background:linear-gradient(180deg,#f8fafc 0%,#fff 100%)}
.ai-welcome{max-width:780px;margin:30px auto;text-align:center}
.ai-welcome-icon{width:64px;height:64px;margin:0 auto 14px;border-radius:18px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(59,130,246,0.25)}
.ai-welcome h3{margin:0 0 6px 0;font-size:18px;color:#0f172a}
.ai-welcome-sub{margin:0 0 24px 0;color:#64748b;font-size:13px}
.ai-quick-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;text-align:left}
.ai-quick{display:flex;align-items:flex-start;gap:10px;padding:14px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;transition:all .15s}
.ai-quick:hover{border-color:#3b82f6;box-shadow:0 4px 12px rgba(59,130,246,0.1);transform:translateY(-1px)}
.ai-quick-label{font-size:13px;font-weight:600;color:#0f172a;margin-bottom:2px}
.ai-quick-desc{font-size:11.5px;color:#64748b}

/* Messages */
.msg-row{display:flex;gap:12px;margin-bottom:20px;max-width:780px;margin-left:auto;margin-right:auto}
.msg-row.user{flex-direction:row-reverse}
.msg-avatar{flex-shrink:0;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;background:#0f172a}
.msg-avatar.assistant{background:linear-gradient(135deg,#3b82f6,#8b5cf6)}
.msg-avatar.system{background:#ef4444}
.msg-card{flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;max-width:680px}
.msg-row.user .msg-card{background:#0f172a;color:#fff;border-color:#0f172a}
.msg-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:11px}
.msg-name{font-weight:600;color:#64748b}
.msg-time{color:#cbd5e1}
.msg-row.user .msg-name{color:rgba(255,255,255,0.6)}
.msg-text{font-size:13.5px;line-height:1.7;color:#1e293b;white-space:pre-wrap;word-break:break-word}
.msg-row.user .msg-text{color:#fff}
.msg-intent{margin-bottom:10px}
.msg-steps{margin-bottom:12px;padding:10px;background:#f8fafc;border-radius:8px;border-left:2px solid #3b82f6}
.step-row{display:flex;align-items:center;gap:8px;font-size:12px;color:#475569;padding:2px 0}
.step-num{width:18px;height:18px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0}
.msg-result{padding-top:6px}
.r-summary{font-size:13px;color:#475569;line-height:1.7;padding:8px 12px;background:#f0f9ff;border-radius:6px;border-left:2px solid #3b82f6;margin-bottom:8px}
.r-customers{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.r-cust{display:flex;align-items:center;gap:10px;padding:8px 10px;background:#f8fafc;border-radius:6px}
.r-cust-info{flex:1;min-width:0}
.r-cust-name{font-size:13px;font-weight:500;color:#0f172a}
.r-cust-meta{font-size:11px;color:#94a3b8;margin-top:1px}
.r-tiers{display:grid;gap:6px;margin-top:6px}
.r-tier{display:grid;grid-template-columns:90px 1fr auto;align-items:center;gap:10px;font-size:12px}
.r-tier-name{color:#475569;font-weight:500}
.r-tier-bar{height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
.r-tier-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:3px;transition:width .4s}
.r-tier-val{color:#0f172a;font-weight:600;font-family:var(--crm-font-mono);font-size:11px}
.r-suggestions{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.r-sug{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:12.5px;color:#92400e}
.r-products{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.r-prod{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f0fdf4;border-radius:6px;font-size:12.5px}
.r-prod-name{flex:1;color:#0f172a;font-weight:500}
.r-prod-price{color:#16a34a;font-weight:600;font-family:var(--crm-font-mono)}
.r-stats{display:grid;gap:4px;margin-top:6px}
.r-stat-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border-radius:6px;font-size:12.5px}
.r-stat-key{color:#64748b}
.r-stat-val{color:#0f172a;font-weight:600;font-family:var(--crm-font-mono)}

/* Typing */
.typing{display:flex;gap:4px;padding:8px 0}
.typing span{width:6px;height:6px;border-radius:50%;background:#cbd5e1;animation:typingBounce 1.4s infinite}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}
@keyframes typingBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}

/* Quick row */
.ai-quick-row{padding:10px 24px;background:#fff;border-top:1px solid #f1f5f9;display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0}
.ai-quick-pill{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 10px;background:#f1f5f9;border-radius:13px;font-size:12px;color:#475569;cursor:pointer;transition:all .15s}
.ai-quick-pill:hover{background:#e0e7ff;color:#3b82f6}

/* Input */
.ai-input-wrap{padding:14px 24px 18px;background:#fff;flex-shrink:0}
.ai-input-box{display:flex;align-items:flex-end;gap:8px;padding:8px 8px 8px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;transition:border-color .15s}
.ai-input-box:focus-within{border-color:#3b82f6;background:#fff}
.ai-input-box textarea{flex:1;border:none;background:transparent;resize:none;outline:none;font-size:13.5px;line-height:1.6;font-family:inherit;color:#0f172a;min-height:36px;max-height:140px;padding:8px 0}
.ai-send{display:inline-flex;align-items:center;gap:4px;height:36px;padding:0 14px;border-radius:8px;background:#0f172a;color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s;flex-shrink:0}
.ai-send:hover:not(:disabled){background:#1e293b}
.ai-send:disabled{background:#cbd5e1;cursor:not-allowed}
.ai-input-tip{font-size:11px;color:#94a3b8;margin-top:6px;text-align:center}

/* === Right Insight === */
.ai-insight{background:#fff;border-left:1px solid #e2e8f0;overflow-y:auto}
.insight-hd{padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
.insight-hd h4{font-size:13px;font-weight:600;color:#0f172a;margin:0}
.insight-body{padding:14px 18px;display:flex;flex-direction:column;gap:10px}
.insight-card{display:flex;align-items:center;gap:12px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9}
.ic-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ic-info{flex:1;min-width:0}
.ic-title{font-size:11.5px;color:#64748b;margin-bottom:2px}
.ic-num{font-size:20px;font-weight:700;color:#0f172a;font-family:var(--crm-font-mono);line-height:1.2}
.ic-unit{font-size:12px;font-weight:400;color:#64748b;margin-left:1px}
.ic-trend{font-size:11px;font-weight:500}
.ic-trend.up{color:#16a34a}
.ic-trend.down{color:#dc2626}

.recommend-list{display:flex;flex-direction:column;gap:8px}
.rec-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;transition:all .15s}
.rec-item:hover{border-color:#3b82f6;box-shadow:0 2px 6px rgba(59,130,246,0.08)}
.rec-item>div{flex:1;min-width:0}
.rec-title{font-size:12.5px;font-weight:500;color:#0f172a;margin-bottom:2px}
.rec-desc{font-size:11px;color:#94a3b8}
.rec-btn{padding:3px 10px;border:1px solid #e2e8f0;background:#fff;border-radius:6px;font-size:11px;color:#475569;cursor:pointer;transition:all .15s;flex-shrink:0}
.rec-btn:hover{background:#3b82f6;color:#fff;border-color:#3b82f6}

.text-muted{color:#94a3b8}
.text-sm{font-size:11px}

@media(max-width:1200px){.ai-page{grid-template-columns:200px 1fr 240px}}
@media(max-width:1024px){.ai-insight{display:none}.ai-page{grid-template-columns:200px 1fr}}
</style>
