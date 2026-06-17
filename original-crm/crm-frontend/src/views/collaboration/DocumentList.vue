<template>
  <div class="document-list">
    <div class="page-header">
      <h2>文档管理</h2>
      <div class="header-actions">
        <el-upload
          :http-request="handleUpload"
          :show-file-list="false"
          accept="*"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon> 上传文档
          </el-button>
        </el-upload>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <el-select v-model="filters.category" placeholder="文档分类" clearable @change="fetchDocuments">
        <el-option label="产品文档" value="product" />
        <el-option label="销售资料" value="sales" />
        <el-option label="合同文件" value="contract" />
        <el-option label="培训材料" value="training" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select v-model="filters.relatedType" placeholder="关联类型" clearable @change="fetchDocuments">
        <el-option label="客户" value="customer" />
        <el-option label="线索" value="lead" />
        <el-option label="商机" value="opportunity" />
        <el-option label="产品" value="product" />
        <el-option label="报价" value="quotation" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        placeholder="搜索文档名称"
        clearable
        style="width:240px"
        @clear="fetchDocuments"
        @keyup.enter="fetchDocuments"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- Grid View -->
    <div v-loading="loading" class="doc-grid">
      <el-empty v-if="!loading && documents.length === 0" description="暂无文档" />
      <div v-for="doc in documents" :key="doc.id" class="doc-card">
        <div class="doc-icon" @click="handlePreview(doc)">
          <el-icon :size="48">
            <Document v-if="isDocType(doc.fileName)" />
            <Picture v-else-if="isImageType(doc.fileName)" />
            <VideoPlay v-else-if="isVideoType(doc.fileName)" />
            <Files v-else />
          </el-icon>
        </div>
        <div class="doc-info">
          <el-tooltip :content="doc.fileName" placement="top">
            <div class="doc-name" @click="handlePreview(doc)">{{ doc.fileName }}</div>
          </el-tooltip>
          <div class="doc-meta">
            <span>{{ formatFileSize(doc.fileSize) }}</span>
            <span v-if="doc.uploaderName">{{ doc.uploaderName }}</span>
            <span>{{ doc.downloadCount || 0 }}次下载</span>
          </div>
          <div class="doc-date">{{ doc.createdAt }}</div>
        </div>
        <div class="doc-actions">
          <el-button type="primary" link @click="handleDownload(doc)">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-popconfirm title="确定删除该文档?" @confirm="handleDelete(doc)">
            <template #reference>
              <el-button type="danger" link>
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="fetchDocuments"
      style="margin-top:16px;justify-content:flex-end"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Search, Document, Picture, VideoPlay, Files, Download, Delete } from '@element-plus/icons-vue'
import { documentApi } from '@/api/index'

const documents = ref([])
const loading = ref(false)
const DD = [{id:1,name:"销售手册2026.pdf",file_type:"pdf",file_size:2048,category:"销售资料",created_at:"2026-06-15"},{id:2,name:"产品白皮书.docx",file_type:"doc",file_size:1536,category:"产品资料",created_at:"2026-06-14"},{id:3,name:"合同模板.docx",file_type:"doc",file_size:256,category:"合同模板",created_at:"2026-06-13"}]
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const filters = reactive({
  category: '',
  relatedType: '',
  keyword: ''
})

function isDocType(name) {
  return /\.(doc|docx|xls|xlsx|ppt|pptx|pdf|txt|md)$/i.test(name)
}

function isImageType(name) {
  return /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(name)
}

function isVideoType(name) {
  return /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(name)
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(1) + ' ' + units[i]
}

async function fetchDocuments() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      category: filters.category || undefined,
      relatedType: filters.relatedType || undefined,
      keyword: filters.keyword || undefined
    }
    const res = await documentApi.list(params)
    documents.value = res.records || []
    total.value = res.total || 0
  } catch {
    ElMessage.error('加载文档列表失败')
  } finally {
    loading.value = false
  }
}

async function handleUpload({ file }) {
  const formData = new FormData()
  formData.append('file', file)
  try {
    await documentApi.upload(formData)
    ElMessage.success('上传成功')
    fetchDocuments()
  } catch {
    ElMessage.error('上传失败')
  }
}

function handlePreview(doc) {
  if (doc.fileUrl) {
    window.open(doc.fileUrl, '_blank')
  } else {
    handleDownload(doc)
  }
}

function handleDownload(doc) {
  if (doc.fileUrl) {
    const link = document.createElement('a')
    link.href = doc.fileUrl
    link.download = doc.fileName
    link.click()
  } else {
    ElMessage.warning('文件地址不可用')
  }
}

async function handleDelete(doc) {
  try {
    await documentApi.delete(doc.id)
    ElMessage.success('删除成功')
    fetchDocuments()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchDocuments()
})
</script>

<style scoped>
.document-list {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.doc-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: box-shadow 0.2s;
  background: #fafafa;
}

.doc-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.doc-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 8px;
  margin-right: 12px;
  cursor: pointer;
}

.doc-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.doc-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  margin-bottom: 6px;
}

.doc-name:hover {
  color: #409eff;
}

.doc-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}

.doc-date {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.doc-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}
</style>
