<template>
  <div class="opportunity-detail">
    <div class="page-header">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <el-tag :type="stageTagType(detail.stage)" size="large" v-if="detail.stage">
        {{ detail.stage }}
      </el-tag>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- Overview Tab -->
      <el-tab-pane label="概览" name="overview">
        <el-card shadow="never">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商机名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">
              <el-link type="primary">{{ detail.customer_name }}</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="预计金额">
              <span class="amount">{{ formatMoney(detail.amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="赢单概率">{{ detail.probability }}%</el-descriptions-item>
            <el-descriptions-item label="预计成交日期">{{ detail.expected_close_date }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ detail.owner_name }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detail.created_at }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ detail.updated_at }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ detail.description || '暂无描述' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- Stage Progression Steps -->
        <el-card shadow="never" class="mt-16">
          <template #header><span class="card-title">阶段推进</span></template>
          <el-steps :active="stageOrder" finish-status="success" align-center>
            <el-step
              v-for="(s, idx) in stages"
              :key="s"
              :title="s"
              :status="getStepStatus(idx)"
            />
          </el-steps>
        </el-card>
      </el-tab-pane>

      <!-- Stage History Tab -->
      <el-tab-pane label="阶段历史" name="stageHistory">
        <el-card shadow="never">
          <el-timeline v-if="stageHistory.length > 0">
            <el-timeline-item
              v-for="item in stageHistory"
              :key="item.id"
              :timestamp="item.created_at"
              placement="top"
            >
              <el-card shadow="hover" class="history-card">
                <div class="history-header">
                  <el-tag :type="stageTagType(item.from_stage)" size="small">{{ item.from_stage || '初始' }}</el-tag>
                  <el-icon><ArrowRight /></el-icon>
                  <el-tag :type="stageTagType(item.to_stage)" size="small">{{ item.to_stage }}</el-tag>
                </div>
                <div class="history-by">{{ item.created_by_name }}</div>
                <div v-if="item.remark" class="history-remark">{{ item.remark }}</div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无阶段变更记录" />
        </el-card>
      </el-tab-pane>

      <!-- Team Tab -->
      <el-tab-pane label="团队" name="team">
        <el-card shadow="never">
          <div class="team-toolbar">
            <span>团队成员</span>
            <el-button type="primary" size="small" @click="openAddMemberDialog">添加成员</el-button>
          </div>
          <el-table :data="teamMembers" stripe border>
            <el-table-column prop="user_name" label="成员" min-width="120" />
            <el-table-column prop="role" label="角色" min-width="120" />
            <el-table-column prop="joined_at" label="加入时间" min-width="160" />
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="{ row }">
                <el-popconfirm title="确认移除该成员？" @confirm="removeMember(row)">
                  <template #reference>
                    <el-button size="small" type="danger">移除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <el-dialog v-model="addMemberVisible" title="添加成员" width="400px">
            <el-form label-width="80px">
              <el-form-item label="成员">
                <el-select v-model="addMemberForm.user_id" placeholder="选择成员" filterable style="width: 100%">
                  <el-option
                    v-for="u in userList"
                    :key="u.id"
                    :label="u.name"
                    :value="u.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="角色">
                <el-select v-model="addMemberForm.role" placeholder="选择角色" style="width: 100%">
                  <el-option label="销售负责人" value="销售负责人" />
                  <el-option label="技术支持" value="技术支持" />
                  <el-option label="售前顾问" value="售前顾问" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="addMemberVisible = false">取消</el-button>
              <el-button type="primary" @click="handleAddMember">确定</el-button>
            </template>
          </el-dialog>
        </el-card>
      </el-tab-pane>

      <!-- Competitors Tab -->
      <el-tab-pane label="竞争对手" name="competitors">
        <el-card shadow="never">
          <div class="team-toolbar">
            <span>竞争对手分析</span>
            <el-button type="primary" size="small" @click="addCompetitorVisible = true">添加竞争对手</el-button>
          </div>
          <el-table :data="competitors" stripe border>
            <el-table-column prop="name" label="竞争对手名称" min-width="140" />
            <el-table-column prop="strengths" label="优势" min-width="200" show-overflow-tooltip />
            <el-table-column prop="weaknesses" label="劣势" min-width="200" show-overflow-tooltip />
            <el-table-column prop="our_advantage" label="我方优势" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="{ row }">
                <el-popconfirm title="确认删除？" @confirm="removeCompetitor(row)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <el-dialog v-model="addCompetitorVisible" title="添加竞争对手" width="520px">
            <el-form ref="competitorFormRef" :model="competitorForm" label-width="100px">
              <el-form-item label="名称" prop="name">
                <el-input v-model="competitorForm.name" placeholder="竞争对手名称" />
              </el-form-item>
              <el-form-item label="优势">
                <el-input v-model="competitorForm.strengths" type="textarea" :rows="2" placeholder="竞争对手优势" />
              </el-form-item>
              <el-form-item label="劣势">
                <el-input v-model="competitorForm.weaknesses" type="textarea" :rows="2" placeholder="竞争对手劣势" />
              </el-form-item>
              <el-form-item label="我方优势" prop="our_advantage">
                <el-input v-model="competitorForm.our_advantage" type="textarea" :rows="3" placeholder="相较于竞争对手，我方的优势" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="addCompetitorVisible = false">取消</el-button>
              <el-button type="primary" @click="handleAddCompetitor">确定</el-button>
            </template>
          </el-dialog>
        </el-card>
      </el-tab-pane>

      <!-- AI Sales Script Tab -->
      <el-tab-pane label="AI话术" name="aiScript">
        <el-card shadow="never">
          <div class="team-toolbar">
            <span>AI智能话术生成</span>
            <el-button type="primary" size="small" @click="fetchAIScript" :loading="aiLoading">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
          <div v-if="aiScripts.length === 0 && !aiLoading" class="ai-empty">
            <el-empty description="点击刷新获取AI话术建议" />
          </div>
          <el-row :gutter="16">
            <el-col :span="8" v-for="(script, idx) in aiScripts" :key="idx">
              <el-card shadow="hover" class="ai-card">
                <template #header>
                  <div class="ai-card-header">
                    <el-tag :type="stageTagType(script.stage)" size="small">{{ script.stage }}</el-tag>
                    <span class="ai-score">匹配度: {{ script.score }}%</span>
                  </div>
                </template>
                <div class="ai-content">{{ script.content }}</div>
                <div v-if="script.key_points" class="ai-keypoints">
                  <el-text type="info" size="small">要点：{{ script.key_points }}</el-text>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Refresh } from '@element-plus/icons-vue'
