<template>
  <div class="feedback-mgr">
    <h2>💬 用户反馈管理</h2>
    <div class="stats-row">
      <div class="stat-card" :class="{active:filter===''}"><div class="stat-val">{{ feedbacks.length }}</div><div class="stat-label">全部</div></div>
      <div class="stat-card" :class="{active:filter==='未处理'}"><div class="stat-val">{{ feedbacks.filter(f=>f.status==='未处理').length }}</div><div class="stat-label">待处理</div></div>
      <div class="stat-card" :class="{active:filter==='处理中'}"><div class="stat-val">{{ feedbacks.filter(f=>f.status==='处理中').length }}</div><div class="stat-label">处理中</div></div>
      <div class="stat-card" :class="{active:filter==='已回复'}"><div class="stat-val">{{ feedbacks.filter(f=>f.status==='已回复').length }}</div><div class="stat-label">已回复</div></div>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="filter" size="small">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="未处理">未处理</el-radio-button>
        <el-radio-button value="处理中">处理中</el-radio-button>
        <el-radio-button value="已回复">已回复</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="filteredList.length">
      <div v-for="f in filteredList" :key="f.id" class="fb-card">
        <div class="fb-top">
          <el-tag size="small" :type="f.type==='投诉'?'danger':f.type==='问题'?'warning':'info'">{{ f.type }}</el-tag>
          <span class="fb-user">{{ f.user_name || '匿名用户' }}</span>
          <span class="fb-time">{{ f.created_at }}</span>
          <span v-if="f.contact" class="fb-contact">📞 {{ f.contact }}</span>
        </div>
        <div class="fb-body">{{ f.content }}</div>
        <div class="fb-actions">
          <el-button v-if="f.status==='未处理'" size="small" type="warning" @click="setStatus(f, '处理中')">标记处理中</el-button>
          <el-button size="small" type="primary" @click="openReply(f)">{{ f.status==='已回复' ? '查看/编辑回复' : '回复' }}</el-button>
        </div>
        <div v-if="f.reply" class="fb-reply">
          <b>回复：</b>{{ f.reply }}<span class="reply-at">{{ f.replied_at }}</span>
        </div>
      </div>
    </div>
    <div v-else class="empty">暂无反馈数据</div>

    <el-dialog v-model="showReply" title="回复反馈" width="480px">
      <el-input v-model="replyText" type="textarea" :rows="4" placeholder="输入回复内容..."/>
      <template #footer>
        <el-button @click="showReply=false">取消</el-button>
        <el-button type="primary" @click="doReply">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const feedbacks = ref([])
const filter = ref('未处理')
const showReply = ref(false)
const replyText = ref('')
const currentFb = ref(null)

const filteredList = computed(() => filter.value ? feedbacks.value.filter(f => f.status === filter.value) : feedbacks.value)

onMounted(async () => {
  try { feedbacks.value = await request.get('/admin/feedbacks') } catch {}
})

async function setStatus(f, status) {
  try {
    await request.put(`/admin/feedbacks/${f.id}/status`, { status })
    f.status = status
    ElMessage.success('状态已更新')
  } catch { ElMessage.error('更新失败') }
}

function openReply(f) {
  currentFb.value = f
  replyText.value = f.reply || ''
  showReply.value = true
}

async function doReply() {
  if (!replyText.value.trim()) return ElMessage.warning('请输入回复内容')
  try {
    await request.put(`/admin/feedbacks/${currentFb.value.id}/reply`, { reply: replyText.value })
    currentFb.value.reply = replyText.value
    currentFb.value.status = '已回复'
    currentFb.value.replied_at = new Date().toISOString()
    showReply.value = false
    ElMessage.success('回复成功')
  } catch { ElMessage.error('回复失败') }
}
</script>

<style scoped>
.feedback-mgr { padding: 0; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #fff; border-radius: 12px; padding: 14px; text-align: center; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.06); transition: all .2s; }
.stat-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.1); }
.stat-card.active { border: 2px solid #2563EB; background: #EFF6FF; }
.stat-val { font-size: 22px; font-weight: 700; color: #2563EB; }
.stat-label { font-size: 12px; color: #64748B; margin-top: 2px; }
.filter-bar { margin-bottom: 14px; }
.fb-card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.fb-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.fb-user { font-weight: 600; color: #1E293B; }
.fb-time { font-size: 12px; color: #94A3B8; flex: 1; text-align: right; }
.fb-contact { font-size: 12px; color: #64748B; }
.fb-body { line-height: 1.7; color: #334155; margin-bottom: 12px; }
.fb-actions { display: flex; gap: 8px; }
.fb-reply { background: #F0FDF4; border-radius: 10px; padding: 12px; margin-top: 10px; color: #065F46; }
.reply-at { font-size: 11px; color: #64748B; margin-left: 12px; }
.empty { text-align: center; padding: 60px; color: #B2BEC3; }
</style>
