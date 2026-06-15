# INTEGRATION_GUIDE.md — CRM 系统集成与开发指南

> 面向二次开发、系统集成、部署运维的完整参考文档。

---

## 目录

1. [快速开始](#1-快速开始)
2. [系统架构](#2-系统架构)
3. [后端 API 接入](#3-后端-api-接入)
4. [前端开发指南](#4-前端开发指南)
5. [数据库扩展](#5-数据库扩展)
6. [添加新模块](#6-添加新模块)
7. [UI 主题定制](#7-ui-主题定制)
8. [AI 能力接入](#8-ai-能力接入)
9. [部署建议](#9-部署建议)

---

## 1. 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 启动步骤

```bash
# 1. 安装后端依赖
cd crm-server && npm install

# 2. 安装前端依赖
cd ../original-crm/crm-frontend && npm install

# 3. 启动后端 (端口 8081)
cd ../../crm-server && node src/server.js

# 4. 构建前端
cd ../original-crm/crm-frontend && npx vite build

# 5. 启动前端预览 (端口 3002)
npx vite preview --port 3002
```

或双击项目根目录 `start-crm.bat` 一键启动。

### 默认账号
- 用户名: `admin`
- 密码: `admin123`

---

## 2. 系统架构

```
┌─────────────────────────────────────────────┐
│  浏览器 (http://localhost:3002)              │
│  Vue 3 + Element Plus + ECharts             │
│  Vite Preview 静态服务                       │
└──────────────┬──────────────────────────────┘
               │ HTTP (Axios)
               │ baseURL: http://localhost:8081/api
               ▼
┌─────────────────────────────────────────────┐
│  Node.js Express Server (localhost:8081)     │
│  JWT 认证中间件                              │
│  30+ API 模块 · 200+ 端点                    │
└──────────────┬──────────────────────────────┘
               │ better-sqlite3
               ▼
┌─────────────────────────────────────────────┐
│  SQLite 数据库 (data/crm.db)                 │
│  60+ 张表 · WAL 模式                         │
└─────────────────────────────────────────────┘
```

### 关键文件

| 文件 | 说明 |
|------|------|
| `crm-server/src/server.js` | 后端全部逻辑（路由+数据库+种子数据） |
| `crm-server/data/crm.db` | SQLite 数据库文件 |
| `original-crm/crm-frontend/src/api/index.js` | Axios 实例 + API 对象 |
| `original-crm/crm-frontend/src/router/index.js` | 路由配置 |
| `original-crm/crm-frontend/src/components/layout/LayoutV2.vue` | 全局布局 |
| `original-crm/crm-frontend/src/styles/design-tokens.css` | CSS 变量 |
| `original-crm/crm-frontend/src/styles/global.css` | Element Plus 覆盖 |
| `start-crm.bat` | 一键启动脚本 |

---

## 3. 后端 API 接入

### 3.1 认证流程

```
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "code": 200, "data": { "token": "eyJ...", "realName": "管理员", "role": "ADMIN" } }
```

后续请求携带 `Authorization: Bearer <token>` 头。

### 3.2 通用响应格式

```json
// 成功
{ "code": 200, "message": "success", "data": { ... } }

// 分页
{ "code": 200, "data": { "total": 100, "current": 1, "size": 20, "records": [...] } }

// 失败
{ "code": 500, "message": "错误信息" }
```

### 3.3 前端 HTTP 客户端的 Axios 拦截器

```js
// src/utils/request.js
// 响应拦截器已配置自动展开 data 层
// 调用方直接获取业务数据，无需 .data
const res = await request.get('/customers')
// res = { total: 20, records: [...] }
```

### 3.4 添加新 API

在 `crm-server/src/server.js` 中添加：

```js
// 模式 1: 简单 CRUD
app.get('/api/items/list', auth, (req, res) => {
  const { page, size, offset } = paginate(req)
  const records = db.prepare('SELECT * FROM items LIMIT ? OFFSET ?').all(size, offset)
  res.json(ok(page(records.length, page, size, records)))
})

// 模式 2: POST 创建
app.post('/api/items', auth, (req, res) => {
  db.prepare('INSERT INTO items(name,value) VALUES (?,?)').run(req.body.name, req.body.value)
  res.json(ok(null))
})
```

---

## 4. 前端开发指南

### 4.1 添加新页面

**Step 1**: 创建 Vue 组件 `src/views/new-feature/NewPage.vue`

```vue
<template>
  <div class="crm-page-wrap">
    <div class="crm-page-hd">
      <div class="crm-page-tit">新功能</div>
    </div>
    <div class="crm-search-bar">...</div>
    <el-card>...</el-card>
  </div>
</template>
<script setup>
import request from '@/utils/request'
import { ref, onMounted } from 'vue'
const data = ref([])
onMounted(async () => { data.value = (await request.get('/items/list'))?.records || [] })
</script>
```

**Step 2**: 挂载路由 `src/router/index.js`

```js
const NewPage = () => import('@/views/new-feature/NewPage.vue')
// 在 routes 中添加
{ path: 'new-feature', name: 'NewPage', component: NewPage, meta: { title: '新功能' } }
```

**Step 3**: 添加侧边栏菜单 `src/components/layout/LayoutV2.vue`

```html
<el-menu-item index="/new-feature"><el-icon><IconName /></el-icon><span>新功能</span></el-menu-item>
```

### 4.2 使用通用工具类

| 类名 | 用途 |
|------|------|
| `.crm-page-wrap` | 页面外层容器 |
| `.crm-page-hd` | 页头（标题+操作按钮） |
| `.crm-page-tit` | 页面大标题 |
| `.crm-page-sub` | 页面副标题 |
| `.crm-search-bar` | 搜索栏容器 |
| `.crm-card` | 标准卡片 |
| `.crm-widget` | 仪表盘小部件 |

### 4.3 API 调用规范

```js
import request from '@/utils/request'

// GET 分页
const res = await request.get('/customers?page=1&size=20')
const records = res.records   // 直接数组
const total = res.total       // 总数

// POST 创建
await request.post('/customers', { name: '新客户', phone: '13800138000' })

// PUT 更新
await request.put('/customers/1', { name: '更新后' })

// DELETE
await request.delete('/customers/1')
```

---

## 5. 数据库扩展

### 5.1 添加新表

在 `crm-server/src/server.js` 的 DDL 区域添加（Seed Data 之前）：

```js
db.exec(`
  CREATE TABLE IF NOT EXISTS my_new_table(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

### 5.2 添加种子数据

在 `if (userCount.c === 0)` 块中添加：

```js
if (db.prepare('SELECT COUNT(*) as c FROM my_new_table').get().c === 0) {
  db.prepare('INSERT INTO my_new_table(name) VALUES (?)').run('示例数据');
}
```

### 5.3 SQLite 注意事项

- 字符串必须用单引号: `WHERE status='待办'` ❌ 不能用双引号
- 字段名不用引号或用反引号（MySQL 兼容模式）
- 删除 `data/crm.db` 后重启即可重新初始化全部数据

---

## 6. 添加新模块

### 完整流程

```
1. 数据库 → server.js DDL 区域添加 CREATE TABLE
2. 种子数据 → 添加初始 INSERT
3. API 路由 → 添加 app.get/post/put/delete 路由
4. 前端页面 → src/views/ 创建 .vue 文件
5. 前端 API → src/api/ 创建接口层（可选，也可直接用 request）
6. 路由注册 → src/router/index.js 添加路由
7. 侧边栏 → LayoutV2.vue 添加菜单项
8. 构建测试 → npm run build
```

### 示例：添加"积分商城"模块

```js
// 1. server.js - DDL
CREATE TABLE IF NOT EXISTS crm_point_mall(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,points_price INTEGER,stock INTEGER);

// 2. server.js - 种子
db.prepare('INSERT INTO crm_point_mall(name,points_price,stock) VALUES (?,?,?)').run('贴纸套装',100,50);

// 3. server.js - API
app.get('/api/point-mall', auth, (req, res) => res.json(ok(db.prepare('SELECT * FROM crm_point_mall').all())));

// 4. PointMall.vue - 前端页面
// 5. router/index.js - 添加路由
// 6. LayoutV2.vue - 侧边栏菜单
```

---

## 7. UI 主题定制

### 7.1 修改颜色

编辑 `src/styles/design-tokens.css` 的 `:root` 块：

```css
:root {
  --crm-primary: #2563EB;      /* 主色调 */
  --crm-accent: #F59E0B;       /* 强调色 */
  --crm-bg-page: #F1F5F9;      /* 页面背景 */
  --crm-sidebar-bg: #1E293B;   /* 侧边栏背景 */
}
```

### 7.2 修改组件圆角/阴影

编辑 `src/styles/global.css` 中对应组件的覆盖规则。

### 7.3 深色模式

在 `design-tokens.css` 添加 `@media (prefers-color-scheme: dark)` 块覆盖全部变量。

---

## 8. AI 能力接入

当前 AI 模块为 Mock 实现。替换为真实大模型 API：

### 8.1 替换步骤

编辑 `crm-server/src/server.js` 中 AI 相关路由，将 Mock 逻辑替换为 API 调用：

```js
// 示例: 接入 DeepSeek API
app.post('/api/ai/agent/command', auth, async (req, res) => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: req.body.command }]
    })
  });
  const data = await response.json();
  res.json(ok({ reply: data.choices[0].message.content }));
});
```

### 8.2 可接入的 AI 端点

| 端点 | 当前实现 | 替换为 |
|------|----------|--------|
| `/ai/agent/command` | 关键词匹配 | LLM Chat API |
| `/ai/marketing-copy` | 固定文案 | LLM 文案生成 |
| `/ai/sales-forecast` | 随机数 | ML 预测模型 |
| `/ai/rfm-analysis` | 规则评分 | 聚类算法 |
| `/ai/churn-prediction` | 规则评分 | 分类模型 |

---

## 9. 部署建议

### 9.1 生产环境

```bash
# 后端: 使用 PM2
npm install -g pm2
pm2 start crm-server/src/server.js --name crm-backend

# 前端: 使用 Nginx 部署 dist/
cp -r original-crm/crm-frontend/dist /var/www/crm/
# Nginx config:
# root /var/www/crm;
# try_files $uri /index.html;
```

### 9.2 数据库升级

- SQLite 适用于单机部署（< 100GB 数据，< 100 并发）
- 升级到 MySQL/PostgreSQL：替换 better-sqlite3 为 mysql2/pg，修改 SQL 方言
- 备份：直接复制 `data/crm.db` 文件

### 9.3 性能优化

- 前端: 路由懒加载已配置，代码分割已启用
- 后端: 添加 Redis 缓存热点查询
- 数据库: 在 `customer_id`、`owner_id`、`created_at` 等字段建索引

---

> 文档版本：v1.0 | 更新日期：2026-05-31
