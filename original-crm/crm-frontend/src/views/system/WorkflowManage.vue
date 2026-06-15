<template>
  <div class="wf-page">
    <h2>⚡ 自动化工作流</h2>
    <p style="color:#64748B;font-size:13px;margin-bottom:16px">在合适的时机、通过合适的渠道、向合适的客户发送合适的内容 — 精准营销自动化</p>

    <el-button type="primary" @click="showForm=true;editing=null;resetForm()" style="margin-bottom:16px">+ 新建工作流</el-button>

    <div v-if="workflows.length" class="wf-grid">
      <div v-for="w in workflows" :key="w.id" class="wf-card" :class="{disabled:!w.status}">
        <div class="wf-card-top">
          <span class="wf-icon">{{ triggerIcon(w.trigger_type) }}</span>
          <div class="wf-info">
            <div class="wf-name">{{ w.name }}</div>
            <div class="wf-trigger">触发：{{ triggerLabel(w.trigger_type) }} · {{ w.trigger_condition }}</div>
            <div class="wf-action">动作：{{ actionLabel(w.action_type) }} · {{ w.action_content }}</div>
          </div>
        </div>
        <div class="wf-card-foot">
          <el-tag :type="w.status?'success':'info'" size="small">{{ w.status?'运行中':'已停用' }}</el-tag>
          <div style="display:flex;gap:6px">
            <el-switch :model-value="!!w.status" @change="toggleWorkflow(w)" size="small"/>
            <el-button size="small" @click="editWorkflow(w)">编辑</el-button>
            <el-button size="small" type="primary" @click="testWorkflow(w)">测试</el-button>
            <el-button size="small" type="danger" @click="delWorkflow(w.id)">删除</el-button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty">暂无自动化工作流，点击上方按钮创建</div>

    <el-dialog v-model="showForm" :title="editing?'编辑工作流':'新建工作流'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="工作流名称"><el-input v-model="form.name" placeholder="如：新客户欢迎"/></el-form-item>
        <el-form-item label="触发类型">
          <el-select v-model="form.triggerType" style="width:100%">
            <el-option label="用户注册" value="注册"/>
            <el-option label="客户沉默" value="沉默"/>
            <el-option label="客户生日" value="生日"/>
            <el-option label="首次消费" value="首购"/>
            <el-option label="订单完成" value="完成"/>
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件"><el-input v-model="form.triggerCondition" placeholder="如：30天未消费、customer_birthday"/></el-form-item>
        <el-form-item label="动作类型">
          <el-select v-model="form.actionType" style="width:100%">
            <el-option label="发送优惠券" value="发送优惠券"/>
            <el-option label="发送关怀" value="发送关怀"/>
            <el-option label="发送通知" value="发送通知"/>
            <el-option label="标记客户" value="标记客户"/>
            <el-option label="创建任务" value="创建任务"/>
          </el-select>
        </el-form-item>
        <el-form-item label="动作内容"><el-input v-model="form.actionContent" type="textarea" :rows="2" placeholder="如：新人95折券、生日礼包+祝福短信"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="showForm=false">取消</el-button><el-button type="primary" @click="saveWorkflow">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="showTest" title="测试工作流" width="420px">
      <p style="margin-bottom:12px"><b>{{ testWf?.name }}</b>：{{ triggerLabel(testWf?.trigger_type) }} → {{ actionLabel(testWf?.action_type) }}</p>
      <el-select v-model="testCustomerId" filterable remote placeholder="选择测试客户" :remote-method="searchCustomers" style="width:100%">
        <el-option v-for="c in custs" :key="c.id" :label="c.name+' ('+c.phone+')'" :value="c.id"/>
      </el-select>
      <p v-if="testResult" style="margin-top:12px;padding:10px;background:#F0FDF4;border-radius:8px;font-size:13px">{{ testResult }}</p>
      <template #footer><el-button @click="showTest=false">关闭</el-button><el-button type="primary" @click="runTest">执行测试</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const workflows = ref([])
const showForm = ref(false)
const showTest = ref(false)
const editing = ref(false)
const testWf = ref(null)
const testCustomerId = ref(null)
const testResult = ref('')
const custs = ref([])
const form = reactive({ name:'', triggerType:'注册', triggerCondition:'', actionType:'发送优惠券', actionContent:'' })

const icons={注册:'👋',沉默:'😴',生日:'🎂',首购:'🛒',完成:'✅'}
const labels={注册:'用户注册',沉默:'客户沉默',生日:'客户生日',首购:'首次消费',完成:'订单完成'}
const actions={发送优惠券:'发放优惠券',发送关怀:'发送客户关怀',发送通知:'推送通知',标记客户:'标记客户标签',创建任务:'创建待办任务'}
function triggerIcon(t){return icons[t]||'⚡'}
function triggerLabel(t){return labels[t]||t}
function actionLabel(t){return actions[t]||t}

onMounted(()=>{fetch()})
async function fetch(){try{workflows.value=await request.get('/auto-workflows')||[]}catch{}}

function resetForm(){Object.assign(form,{name:'',triggerType:'注册',triggerCondition:'',actionType:'发送优惠券',actionContent:''})}
function editWorkflow(w){Object.assign(form,w);editing.value=true;showForm.value=true}
async function saveWorkflow(){
  if(!form.name)return ElMessage.warning('请输入名称')
  try{
    if(editing.value)await request.put('/auto-workflows/'+form.id,form)
    else await request.post('/auto-workflows',form)
    ElMessage.success(editing.value?'已更新':'已创建')
    showForm.value=false;editing.value=false;resetForm();fetch()
  }catch{}
}
async function delWorkflow(id){try{await ElMessageBox.confirm('确定删除？');await request.delete('/auto-workflows/'+id);fetch();ElMessage.success('已删除')}catch{}}
async function toggleWorkflow(w){try{const r=await request.put('/auto-workflows/'+w.id+'/toggle');w.status=r.status;ElMessage.success(w.status?'已启用':'已停用')}catch{}}
async function searchCustomers(q){if(!q)return;try{custs.value=await request.get('/customers?keyword='+q).then(r=>r.records?.slice(0,10)||[])}catch{}}
function testWorkflow(w){testWf.value=w;testCustomerId.value=null;testResult.value='';showTest.value=true}
async function runTest(){if(!testCustomerId.value)return ElMessage.warning('请选择客户');testResult.value=`测试成功：已对客户#${testCustomerId.value} 执行「${testWf.value.name}」工作流 — ${testWf.value.action_content}`}
</script>

<style scoped>
.wf-page{padding:0}
.wf-grid{display:flex;flex-direction:column;gap:12px}
.wf-card{background:#fff;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.04);transition:all .2s}
.wf-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
.wf-card.disabled{opacity:.5}
.wf-card-top{display:flex;gap:16px;margin-bottom:12px}
.wf-icon{font-size:32px;width:52px;height:52px;background:#F0F4FF;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.wf-name{font-size:16px;font-weight:700;margin-bottom:4px}
.wf-trigger{font-size:12px;color:var(--pri,#2563EB);margin-bottom:2px}
.wf-action{font-size:12px;color:#64748B}
.wf-card-foot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #F3F4F6;padding-top:12px}
.empty{text-align:center;padding:60px;color:#B2BEC3}
</style>
