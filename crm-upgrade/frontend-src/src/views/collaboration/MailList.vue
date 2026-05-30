<template>
  <div class="mail-list">
    <div class="page-header">
      <h2>站内信</h2>
      <el-button type="primary" @click="openCompose">
        <el-icon><Edit /></el-icon> 写邮件
      </el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="收件箱" name="inbox">
        <el-table :data="inboxList" v-loading="inboxLoading" stripe @row-click="openDetail" style="cursor:pointer">
          <el-table-column width="50">
            <template #default="{ row }">
              <el-icon :size="18" @click.stop="toggleStar(row)">
                <StarFilled v-if="row.isStarred" style="color:#f39c12" />
                <Star v-else style="color:#c0c4cc" />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column width="50">
            <template #default="{ row }">
              <el-badge :is-dot="!row.isRead" class="unread-dot" />
            </template>
          </el-table-column>
          <el-table-column prop="senderName" label="发件人" width="120" />
          <el-table-column prop="title" label="主题" min-width="200">
            <template #default="{ row }">
              <span :style="{ fontWeight: row.isRead ? 'normal' : 'bold' }">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="内容" min-width="300">
            <template #default="{ row }">
              <span class="content-preview">{{ truncateContent(row.content) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="170" />
        </el-table>
        <el-pagination
          v-model:current-page="inboxPage"
          :page-size="inboxPageSize"
          :total="inboxTotal"
          layout="total, prev, pager, next"
          @current-change="fetchInbox"
          style="margin-top:16px;justify-content:flex-end"
        />
      </el-tab-pane>

      <el-tab-pane label="已发送" name="sent">
        <el-table :data="sentList" v-loading="sentLoading" stripe @row-click="openDetail">
          <el-table-column prop="receiverName" label="收件人" width="120" />
          <el-table-column prop="title" label="主题" min-width="200" />
          <el-table-column label="内容" min-width="300">
            <template #default="{ row }">
              <span class="content-preview">{{ truncateContent(row.content) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="170" />
        </el-table>
        <el-pagination
          v-model:current-page="sentPage"
          :page-size="sentPageSize"
          :total="sentTotal"
          layout="total, prev, pager, next"
          @current-change="fetchSent"
          style="margin-top:16px;justify-content:flex-end"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Compose Dialog -->
    <el-dialog v-model="composeVisible" title="写邮件" width="600px" :close-on-click-modal="false">
      <el-form :model="composeForm" label-width="80px">
        <el-form-item label="收件人">
          <el-select v-model="composeForm.receiverId" filterable placeholder="选择收件人" style="width:100%">
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="主题">
          <el-input v-model="composeForm.title" placeholder="请输入邮件主题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="composeForm.content" type="textarea" :rows="6" placeholder="请输入邮件内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="composeVisible = false">取消</el-button>
        <el-button type="primary" @click="sendMail" :loading="sending">发送</el-button>
      </template>
    </el-dialog>

    <!-- Reply Dialog -->
    <el-dialog v-model="replyVisible" title="回复邮件" width="600px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="收件人">
          <el-input :model-value="replyTarget?.senderName" disabled />
        </el-form-item>
        <el-form-item label="主题">
          <el-input :model-value="'Re: ' + replyTarget?.title" disabled />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="replyContent" type="textarea" :rows="6" placeholder="请输入回复内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="sendReply" :loading="replying">发送</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="邮件详情" width="640px">
      <template v-if="currentMail">
        <div class="mail-detail">
          <div class="detail-header">
            <div class="detail-subject">{{ currentMail.title }}</div>
            <div class="detail-meta">
              <span>发件人: {{ currentMail.senderName || currentMail.receiverName }}</span>
              <span>时间: {{ currentMail.createdAt }}</span>
            </div>
          </div>
          <el-divider />
          <div class="detail-body">{{ currentMail.content }}</div>
          <div v-if="activeTab === 'inbox'" class="detail-actions">
            <el-button type="primary" @click="openReply(currentMail)">回复</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Star, StarFilled } from '@element-plus/icons-vue'
import { mailApi, customerApi } from '@/api/index'

const activeTab = ref('inbox')

// Inbox
const inboxList = ref([])
const inboxLoading = ref(false)
const inboxPage = ref(1)
const inboxPageSize = ref(20)
const inboxTotal = ref(0)

// Sent
const sentList = ref([])
const sentLoading = ref(false)
const sentPage = ref(1)
const sentPageSize = ref(20)
const sentTotal = ref(0)

// Compose
const composeVisible = ref(false)
const composeForm = ref({ receiverId: '', title: '', content: '' })
const sending = ref(false)
const userOptions = ref([])

// Reply
const replyVisible = ref(false)
const replyTarget = ref(null)
const replyContent = ref('')
const replying = ref(false)

// Detail
const detailVisible = ref(false)
const currentMail = ref(null)

function truncateContent(content) {
  if (!content) return ''
  return content.length > 50 ? content.substring(0, 50) + '...' : content
}

async function fetchInbox() {
  inboxLoading.value = true
  try {
    const res = await mailApi.inbox({ page: inboxPage.value, pageSize: inboxPageSize.value })
    inboxList.value = res.data?.records || res.data?.list || []
    inboxTotal.value = res.data?.total || 0
  } catch {
    ElMessage.error('加载收件箱失败')
  } finally {
    inboxLoading.value = false
  }
}

async function fetchSent() {
  sentLoading.value = true
  try {
    const res = await mailApi.sent({ page: sentPage.value, pageSize: sentPageSize.value })
    sentList.value = res.data?.records || res.data?.list || []
    sentTotal.value = res.data?.total || 0
  } catch {
    ElMessage.error('加载已发送失败')
  } finally {
    sentLoading.value = false
  }
}

function handleTabChange() {
  if (activeTab.value === 'inbox') fetchInbox()
  else fetchSent()
}

function openDetail(row) {
  currentMail.value = row
  detailVisible.value = true
  if (!row.isRead) {
    mailApi.markRead(row.id).then(() => {
      row.isRead = true
    }).catch(() => {})
  }
}

function openCompose() {
  composeForm.value = { receiverId: '', title: '', content: '' }
  composeVisible.value = true
  loadUsers()
}

function openReply(mail) {
  replyTarget.value = mail
  replyContent.value = ''
  replyVisible.value = true
}

async function loadUsers() {
  try {
    const res = await customerApi.list({ pageSize: 999 })
    userOptions.value = res.data?.records || res.data?.list || []
  } catch {
    // ignore
  }
}

async function sendMail() {
  if (!composeForm.value.receiverId) {
    ElMessage.warning('请选择收件人')
    return
  }
  sending.value = true
  try {
    await mailApi.send(composeForm.value)
    ElMessage.success('发送成功')
    composeVisible.value = false
    if (activeTab.value === 'sent') fetchSent()
  } catch {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

async function sendReply() {
  replying.value = true
  try {
    await mailApi.reply(replyTarget.value.id, { content: replyContent.value })
    ElMessage.success('回复成功')
    replyVisible.value = false
    detailVisible.value = false
    fetchInbox()
  } catch {
    ElMessage.error('回复失败')
  } finally {
    replying.value = false
  }
}

async function toggleStar(row) {
  try {
    await mailApi.toggleStar(row.id)
    row.isStarred = !row.isStarred
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchInbox()
})
</script>

<style scoped>
.mail-list {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.content-preview {
  color: #909399;
  font-size: 13px;
}

.unread-dot {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mail-detail {
  padding: 0;
}

.detail-header {
  margin-bottom: 8px;
}

.detail-subject {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.detail-meta {
  display: flex;
  gap: 24px;
  color: #909399;
  font-size: 13px;
}

.detail-body {
  color: #303133;
  line-height: 1.8;
  white-space: pre-wrap;
  min-height: 100px;
  padding: 8px 0;
}

.detail-actions {
  margin-top: 20px;
  text-align: right;
}
</style>