import { opportunityApi, userApi } from '@/api/index'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const activeTab = ref('overview')

const stages = ['初步接触', '需求分析', '方案报价', '谈判', '赢单', '输单']

const detail = reactive({
  name: '', customer_name: '', amount: 0, probability: 0,
  expected_close_date: '', owner_name: '', stage: '',
  created_at: '', updated_at: '', description: ''
})

const stageHistory = ref([])
const teamMembers = ref([])
const competitors = ref([])
const userList = ref([])
const aiScripts = ref([])
const aiLoading = ref(false)

const addMemberVisible = ref(false)
const addMemberForm = reactive({ user_id: null, role: '其他' })

const addCompetitorVisible = ref(false)
const competitorFormRef = ref(null)
const competitorForm = reactive({ name: '', strengths: '', weaknesses: '', our_advantage: '' })

const stageOrder = computed(() => {
  const idx = stages.indexOf(detail.stage)
  return idx >= 0 ? idx : 0
})

const goBack = () => router.back()

const stageTagType = (stage) => {
  const map = {
    '初步接触': '', '需求分析': 'warning', '方案报价': 'warning',
    '谈判': 'primary', '赢单': 'success', '输单': 'danger'
  }
  return map[stage] || ''
}

const getStepStatus = (idx) => {
  const current = stageOrder.value
  if (idx < current) return 'success'
  if (idx === current) return 'process'
  return 'wait'
}

