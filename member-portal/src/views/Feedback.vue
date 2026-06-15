<template>
  <div class="feedback-page">
    <h2>💬 意见反馈</h2>
    <p class="subtitle">你的每一条建议都是我们进步的动力</p>

    <!-- 提交区 -->
    <el-card class="fb-form-card" shadow="never">
      <el-form label-width="80px">
        <el-form-item label="反馈类型">
          <el-radio-group v-model="form.type">
            <el-radio-button value="建议">💡 建议</el-radio-button>
            <el-radio-button value="问题">🐛 问题反馈</el-radio-button>
            <el-radio-button value="投诉">⚠️ 投诉</el-radio-button>
            <el-radio-button value="其他">📝 其他</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="反馈内容">
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请详细描述你的问题或建议..." maxlength="500" show-word-limit/>
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.contact" placeholder="手机号或微信号（选填，方便我们联系你）" style="max-width:300px"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" @click="submitFeedback" :loading="submitting">提交反馈</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 历史反馈 -->
    <h3 style="margin-top:28px">📋 我的反馈记录</h3>
    <div v-if="feedbacks.length">
      <div v-for="f in feedbacks" :key="f.id" class="fb-item">
        <div class="fb-header">
          <el-tag size="small" :type="f.type==='投诉'?'danger':f.type==='问题'?'warning':'info'">{{ f.type }}</el-tag>
          <span class="fb-time">{{ f.created_at }}</span>
          <el-tag size="small" :type="f.status==='已回复'?'success':f.status==='处理中'?'warning':'info'">{{ f.status }}</el-tag>
        </div>
        <div class="fb-content">{{ f.content }}</div>
        <div v-if="f.reply" class="fb-reply">
          <div class="reply-label">商家回复：</div>
          <div>{{ f.reply }}</div>
          <div class="reply-time">{{ f.replied_at }}</div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">还没有提交过反馈，欢迎给我们提建议~</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const form = reactive({ type: '建议', content: '', contact: '' })
const feedbacks = ref([])
const submitting = ref(false)

onMounted(async () => {
  try { feedbacks.value = await request.get('/feedback/my') } catch {}
})

async function submitFeedback() {
  if (!form.content.trim()) return ElMessage.warning('请输入反馈内容')
  submitting.value = true
  try {
    await request.post('/feedback', { type: form.type, content: form.content, contact: form.contact })
    ElMessage.success('反馈提交成功！')
    form.content = ''; form.contact = ''
    feedbacks.value = await request.get('/feedback/my')
  } catch { ElMessage.error('提交失败，请稍后重试') }
  finally { submitting.value = false }
}
</script>

<style scoped>
.feedback-page { max-width: 700px; }
.subtitle { color: #B2BEC3; margin-bottom: 20px; }
.fb-form-card { border-radius: 14px; }
.fb-item { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 10px; }
.fb-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.fb-time { font-size: 12px; color: #B2BEC3; flex: 1; }
.fb-content { color: #2D3436; line-height: 1.6; margin-bottom: 10px; }
.fb-reply { background: #F0FDF4; border-radius: 10px; padding: 12px; margin-top: 8px; }
.reply-label { font-size: 12px; color: #10B981; margin-bottom: 4px; }
.reply-time { font-size: 11px; color: #B2BEC3; margin-top: 6px; }
.empty-state { text-align: center; padding: 40px; color: #B2BEC3; }
</style>
