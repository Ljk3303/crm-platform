<template>
  <div class="crm-page-wrap">
    <div class="crm-page-hd">
      <div>
        <div class="crm-page-tit">客户管理</div>
        <div class="crm-page-sub">共 {{ pagination.total }} 位客户</div>
      </div>
      <el-button type="primary" size="large" @click="openCreate"><el-icon style="margin-right:6px"><Plus /></el-icon>新建客户</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="crm-search-bar">
      <el-input v-model="search.name" placeholder="搜索客户名称" clearable style="width:220px" @clear="fetchList" @keyup.enter="fetchList" />
      <el-select v-model="search.level" placeholder="客户等级" clearable style="width:140px" @change="fetchList">
        <el-option label="高价值" value="高价值" /><el-option label="普通" value="普通" /><el-option label="沉睡" value="沉睡" />
      </el-select>
      <el-button type="primary" @click="fetchList">搜索</el-button>
      <el-button @click="viewMode = viewMode === 'card' ? 'table' : 'card'" text>
        <el-icon><component :is="viewMode==='card' ? 'List' : 'Grid'" /></el-icon> {{ viewMode==='card'?'表格':'卡片' }}
      </el-button>
    </div>

    <!-- 卡片模式 -->
    <div v-if="viewMode === 'card'" class="crm-customer-cards">
      <div v-for="c in customerList" :key="c.id" class="crm-customer-card" @click="$router.push(`/customers/${c.id}`)">
        <div class="card-avatar">{{ (c.name||'?')[0] }}</div>
        <div class="card-name">{{ c.name }}</div>
        <div class="card-meta">{{ c.phone || '暂无电话' }} · {{ c.industry || '未分类' }}</div>
        <div class="card-row">
          <el-tag :type="c.level==='高价值'?'warning':c.level==='沉睡'?'info':'success'" size="small">{{ c.level || '普通' }}</el-tag>
          <div class="card-actions">
            <el-button size="small" text type="primary" @click.stop="$router.push(`/customers/${c.id}`)">详情</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格模式 -->
    <el-card v-else>
      <el-table :data="customerList" stripe @row-click="(row) => $router.push(`/customers/${row.id}`)" style="cursor:pointer">
        <el-table-column prop="name" label="客户名称" min-width="140">
          <template #default="{row}"><span style="font-weight:600;color:#0F172A">{{ row.name }}</span></template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="level" label="等级" width="100">
          <template #default="{row}"><el-tag :type="row.level==='高价值'?'warning':row.level==='沉睡'?'info':'success'" size="small">{{ row.level }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button size="small" text type="primary" @click.stop="$router.push(`/customers/${row.id}`)">详情</el-button>
            <el-button size="small" text type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="text-align:right;margin-top:16px">
        <el-pagination v-model:current-page="pagination.page" :page-size="pagination.size" :total="pagination.total" layout="total, prev, pager, next" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId?'编辑客户':'新建客户'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="电话" prop="phone"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="行业"><el-input v-model="form.industry" /></el-form-item>
        <el-form-item label="来源"><el-select v-model="form.source" style="width:100%"><el-option v-for="s in sources" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item label="等级"><el-select v-model="form.level" style="width:100%"><el-option v-for="l in levels" :key="l" :label="l" :value="l" /></el-select></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, List, Grid } from '@element-plus/icons-vue'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customer'

const viewMode = ref('card')
const customerList = ref([])
const pagination = reactive({ page: 1, size: 20, total: 0 })
const search = reactive({ name: '', level: '' })
const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formRef = ref(null)
const sources = ['门店','小程序','地推','网站','转介','展会','活动']
const levels = ['普通','高价值','沉睡']

const form = reactive({ name:'',phone:'',email:'',industry:'',source:'',level:'普通',address:'',remark:'' })
const rules = { name:[{required:true,message:'请输入客户姓名'}], phone:[{required:true,message:'请输入电话号码'}] }

const DEMO_CUSTOMERS = [
  { id:1, name:'陈思雨', phone:'13910001111', source:'门店', level:'高价值', status:1, created_at:'2026-06-15' },
  { id:2, name:'刘建国', phone:'13910001112', source:'小程序', level:'高价值', status:1, created_at:'2026-06-15' },
  { id:3, name:'李佳琪', phone:'13910001113', source:'门店', level:'高价值', status:1, created_at:'2026-06-14' },
  { id:4, name:'张晓萌', phone:'13910001114', source:'门店', level:'普通', status:1, created_at:'2026-06-14' },
  { id:5, name:'王大明', phone:'13910001115', source:'小程序', level:'高价值', status:1, created_at:'2026-06-13' },
  { id:6, name:'赵铁柱', phone:'13910001116', source:'地推', level:'普通', status:1, created_at:'2026-06-13' },
  { id:7, name:'钱多多', phone:'13910001130', source:'门店', level:'高价值', status:1, created_at:'2026-06-12' },
  { id:8, name:'孙美美', phone:'13910001125', source:'门店', level:'高价值', status:1, created_at:'2026-06-12' },
]
async function fetchList() {
  try {
    const res = await getCustomers({ page: pagination.page, size: pagination.size, name: search.name, level: search.level })
    customerList.value = res.records || DEMO_CUSTOMERS
    pagination.total = res.total || DEMO_CUSTOMERS.length
  } catch (e) {
    console.error('fetchList failed', e)
    customerList.value = DEMO_CUSTOMERS
    pagination.total = DEMO_CUSTOMERS.length
  }
}

function openCreate() { Object.assign(form, {name:'',phone:'',email:'',industry:'',source:'',level:'普通',address:'',remark:''}); editingId.value = null; dialogVisible.value = true }

async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (editingId.value) await updateCustomer(editingId.value, form)
    else await createCustomer(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } catch (e) { ElMessage.error('保存失败: ' + (e?.message || '请检查网络连接')) }
  finally { saving.value = false }
}

async function handleDelete(row) {
  try { await ElMessageBox.confirm('确定删除该客户？', '确认', { type: 'warning' }) } catch { return }
  await deleteCustomer(row.id)
  ElMessage.success('已删除')
  fetchList()
}

onMounted(fetchList)
</script>