const formatMoney = (val) => {
  if (val == null) return '-'
  return '¥' + Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fetchDetail = async () => {
  try {
    const res = await opportunityApi.detail(id)
    Object.assign(detail, res || null)
  } catch (e) {
    ElMessage.error('获取商机详情失败')
  }
}

const fetchStageHistory = async () => {
  try {
    const res = await opportunityApi.stageHistory(id)
    stageHistory.value = res.records || res || []
  } catch (e) { /* ignore */ }
}

const fetchTeamMembers = async () => {
  try {
    const res = await opportunityApi.teamMembers(id)
    teamMembers.value = res.records || res || []
  } catch (e) { /* ignore */ }
}

const fetchCompetitors = async () => {
  try {
    const res = await opportunityApi.competitors(id)
    competitors.value = res.records || res || []
  } catch (e) { /* ignore */ }
}

const fetchUsers = async () => {
  try {
    const res = await userApi.list()
    userList.value = res || []
  } catch (e) { /* ignore */ }
}

const fetchAIScript = async () => {
  aiLoading.value = true
  try {
    const res = await opportunityApi.aiScript(id)
    aiScripts.value = res.records || res || []
    ElMessage.success('AI话术已刷新')
  } catch (e) {
    ElMessage.error('获取AI话术失败')
  } finally {
    aiLoading.value = false
  }
}

// Team
const openAddMemberDialog = () => {
  addMemberForm.user_id = null
  addMemberForm.role = '其他'
  addMemberVisible.value = true
}

const handleAddMember = async () => {
  if (!addMemberForm.user_id) { ElMessage.warning('请选择成员'); return }
  try {
    await opportunityApi.addTeamMember(id, addMemberForm)
    ElMessage.success('成员已添加')
    addMemberVisible.value = false
    fetchTeamMembers()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

const removeMember = async (row) => {
  try {
    await opportunityApi.removeTeamMember(id, row.user_id)
    ElMessage.success('成员已移除')
    fetchTeamMembers()
  } catch (e) {
    ElMessage.error('移除失败')
  }
}

// Competitors
const handleAddCompetitor = async () => {
  if (!competitorForm.name) { ElMessage.warning('请输入竞争对手名称'); return }
  try {
    await opportunityApi.addCompetitor(id, competitorForm)
    ElMessage.success('竞争对手已添加')
    addCompetitorVisible.value = false
    Object.assign(competitorForm, { name: '', strengths: '', weaknesses: '', our_advantage: '' })
    fetchCompetitors()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

const removeCompetitor = async (row) => {
  try {
    await opportunityApi.removeCompetitor(id, row.id)
    ElMessage.success('已删除')
    fetchCompetitors()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchDetail()
  fetchStageHistory()
  fetchTeamMembers()
  fetchCompetitors()
  fetchUsers()
  fetchAIScript()
})
</script>

<style scoped>
.opportunity-detail { padding: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.card-title { font-size: 16px; font-weight: 600; }
.amount { font-weight: 600; color: #e6a23c; font-size: 16px; }

.history-card { max-width: 500px; }
.history-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.history-by { font-size: 13px; color: #909399; }
.history-remark { margin-top: 6px; color: #606266; }

.team-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 15px; font-weight: 500; }

.ai-empty { padding: 40px 0; }
.ai-card { min-height: 200px; margin-bottom: 16px; }
.ai-card-header { display: flex; justify-content: space-between; align-items: center; }
.ai-score { font-size: 12px; color: #67c23a; }
.ai-content { line-height: 1.7; white-space: pre-wrap; font-size: 14px; }
.ai-keypoints { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e4e7ed; }
</style>
