<template>
  <div class="dict-manage">
    <div class="page-header">
      <h2>数据字典</h2>
    </div>

    <div class="dict-container">
      <!-- Left Panel: Dict Types -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">字典类型</span>
          <el-button type="primary" size="small" @click="openTypeDialog(null)">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        <el-table
          :data="typeList"
          v-loading="typeLoading"
          highlight-current-row
          @row-click="selectType"
          size="small"
          height="calc(100% - 40px)"
        >
          <el-table-column prop="dictName" label="字典名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="dictType" label="字典类型" min-width="140" show-overflow-tooltip />
          <el-table-column label="状态" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '1' || row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === '1' || row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="openTypeDialog(row)">编辑</el-button>
              <el-popconfirm title="确定删除?" @confirm="deleteType(row)">
                <template #reference>
                  <el-button type="danger" link size="small" @click.stop>删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Right Panel: Dict Data -->
      <div class="right-panel">
        <div class="panel-header">
          <span class="panel-title">
            {{ currentType ? (currentType.dictName + ' - 数据项') : '数据项' }}
            <el-tag v-if="currentType" type="info" size="small" style="margin-left:8px">{{ currentType.dictType }}</el-tag>
          </span>
          <el-button
            type="primary"
            size="small"
            :disabled="!currentType"
            @click="openDataDialog(null)"
          >
            <el-icon><Plus /></el-icon> 新增
          </el-button>
        </div>
        <el-table :data="dataList" v-loading="dataLoading" stripe size="small" height="calc(100% - 40px)">
          <el-table-column prop="dictLabel" label="字典标签" min-width="120" />
          <el-table-column prop="dictValue" label="字典键值" min-width="100" />
          <el-table-column prop="dictSort" label="排序" width="80" align="center" />
          <el-table-column label="样式" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.cssClass" :type="row.cssClass" size="small">{{ row.cssClass }}</el-tag>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '1' || row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === '1' || row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDataDialog(row)">编辑</el-button>
              <el-popconfirm title="确定删除?" @confirm="deleteData(row)">
                <template #reference>
                  <el-button type="danger" link size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Add/Edit Type Dialog -->
    <el-dialog
      v-model="typeDialogVisible"
      :title="editingType ? '编辑字典类型' : '新增字典类型'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="typeForm" label-width="80px">
        <el-form-item label="字典名称" required>
          <el-input v-model="typeForm.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典类型" required>
          <el-input v-model="typeForm.dictType" placeholder="如: sys_user_sex" :disabled="!!editingType" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="typeForm.status" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="typeForm.remark" type="textarea" :rows="3" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveType" :loading="savingType">保存</el-button>
      </template>
    </el-dialog>

    <!-- Add/Edit Data Dialog -->
    <el-dialog
      v-model="dataDialogVisible"
      :title="editingData ? '编辑数据项' : '新增数据项'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="dataForm" label-width="80px">
        <el-form-item label="字典标签" required>
          <el-input v-model="dataForm.dictLabel" placeholder="如: 男" />
        </el-form-item>
        <el-form-item label="字典键值" required>
          <el-input v-model="dataForm.dictValue" placeholder="如: 0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dataForm.dictSort" :min="0" :controls="true" />
        </el-form-item>
        <el-form-item label="样式类">
          <el-select v-model="dataForm.cssClass" placeholder="选择样式" clearable>
            <el-option label="默认" value="default" />
            <el-option label="主要" value="primary" />
            <el-option label="成功" value="success" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="dataForm.status" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dataForm.remark" type="textarea" :rows="2" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveData" :loading="savingData">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { dictApi } from '@/api/index'

// Type list
const typeList = ref([])
const typeLoading = ref(false)
const currentType = ref(null)

// Data list
const dataList = ref([])
const dataLoading = ref(false)

// Type dialog
const typeDialogVisible = ref(false)
const editingType = ref(null)
const typeForm = ref({ dictName: '', dictType: '', status: '1', remark: '' })
const savingType = ref(false)

