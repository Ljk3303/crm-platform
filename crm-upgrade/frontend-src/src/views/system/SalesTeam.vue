<template>
  <div class="sales-team">
    <div class="page-header">
      <h2>销售团队</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新建团队
      </el-button>
    </div>

    <el-table :data="teamList" v-loading="loading" stripe>
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-content">
            <div class="expand-header">
              <span class="expand-title">团队成员</span>
              <el-button type="primary" size="small" @click="openAddMember(row)">
                <el-icon><Plus /></el-icon> 添加成员
              </el-button>
            </div>
            <el-table :data="row.members || []" size="small" border>
              <el-table-column prop="userName" label="姓名" width="120" />
              <el-table-column prop="loginName" label="账号" width="140" />
              <el-table-column label="角色" width="120">
                <template #default="{ row: member }">
                  <el-tag :type="member.isLeader ? 'warning' : 'info'" size="small">
                    {{ member.isLeader ? '组长' : (member.role || '成员') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="phone" label="手机" width="140" />
              <el-table-column label="加入时间" width="170">
                <template #default="{ row: member }">
                  {{ member.joinedAt || member.createdAt }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row: member }">
                  <el-popconfirm
                    title="确定移除此成员?"
                    @confirm="handleRemoveMember(row, member)"
                  >
                    <template #reference>
                      <el-button type="danger" link size="small">移除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!row.members || row.members.length === 0" description="暂无成员" :image-size="60" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="团队名称" min-width="180" />
      <el-table-column prop="leaderName" label="组长" width="120" />
      <el-table-column label="成员数" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="primary" effect="plain" round>
            {{ row.memberCount || (row.members?.length || 0) }} 人
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" width="170" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button type="primary" link size="small" @click="openAddMember(row)">成员</el-button>
          <el-popconfirm title="确定删除该团队?" @confirm="handleDelete(row)">
            <template #reference>
              <el-button type="danger" link size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="fetchTeams"
      style="margin-top:16px;justify-content:flex-end"
    />

    <!-- Create/Edit Team Dialog -->
    <el-dialog
      v-model="teamDialogVisible"
      :title="editingTeam ? '编辑团队' : '新建团队'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="teamForm" label-width="80px">
        <el-form-item label="团队名称" required>
          <el-input v-model="teamForm.name" placeholder="请输入团队名称" />
        </el-form-item>
        <el-form-item label="组长" required>
          <el-select v-model="teamForm.leaderId" filterable placeholder="选择组长" style="width:100%">
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.name || user.loginName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="teamForm.description" type="textarea" :rows="3" placeholder="团队描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="teamForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTeam" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- Add Member Dialog -->
    <el-dialog
      v-model="memberDialogVisible"
      :title="'添加成员 - ' + currentTeam?.name"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="选择成员">
          <el-select
            v-model="selectedMemberId"
            filterable
            placeholder="请选择要添加的成员"
            style="width:100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.name || user.loginName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="selectedMemberRole" placeholder="请选择角色" style="width:100%">
            <el-option label="组长" value="leader" />
            <el-option label="销售" value="sales" />
            <el-option label="助理" value="assistant" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addMember" :loading="addingMember">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { teamApi, customerApi } from '@/api/index'

const teamList = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const saving = ref(false)

// Team dialog
const teamDialogVisible = ref(false)
const editingTeam = ref(null)
const teamForm = ref({ name: '', leaderId: '', description: '', status: 1 })

// Member dialog
const memberDialogVisible = ref(false)
const currentTeam = ref(null)
const selectedMemberId = ref('')
const selectedMemberRole = ref('sales')
const addingMember = ref(false)

const userOptions = ref([])

async function fetchTeams() {
  loading.value = true
  try {
    const res = await teamApi.list()
    const data = res.data?.records || res.data?.list || res.data || []
    // Fetch members for each team
    const teamsWithMembers = await Promise.all(
      data.map(async team => {
        try {
          const memRes = await teamApi.getById(team.id)
          return {
            ...team,
            members: memRes.data?.members || memRes.data?.records || []
          }
        } catch {
          return { ...team, members: [] }
        }
      })
    )
    teamList.value = teamsWithMembers
    total.value = teamsWithMembers.length
  } catch {
    ElMessage.error('加载团队列表失败')
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  try {
    const res = await customerApi.list({ pageSize: 999 })
    userOptions.value = res.data?.records || res.data?.list || []
  } catch {
    // ignore
  }
}

function openCreateDialog() {
  editingTeam.value = null
  teamForm.value = { name: '', leaderId: '', description: '', status: 1 }
  teamDialogVisible.value = true
}

function openEditDialog(row) {
  editingTeam.value = row
  teamForm.value = {
    name: row.name,
    leaderId: row.leaderId,
    description: row.description || '',
    status: row.status
  }
  teamDialogVisible.value = true
}

async function saveTeam() {
  if (!teamForm.value.name) {
    ElMessage.warning('请输入团队名称')
    return
  }
  saving.value = true
  try {
    if (editingTeam.value) {
      await teamApi.update({ id: editingTeam.value.id, ...teamForm.value })
      ElMessage.success('更新成功')
    } else {
      await teamApi.create(teamForm.value)
      ElMessage.success('创建成功')
    }
    teamDialogVisible.value = false
    fetchTeams()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await teamApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchTeams()
  } catch {
    ElMessage.error('删除失败')
  }
}

function openAddMember(row) {
  currentTeam.value = row
  selectedMemberId.value = ''
  selectedMemberRole.value = 'sales'
  memberDialogVisible.value = true
}

async function addMember() {
  if (!selectedMemberId.value) {
    ElMessage.warning('请选择成员')
    return
  }
  addingMember.value = true
  try {
    await teamApi.addMember(currentTeam.value.id, {
      userId: selectedMemberId.value,
      role: selectedMemberRole.value
    })
    ElMessage.success('添加成功')
    memberDialogVisible.value = false
    fetchTeams()
  } catch {
    ElMessage.error('添加失败')
  } finally {
    addingMember.value = false
  }
}

async function handleRemoveMember(team, member) {
  try {
    await teamApi.removeMember(team.id, member.userId)
    ElMessage.success('移除成功')
    fetchTeams()
  } catch {
    ElMessage.error('移除失败')
  }
}

onMounted(() => {
  fetchTeams()
  loadUsers()
})
</script>

<style scoped>
.sales-team {
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

.expand-content {
  padding: 16px 40px;
  background: #fafafa;
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.expand-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
