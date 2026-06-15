<template>
  <div class="dash">
    <div class="dash-top">
      <div>
        <h2>仪表盘</h2>
        <p>{{ greeting }}，{{ userName }}。今日有 <b>{{ pending }}</b> 项待处理。</p>
      </div>
      <div class="dash-btns">
        <button class="btn pri" @click="$router.push('/customers')"><el-icon><Plus/></el-icon>新建客户</button>
        <button class="btn" @click="$router.push('/orders')"><el-icon><Document/></el-icon>录入订单</button>
        <button class="btn" @click="$router.push('/ai-assistant')"><el-icon><MagicStick/></el-icon>AI 助手</button>
      </div>
    </div>

    <!-- KPI -->
    <div class="row4">
      <div v-for="k in kpis" :key="k.label" class="kpi" :class="k.c">
        <div class="kpi-head">
          <div class="kpi-icon" :class="k.c"><el-icon :size="20"><component :is="k.icon"/></el-icon></div>
          <span class="kpi-tag">{{ k.tag }}</span>
        </div>
        <div class="kpi-val">{{ k.val }}</div>
        <div class="kpi-foot">
          <span :class="k.up?'green':'red'">{{ k.up?'↑':'↓' }} {{ k.d }}%</span>
          <span class="kpi-vs">较上月</span>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="row2">
      <div class="box"><div class="box-hd"><h4>销售趋势</h4></div><div class="chart-wrap"><div ref="c1" class="ch"></div></div></div>
      <div class="box"><div class="box-hd"><h4>销售漏斗</h4></div><div class="chart-wrap"><div ref="c2" class="ch"></div></div></div>
    </div>

    <!-- Source + Activities -->
    <div class="row2b">
      <div class="box">
        <div class="box-hd"><h4>客户来源分布</h4></div>
        <div class="donut-row">
          <div class="chart-wrap" style="flex:1"><div ref="c3" class="ch-donut"></div></div>
          <div class="legend-col">
            <div v-for="s in sourceData" :key="s.name" class="leg">
              <span class="leg-dot" :style="{background:s.color}"></span>
              <span class="leg-n">{{ s.name }}</span>
              <span class="leg-v">{{ s.pct }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="box">
        <div class="box-hd"><h4>最新动态</h4></div>
        <div class="list-scroll">
          <div v-for="a in actData" :key="a.id||a.time" class="act">
            <div class="act-av" :style="{background:a.color}">{{ (a.who||'?')[0] }}</div>
            <div class="act-bd"><div class="act-line"><b>{{ a.who }}</b> {{ a.action }} <span class="act-tg">{{ a.target }}</span></div><div class="act-tm">{{ a.timeText }}</div></div>
            <div v-if="a.amount" class="act-amt">+¥{{ Number(a.amount).toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Three columns -->
    <div class="row3">
      <div class="box">
        <div class="box-hd"><h4>今日优先级</h4></div>
        <div class="list-scroll">
          <div v-for="(p,i) in prioData" :key="i" class="prio">
            <div class="prio-rk" :class="'r'+(i+1)">{{ i+1 }}</div>
            <div class="prio-bd"><div class="prio-nm">{{ p.customerName||p.name }}</div><div class="prio-rs">{{ p.reason }}</div></div>
            <span class="prio-tg" :class="p.priority==='高'?'red':'amber'">{{ p.priority||'中' }}</span>
          </div>
        </div>
      </div>
      <div class="box">
        <div class="box-hd"><h4>热销商品 TOP 5</h4></div>
        <div class="list-scroll">
          <div v-for="(p,i) in prodData" :key="p.id||i" class="tprod" @click="$router.push('/products')">
            <div class="tprod-rk" :class="'r'+(i+1)">{{ i+1 }}</div>
            <div class="tprod-bd"><div class="tprod-nm">{{ p.name }}</div><div class="tprod-meta">销量 {{ p.sales_count||p.total_qty||0 }} · 库存 {{ p.stock||0 }}</div></div>
            <div class="tprod-pr">¥{{ (p.price||0).toLocaleString() }}</div>
          </div>
        </div>
      </div>
      <div class="box">
        <div class="box-hd"><h4>团队排名</h4></div>
        <div class="list-scroll">
          <div v-for="(t,i) in teamData" :key="t.id||i" class="tmem">
            <div class="tmem-av" :style="{background:t.color}">{{ (t.name||'?')[0] }}</div>
            <div class="tmem-bd"><div class="tmem-nm">{{ t.name }}</div><div class="tmem-meta">签单 {{ t.deals }} 单</div></div>
            <div class="tmem-amt">¥{{ (t.amount/10000).toFixed(1) }}w</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, markRaw, nextTick } from 'vue'
import { User, Money, Plus, Connection, List, Document, MagicStick } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { analyticsApi, aiApi, productApi } from '@/api'

const c1=ref(null),c2=ref(null),c3=ref(null)
let ch1=null,ch2=null,ch3=null
const userName = localStorage.getItem('realName') || '管理员'
const greeting = computed(() => { const h=new Date().getHours(); return h<6?'凌晨好':h<12?'早上好':h<14?'中午好':h<18?'下午好':'晚上好' })
const pending = ref(2)

// ============= DATA - 默认带有演示数据 =============
const kpis = ref([
  { label:'客户总数', val:'15', d:12, up:true, c:'blue',   tag:'累计', icon:markRaw(User),       bar:'#3b82f6' },
  { label:'本月营收', val:'¥17.7万', d:8, up:true, c:'green',  tag:'本月', icon:markRaw(Money),      bar:'#22c55e' },
  { label:'活跃商机', val:'9', d:15, up:true, c:'purple', tag:'进行中', icon:markRaw(Connection), bar:'#8b5cf6' },
  { label:'待办任务', val:'2', d:-5, up:false,c:'red',    tag:'今日', icon:markRaw(List),       bar:'#ef4444' },
])

const prioData = ref([
  { customerName:'陈思雨', reason:'高价值客户近30天无订单', priority:'高' },
  { customerName:'李佳琪', reason:'商机处于商务谈判阶段需推动', priority:'高' },
  { customerName:'刘建国', reason:'报价方案已发出需跟进', priority:'中' },
  { customerName:'张晓萌', reason:'新线索需首次联系', priority:'中' },
])

const prodData = ref([
  { id:18, name:'日系简约双肩包', price:129.9, sales_count:17, stock:92 },
  { id:5,  name:'马克杯', price:67, sales_count:4, stock:151 },
  { id:1,  name:'面膜套装', price:59.9, sales_count:2, stock:178 },
  { id:16, name:'香薰加湿器', price:89.9, sales_count:1, stock:89 },
  { id:2,  name:'手帐本', price:35, sales_count:1, stock:178 },
])

const teamData = ref([
  { name:'张伟', deals:21, amount:57700, color:'#3b82f6' },
  { name:'李明', deals:15, amount:53300, color:'#ec4899' },
  { name:'王芳', deals:14, amount:37600, color:'#8b5cf6' },
  { name:'管理员', deals:14, amount:27900, color:'#22c55e' },
])

const sourceData = ref([
  { name:'门店', pct:40, value:6, color:'#3b82f6' },
  { name:'小程序', pct:40, value:6, color:'#22c55e' },
  { name:'地推', pct:13, value:2, color:'#f59e0b' },
  { name:'校园', pct:7,  value:1, color:'#8b5cf6' },
])

const actData = ref([
  { who:'张伟', action:'签下订单', target:'华润集团', amount:186000, timeText:'5分钟前', color:'#3b82f6' },
  { who:'李明', action:'跟进客户', target:'比亚迪供应链', timeText:'12分钟前', color:'#ec4899' },
  { who:'王芳', action:'创建合同', target:'腾讯云', amount:96000, timeText:'38分钟前', color:'#8b5cf6' },
  { who:'管理员', action:'新建客户', target:'宁德时代', timeText:'1小时前', color:'#22c55e' },
  { who:'张伟', action:'签下订单', target:'招商银行', amount:245000, timeText:'2小时前', color:'#f59e0b' },
])

// ============= FETCH REAL DATA (optional upgrade) =============
async function load() {
  try {
    const d = await analyticsApi.dashboard()
    if (d) {
      kpis.value[0].val = String(d.totalCustomers||d.total_customers||15)
      kpis.value[1].val = (d.monthOrderAmount||d.total_amount) ? '¥'+(Number(d.monthOrderAmount||d.total_amount)/10000).toFixed(1)+'万' : '¥17.7万'
      kpis.value[2].val = String(d.totalOpportunities||d.active_opportunities||9)
      kpis.value[3].val = String(d.pendingTodos||d.pending_tasks||2)
      pending.value = kpis.value[3].val
    }
  } catch(e) { console.log('dash API fallback') }

  try { const p = await aiApi.todayPriority(); if (p&&p.length) prioData.value = p.slice(0,5) } catch(e) {}
  try { const p = await productApi.top(5); if (p&&p.length) prodData.value = p } catch(e) {}
  try { const s = await analyticsApi.customerSource(); if (s&&s.length) sourceData.value = s } catch(e) {}
  try { const t = await analyticsApi.employeeRanking(); if (t&&t.length) teamData.value = t } catch(e) {}
  try { const a = await analyticsApi.recentActivities(); if (a&&a.length) actData.value = a } catch(e) {}
}

// ============= CHARTS (always render) =============
function draw() {
  if (c1.value) { if (ch1) ch1.dispose(); ch1 = echarts.init(c1.value); ch1.setOption({
    tooltip:{trigger:'axis'}, grid:{left:0,right:20,top:8,bottom:0,containLabel:true},
    xAxis:{type:'category',data:['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],axisLabel:{fontSize:10,color:'#94a3b8'}},
    yAxis:{type:'value',axisLabel:{fontSize:10,color:'#94a3b8',formatter:v=>v===0?'0':(v/10000)+'万'},splitLine:{lineStyle:{color:'#f1f5f9'}}},
    series:[{type:'line',data:[1.8,2.2,2.5,2.8,3.1,2.6,3.5,3.8,3.2,4.0,3.7,4.2].map(v=>v*10000),smooth:true,symbol:'none',
      lineStyle:{color:'#3b82f6',width:2},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(59,130,246,0.15)'},{offset:1,color:'rgba(59,130,246,0)'}])}}]
  })}
  if (c2.value) { if (ch2) ch2.dispose(); ch2 = echarts.init(c2.value); ch2.setOption({
    tooltip:{trigger:'item',formatter:'{b}: {c} 单'},
    series:[{type:'funnel',left:'8%',right:'8%',top:8,bottom:8,sort:'descending',gap:4,
      label:{show:true,position:'inside',fontSize:12,fontWeight:600,color:'#fff'},
      data:[{value:100,name:'线索',itemStyle:{color:'#3b82f6'}},{value:72,name:'意向',itemStyle:{color:'#6366f1'}},{value:48,name:'报价',itemStyle:{color:'#8b5cf6'}},{value:24,name:'谈判',itemStyle:{color:'#a855f7'}},{value:12,name:'成交',itemStyle:{color:'#c084fc'}}]}]
  })}
  if (c3.value) { if (ch3) ch3.dispose(); ch3 = echarts.init(c3.value); ch3.setOption({
    tooltip:{trigger:'item',formatter:'{b}: {c}%'},
    series:[{type:'pie',radius:['55%','75%'],center:['50%','50%'],itemStyle:{borderColor:'#fff',borderWidth:2,borderRadius:4},label:{show:false},
      data:sourceData.value.map(s=>({value:s.pct||s.value,name:s.name,itemStyle:{color:s.color}}))}]
  })}
}

onMounted(async () => {
  await load()
  await nextTick()
  setTimeout(draw, 300)
})
onUnmounted(() => { ch1?.dispose(); ch2?.dispose(); ch3?.dispose() })
</script>

<style scoped>
.dash{display:flex;flex-direction:column;gap:16px;padding:2px 0;color:#0f172a}
/* top */
.dash-top{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;padding:22px 28px;color:#fff;flex-wrap:wrap;gap:12px}
.dash-top h2{font-size:20px;font-weight:700;margin:0 0 4px}
.dash-top p{margin:0;font-size:13px;opacity:.9}
.dash-top b{background:rgba(255,255,255,.2);padding:1px 8px;border-radius:10px}
.dash-btns{display:flex;gap:8px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 14px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;transition:all .15s;white-space:nowrap}
.btn:hover{background:rgba(255,255,255,.2)}
.btn.pri{background:#fff;color:#2563eb;border-color:#fff;font-weight:600}
.btn.pri:hover{background:#eef2ff}
/* KPI */
.row4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.kpi{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;position:relative;overflow:hidden;transition:all .15s}
.kpi:hover{box-shadow:0 4px 12px rgba(0,0,0,.06);transform:translateY(-1px)}
.kpi::after{content:'';position:absolute;top:-20px;right:-20px;width:70px;height:70px;border-radius:50%;opacity:.05}
.kpi.blue::after{background:#3b82f6}.kpi.green::after{background:#22c55e}.kpi.purple::after{background:#8b5cf6}.kpi.red::after{background:#ef4444}
.kpi-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.kpi-icon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.kpi-icon.blue{background:#dbeafe;color:#2563eb}.kpi-icon.green{background:#dcfce7;color:#16a34a}.kpi-icon.purple{background:#f3e8ff;color:#9333ea}.kpi-icon.red{background:#fee2e2;color:#dc2626}
.kpi-tag{font-size:10px;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:10px}
.kpi-val{font-size:24px;font-weight:700;color:#0f172a;line-height:1.1;margin-bottom:4px}
.kpi-foot{display:flex;align-items:baseline;gap:6px;font-size:11px}
.green{color:#16a34a;font-weight:600}.red{color:#dc2626;font-weight:600}
.kpi-vs{color:#94a3b8}
/* boxes */
.row2{display:grid;grid-template-columns:2fr 1fr;gap:12px}
.row2b{display:grid;grid-template-columns:1fr 1.4fr;gap:12px}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.box{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.box-hd{padding:14px 18px;border-bottom:1px solid #f1f5f9;flex-shrink:0}
.box-hd h4{font-size:14px;font-weight:600;color:#0f172a;margin:0}
.chart-wrap{flex:1;min-height:0;padding:4px;position:relative}
.ch{width:100%;height:100%;min-height:280px}
.ch-donut{width:100%;height:100%;min-height:240px}
/* donut */
.donut-row{display:flex;align-items:center;gap:8px;padding:8px 16px 8px 8px}
.legend-col{display:flex;flex-direction:column;gap:8px;min-width:100px}
.leg{display:flex;align-items:center;gap:6px;font-size:12px}
.leg-dot{width:8px;height:8px;border-radius:3px;flex-shrink:0}
.leg-n{color:#475569;flex:1}
.leg-v{color:#0f172a;font-weight:600;font-family:monospace}
/* lists */
.list-scroll{flex:1;overflow-y:auto;padding:6px 16px 12px}
.act{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9}
.act:last-child{border-bottom:none}
.act-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;flex-shrink:0}
.act-bd{flex:1;min-width:0}
.act-line{font-size:12.5px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.act-line b{color:#0f172a}.act-tg{color:#0f172a;font-weight:500}
.act-tm{font-size:10.5px;color:#94a3b8;margin-top:1px}
.act-amt{font-size:12px;font-weight:600;color:#16a34a;flex-shrink:0}
/* priority */
.prio{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;transition:background .15s;border-bottom:1px solid #f1f5f9}
.prio:last-child{border-bottom:none}
.prio:hover{background:#f8fafc}
.prio-rk{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
.prio-rk.r1{background:#ef4444}.prio-rk.r2{background:#f59e0b}.prio-rk.r3{background:#3b82f6}.prio-rk.r4,.prio-rk.r5{background:#94a3b8}
.prio-bd{flex:1;min-width:0}
.prio-nm{font-size:12.5px;font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prio-rs{font-size:11px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prio-tg{font-size:10px;padding:1px 7px;border-radius:8px;font-weight:500;flex-shrink:0}
.prio-tg.red{background:#fee2e2;color:#dc2626}.prio-tg.amber{background:#fef3c7;color:#d97706}
/* product */
.tprod{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;transition:background .15s;cursor:pointer;border-bottom:1px solid #f1f5f9}
.tprod:last-child{border-bottom:none}
.tprod:hover{background:#f8fafc}
.tprod-rk{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
.tprod-rk.r1{background:linear-gradient(135deg,#fbbf24,#f59e0b)}
.tprod-rk.r2{background:linear-gradient(135deg,#cbd5e1,#94a3b8)}
.tprod-rk.r3{background:linear-gradient(135deg,#fb923c,#ea580c)}
.tprod-rk.r4,.tprod-rk.r5{background:#e2e8f0;color:#64748b}
.tprod-bd{flex:1;min-width:0}
.tprod-nm{font-size:12.5px;font-weight:500;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tprod-meta{font-size:10.5px;color:#94a3b8}
.tprod-pr{font-size:12px;font-weight:600;color:#0f172a;flex-shrink:0}
/* team */
.tmem{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;transition:background .15s;border-bottom:1px solid #f1f5f9}
.tmem:last-child{border-bottom:none}
.tmem:hover{background:#f8fafc}
.tmem-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;flex-shrink:0}
.tmem-bd{flex:1;min-width:0}
.tmem-nm{font-size:12.5px;font-weight:500;color:#0f172a}
.tmem-meta{font-size:10.5px;color:#94a3b8}
.tmem-amt{font-size:12px;font-weight:700;color:#0f172a;flex-shrink:0}
/* responsive */
@media(max-width:1100px){.row4{grid-template-columns:repeat(2,1fr)}.row2,.row2b{grid-template-columns:1fr}.row3{grid-template-columns:1fr}}
@media(max-width:600px){.row4{grid-template-columns:1fr}}
</style>