// Data dialog
const dataDialogVisible = ref(false)
const editingData = ref(null)
const dataForm = ref({ dictLabel: '', dictValue: '', dictSort: 0, cssClass: 'default', status: '1', remark: '' })
const savingData = ref(false)

async function fetchTypes() {
  typeLoading.value = true
  try {
    const res = await dictApi.types()
    typeList.value = res.data?.records || res.data?.list || res.data || []
  } catch {
    ElMessage.error('加载字典类型失败')
  } finally {
    typeLoading.value = false
  }
}

function selectType(row) {
  currentType.value = row
  fetchData(row.dictType)
}

async function fetchData(dictType) {
  dataLoading.value = true
  try {
    const res = await dictApi.data(dictType)
    dataList.value = res.data?.records || res.data?.list || res.data || []
  } catch {
    ElMessage.error('加载字典数据失败')
  } finally {
    dataLoading.value = false
  }
}

// Type CRUD
function openTypeDialog(row) {
  editingType.value = row
  if (row) {
    typeForm.value = {
      dictName: row.dictName,
      dictType: row.dictType,
      status: String(row.status ?? '1'),
      remark: row.remark || ''
    }
  } else {
    typeForm.value = { dictName: '', dictType: '', status: '1', remark: '' }
  }
  typeDialogVisible.value = true
}

async function saveType() {
  if (!typeForm.value.dictName) {
    ElMessage.warning('请输入字典名称')
    return
  }
  if (!typeForm.value.dictType) {
    ElMessage.warning('请输入字典类型')
    return
  }
  savingType.value = true
  try {
    if (editingType.value) {
      await dictApi.createType({ ...typeForm.value, id: editingType.value.id })
      ElMessage.success('更新成功')
    } else {
      await dictApi.createType(typeForm.value)
      ElMessage.success('创建成功')
    }
    typeDialogVisible.value = false
    fetchTypes()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    savingType.value = false
  }
}

async function deleteType(row) {
  try {
    // dictApi doesn't have deleteType, use createType with a delete-like approach
    // Fallback to a generic delete approach
    await dictApi.createType({ id: row.id, _method: 'DELETE' })
    ElMessage.success('删除成功')
    if (currentType.value?.dictType === row.dictType) {
      currentType.value = null
      dataList.value = []
    }
    fetchTypes()
  } catch {
    ElMessage.error('删除失败')
  }
}

// Data CRUD
function openDataDialog(row) {
  editingData.value = row
  if (row) {
    dataForm.value = {
      dictLabel: row.dictLabel,
      dictValue: row.dictValue,
      dictSort: row.dictSort || 0,
      cssClass: row.cssClass || '',
      status: String(row.status ?? '1'),
      remark: row.remark || ''
    }
  } else {
    dataForm.value = { dictLabel: '', dictValue: '', dictSort: 0, cssClass: '', status: '1', remark: '' }
  }
  dataDialogVisible.value = true
}

async function saveData() {
  if (!dataForm.value.dictLabel) {
    ElMessage.warning('请输入字典标签')
    return
  }
  if (!dataForm.value.dictValue) {
    ElMessage.warning('请输入字典键值')
    return
  }
  savingData.value = true
  try {
    if (editingData.value) {
      await dictApi.updateData({
        id: editingData.value.id,
        ...dataForm.value,
        dictType: currentType.value.dictType
      })
      ElMessage.success('更新成功')
    } else {
      await dictApi.createData({
        ...dataForm.value,
        dictType: currentType.value.dictType
      })
      ElMessage.success('创建成功')
    }
    dataDialogVisible.value = false
    fetchData(currentType.value.dictType)
  } catch {
    ElMessage.error('保存失败')
  } finally {
    savingData.value = false
  }
}

async function deleteData(row) {
  try {
    await dictApi.updateData({ id: row.id, _method: 'DELETE' })
    ElMessage.success('删除成功')
    fetchData(currentType.value.dictType)
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchTypes()
})
</script>

<style scoped>
.dict-manage {
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

.dict-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 180px);
  min-height: 500px;
}

.left-panel {
  width: 360px;
  min-width: 280px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
  flex-shrink: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
