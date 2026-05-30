<template>
  <div class="system-config">
    <div class="page-header">
      <h2>系统配置</h2>
    </div>

    <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
      <el-tab-pane
        v-for="cat in categories"
        :key="cat.value"
        :label="cat.label"
        :name="cat.value"
      />
    </el-tabs>

    <el-table :data="configList" v-loading="loading" border stripe>
      <el-table-column prop="configName" label="配置名称" width="180" />
      <el-table-column prop="configKey" label="配置键" width="200" />
      <el-table-column label="配置值" min-width="260">
        <template #default="{ row }">
          <template v-if="row.editing">
            <div class="edit-cell">
              <el-input
                v-if="row.configType === 'text' || row.configType === 'string'"
                v-model="row.editValue"
                size="small"
              />
              <el-input-number
                v-else-if="row.configType === 'number'"
                v-model="row.editValue"
                size="small"
                :controls="false"
              />
              <el-switch
                v-else-if="row.configType === 'boolean'"
                v-model="row.editValue"
                size="small"
              />
              <el-select
                v-else-if="row.configType === 'select'"
                v-model="row.editValue"
                size="small"
              >
                <el-option
                  v-for="opt in getSelectOptions(row)"
                  :key="opt"
                  :label="opt"
                  :value="opt"
                />
              </el-select>
              <el-input
                v-else
                v-model="row.editValue"
                size="small"
              />
              <el-button type="primary" size="small" @click="saveConfig(row)">保存</el-button>
              <el-button size="small" @click="cancelEdit(row)">取消</el-button>
            </div>
          </template>
          <template v-else>
            <div class="value-display">
              <el-tag v-if="row.configType === 'boolean'" :type="getBoolValue(row.configValue) ? 'success' : 'info'" size="small">
                {{ getBoolValue(row.configValue) ? '开启' : '关闭' }}
              </el-tag>
              <span v-else>{{ row.configValue }}</span>
              <el-button type="primary" link size="small" @click="startEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
            </div>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="configType" label="类型" width="100" />
      <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { configApi } from '@/api/index'

const categories = [
  { label: '全部', value: '' },
  { label: '公海设置', value: 'pool' },
  { label: '提醒设置', value: 'reminder' },
  { label: '销售设置', value: 'sales' },
  { label: '工单设置', value: 'service' },
  { label: '系统设置', value: 'system' },
  { label: '邮件设置', value: 'mail' }
]

const activeCategory = ref('')
const configList = ref([])
const loading = ref(false)
const allConfigs = ref([])

function getBoolValue(val) {
  if (typeof val === 'boolean') return val
  return val === 'true' || val === '1' || val === 1
}

function getSelectOptions(row) {
  if (row.configOptions) {
    try {
      return typeof row.configOptions === 'string' ? JSON.parse(row.configOptions) : row.configOptions
    } catch {
      return []
    }
  }
  return []
}

async function fetchConfigs() {
  loading.value = true
  try {
    const res = await configApi.list()
    allConfigs.value = (res.data?.records || res.data?.list || res.data || []).map(item => ({
      ...item,
      editing: false,
      editValue: item.configValue
    }))
    filterByCategory()
  } catch {
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

function filterByCategory() {
  if (!activeCategory.value) {
    configList.value = allConfigs.value
  } else {
    configList.value = allConfigs.value.filter(
      item => item.configCategory === activeCategory.value
    )
  }
}

function handleCategoryChange() {
  filterByCategory()
}

function startEdit(row) {
  row.editValue = getBoolValue(row.configValue) ? row.configValue : row.configValue
  if (row.configType === 'number') {
    row.editValue = Number(row.configValue) || 0
  } else if (row.configType === 'boolean') {
    row.editValue = getBoolValue(row.configValue)
  }
  row.editing = true
}

function cancelEdit(row) {
  row.editing = false
  row.editValue = row.configValue
}

async function saveConfig(row) {
  try {
    const value = row.configType === 'boolean'
      ? String(row.editValue)
      : String(row.editValue)
    await configApi.update({ id: row.id, configKey: row.configKey, configValue: value })
    row.configValue = value
    row.editing = false
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style scoped>
.system-config {
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

.edit-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-cell .el-input {
  flex: 1;
}

.edit-cell .el-input-number {
  flex: 1;
}

.value-display {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
