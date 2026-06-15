# 企业级智能销售平台 (CRM) — 开发规格文档 v2.0

> 基于开源 CRM 系统完整重构，Node.js + SQLite + Vue 3 全栈实现。
> 覆盖"线索→客户→商机→报价→订单→发货→收款"全流程，并扩展大学生专属 CRM 功能。

---

## 目录

1. [系统概述](#1-系统概述)
2. [当前技术架构](#2-当前技术架构)
3. [启动运行](#3-启动运行)
4. [数据库设计](#4-数据库设计)
5. [模块功能规格](#5-模块功能规格)
6. [API 接口规范](#6-api-接口规范)
7. [前端页面规格](#7-前端页面规格)
8. [UI 设计系统](#8-ui-设计系统)
9. [大学生 CRM 扩展](#9-大学生-crm-扩展)
10. [AI 智能化与消遣模块](#10-ai-智能化与消遣模块)
11. [当前数据概况](#11-当前数据概况)

---

## 1. 系统概述

### 1.1 业务闭环

```
线索 → 客户 → 联系人 → 商机 → 报价 → 订单 → 发货 → 发票 → 收款
  ↓       ↓                          ↓
跟进    标签/RFM                  售后服务/工单
  ↓                                ↓
AI辅助 ←──────────── 数据分析 ←──────┘
```

### 1.2 功能域

| 域 | 包含模块 |
|----|----------|
| **基础 CRM** | 客户、线索、商机、报价、订单、跟进、产品、联系人、会员 |
| **营销运营** | 营销活动、优惠券、市场活动、校园活动、营销模板 |
| **协同办公** | 公告、站内信、文档、审批、日程、任务 |
| **数据分析** | 仪表盘、业绩排行、RFM 分析、销售预测、学生分析 |
| **学生 CRM** | 学生画像、智能标签、RFM 分层、付费会员、工单、流失预警 |
| **系统管理** | 用户、团队、字典、配置 |
| **AI 智能** | 流失预警、销售预测、商品推荐、文案生成、AI 助手 |
| **消遣模块** | 摸鱼抽屉、电子宠物、捏泡泡、番茄钟、涂鸦板 |

---

## 2. 当前技术架构

| 层级 | 技术 | 说明 |
|------|------|------|
| **后端** | Node.js + Express | 单文件 `src/server.js`，800+ 行 |
| **数据库** | SQLite (better-sqlite3) | 本地文件 `data/crm.db`，持久化 |
| **认证** | JWT (jsonwebtoken) | Token 24h 有效期 |
| **前端** | Vue 3 + Vite | Element Plus 组件库 |
| **状态管理** | Pinia | 轻量级状态 |
| **路由** | Vue Router 4 | History 模式 |
| **图表** | ECharts 5 | 仪表盘/分析图表 |
| **端口** | 后端 8081 / 前端 3002 | |

### 项目结构

```
project/
├── crm-server/              # Node.js 后端
│   ├── src/server.js         # 单一入口，全部 API
│   ├── data/crm.db           # SQLite 数据库
│   └── package.json
├── original-crm/crm-frontend/ # Vue 3 前端
│   ├── src/
│   │   ├── api/              # API 接口层 (12 文件)
│   │   ├── views/            # 页面视图 (36+ 文件)
│   │   ├── components/       # 组件
│   │   │   ├── layout/       # 布局
│   │   │   ├── ai/           # AI 助手
│   │   │   └── relax/        # 消遣模块
│   │   ├── router/           # 路由配置
│   │   ├── styles/           # 设计系统(design-tokens.css + global.css)
│   │   └── utils/            # 工具
│   └── dist/                 # 构建产物
├── start-crm.bat             # 一键启动脚本
└── CRM系统开发规格文档.md
```

---

## 3. 启动运行

### 一键启动
```batch
双击 start-crm.bat
```
自动清理端口 → 启动后端(8081) → 构建前端 → 启动预览(3002) → 打开浏览器

### 手动启动
```batch
:: 终端1 - 后端
cd crm-server
node src/server.js

:: 终端2 - 前端
cd original-crm\crm-frontend
npx vite build
npx vite preview --port 3002
```

**访问**: http://localhost:3002 | **登录**: admin / admin123

---

## 4. 数据库设计

### 4.1 表分类统计（共 60+ 张表）

| 类别 | 数量 | 示例 |
|------|------|------|
| 核心业务表 | 15 | customer, crm_lead, crm_opportunity, sales_order, crm_product... |
| 营销表 | 6 | marketing_campaign, coupon, coupon_record, crm_marketing_activity... |
| 协同表 | 10 | crm_notice, crm_internal_mail, crm_document, crm_schedule, crm_task... |
| 系统表 | 5 | sys_user, sys_config, sys_dict_type, sys_dict_data, crm_sales_team... |
| 学生 CRM 表 | 20 | crm_student_profile, crm_customer_tag, crm_rfm_score, crm_member_tier, crm_paid_membership, crm_point_record_ext, crm_marketing_template, crm_campus_campaign, crm_auto_workflow, crm_service_ticket_ext, crm_return_request, crm_customer_care, crm_ai_recommendation, crm_churn_prediction, crm_ai_copy_template, crm_sales_forecast_ext, crm_campus_cluster... |

### 4.2 通用字段规范
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP

---

## 5. 模块功能规格

### 5.1 基础 CRM（已实现 29 个功能模块）

| 模块 | API | 前端页面 | 数据量 |
|------|-----|----------|--------|
| 客户管理 | 8 端点 | 卡片+表格双模式 | 20 条 |
| 线索管理 | 10 端点 | 我的线索/公海池 | 5 条 |
| 商机管理 | 12 端点 | 阶段流转+漏斗 | 5 条 |
| 报价管理 | 9 端点 | CRUD+审批转订单 | 4 条 |
| 订单管理 | 4 端点 | 列表+详情 | 27 条 |
| 产品管理 | 8 端点 | 28 款名创优品风格产品 | 28 条 |
| 营销活动 | 6 端点 | 活动+优惠券 | 3 场活动 |
| 会员管理 | 5 端点 | 积分+等级 | 14 位 |
| 业绩排行 | 2 端点 | 按月统计 | 多月数据 |
| 联系人 | 5 端点 | CRUD | — |
| 日程/任务 | 12 端点 | 日历+列表 | — |
| 公告/站内信 | 10 端点 | 收件箱 | — |
| 审批 | 7 端点 | 流程管理 | — |
| 字典/配置 | 7 端点 | 系统配置 | — |
| AI 智能 | 9 端点 | 流失预警/预测/推荐 | — |

### 5.2 大学生 CRM 扩展（已实现）

| 模块 | 核心功能 |
|------|----------|
| **学生画像** | 年级、专业类别、生活费区间、校区、宿舍、学生认证 |
| **智能标签** | 8 种自动标签（消费行为/生命周期/渠道偏好/价格敏感） |
| **RFM 分层** | 核心价值/潜力/一般/流失风险四级分层 |
| **付费会员** | 青铜/白银/黄金/钻石四级，月卡/季卡/年卡套餐 |
| **积分扩展** | 签到/评价/分享/邀请/转赠等多途径积分 |
| **校园活动** | 开学季/社团合作/校园大使/毕业季活动管理 |
| **营销模板** | 预置满减/第二件半价/限时闪购模板 |
| **自动化工作流** | 新客欢迎/沉睡唤醒/生日关怀三条预设流程 |
| **服务工单** | 含产品批次/型号/渠道的工单系统 |
| **退换货** | 线上申请/门店自提/进度追踪 |
| **流失预警** | 基于消费间隔自动评分 |
| **AI 推荐** | 基于浏览/购买历史的个性化商品推荐 |

---

## 6. API 接口规范

### 6.1 通用规范
- 基础路径: `/api`
- 响应格式: `{ code: 200, message: "success", data: {...} }`
- 分页格式: `{ total, current, size, records }`
- 认证方式: `Authorization: Bearer <jwt_token>`

### 6.2 核心 API 端点（30+ 控制器，200+ 端点）

| 模块 | 基础路径 | 主要端点 |
|------|----------|----------|
| 认证 | `/api/auth` | POST /login |
| 客户 | `/api/customers` | GET /, GET /:id, POST, PUT, DELETE, GET /pool, POST /:id/claim |
| 线索 | `/api/leads` | GET /list, GET /:id, POST, PUT, DELETE, POST /convert/:id, POST /follow, PUT /assign, GET /pool |
| 商机 | `/api/opportunities` | GET /list, GET /:id, POST, PUT /:id/stage, POST /team, GET /funnel |
| 报价 | `/api/quotations` | GET /list, GET /:id, POST, POST /:id/submit, POST /:id/approve, POST /:id/reject, POST /:id/convert-to-order |
| 产品 | `/api/products` | GET /list, GET /:id, POST, PUT, DELETE |
| 订单 | `/api/orders` | GET, POST, GET /:id |
| 跟进 | `/api/follow-ups` | GET, POST, PUT /:id |
| 营销 | `/api/campaigns` | GET, POST, PUT, DELETE, GET /:id/coupons, POST /:id/coupons, POST /:id/distribute |
| 优惠券 | `/api/coupons` | GET, GET /coupon-records, PUT /coupon-records/:id/use |
| 会员 | `/api/members` | GET, POST /register, PUT /:id/points, GET /:id/profile |
| AI | `/api/ai` | GET /churn-prediction, GET /sales-forecast, GET /rfm-analysis, GET /today-priority, POST /agent/command, POST /marketing-copy |
| 分析 | `/api` | GET /dashboard/stats, GET /analytics/sales-trend, GET /opportunities/funnel |
| 学生 | `/api/student-profiles` | GET /:customerId, POST |
| 标签 | `/api/customer-tags` | GET, GET /:customerId, POST /assign, DELETE /:customerId/:tagId |
| RFM | `/api/rfm-scores` | GET, GET /:customerId, POST /recalculate |
| 会员等级 | `/api/member-tiers` | GET |
| 付费会员 | `/api/paid-memberships` | GET /:customerId, POST |
| 积分扩展 | `/api/points-records` | GET /:customerId, POST, POST /transfer |
| 营销模板 | `/api/marketing-templates` | GET, POST |
| 校园活动 | `/api/campus-campaigns` | GET, POST |
| 自动化 | `/api/auto-workflows` | GET |
| 工单 | `/api/service-tickets-ext` | GET /list, GET /:id, POST, PUT /:id |
| 退换货 | `/api/return-requests` | GET, POST, PUT /:id |
| 客户关怀 | `/api/customer-care` | GET /:customerId, POST |
| AI推荐 | `/api/ai-recommendations` | GET /:customerId |
| 流失预警 | `/api/churn-predictions` | GET, POST /recalculate |
| AI文案 | `/api/ai-copy-templates` | GET |
| 学生分析 | `/api/analytics/student-dashboard` | GET |

---

## 7. 前端页面规格

### 7.1 路由总表（40+ 路由）

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 渐变背景+毛玻璃卡片 |
| `/dashboard` | 仪表盘 | 6 卡片+图表+消遣组件 |
| `/customers` | 客户列表 | 卡片/表格双模式 |
| `/pool` | 公海池 | 未认领客户 |
| `/leads` | 线索管理 | 卡片布局+Tab切换 |
| `/opportunities` | 商机管理 | 阶段流转 |
| `/quotations` | 报价管理 | CRUD+审批 |
| `/orders` | 订单管理 | 列表 |
| `/follow-ups` | 跟进记录 | 列表 |
| `/campaigns` | 营销活动 | 活动列表 |
| `/coupons` | 优惠券 | 管理页 |
| `/activities` | 市场活动 | 活动分析 |
| `/members` | 会员管理 | 积分/等级 |
| `/products` | 产品管理 | 28 款产品 |
| `/service` | 服务管理 | 工单 |
| `/performance` | 业绩排行 | 按月统计 |
| `/rfm-analysis` | RFM 分析 | ECharts 图表 |
| `/sales-forecast` | 销售预测 | 趋势图 |
| `/student-dashboard` | 学生分析 🎓 | 综合仪表盘 |
| `/schedule` | 日程任务 | 日历 |
| `/notices` | 公告通知 | 列表 |
| `/mails` | 站内信 | 收件箱 |
| `/documents` | 文档管理 | 上传/下载 |
| `/approvals` | 审批管理 | 审批流 |
| `/dict` | 数据字典 | 类型/数据 |
| `/sys-config` | 系统配置 | Key-Value |
| `/sales-teams` | 销售团队 | 成员管理 |
| `/todos` | 待办任务 | 任务列表 |

---

## 8. UI 设计系统

### 8.1 色彩方案

| 用途 | 颜色 | 色值 |
|------|------|------|
| 主色 | 专业蓝 | `#2563EB` |
| 强调 | 暖橙黄 | `#F59E0B` |
| 成功 | 翠绿 | `#10B981` |
| 危险 | 红 | `#EF4444` |
| 背景 | 浅灰蓝 | `#F1F5F9` |
| 卡片 | 白 | `#FFFFFF` |
| 侧边栏 | 深蓝 | `#1E293B` |
| 文字主 | 深灰 | `#0F172A` |
| 文字辅 | 中灰 | `#64748B` |

### 8.2 组件规范

- **按钮**: 圆角 10px，高度 38px，悬停上浮阴影
- **卡片**: 圆角 14px，边框 `#E2E8F0`，悬停上浮 3px
- **表格**: 表头 `#F8FAFC`，行悬停 `#EFF6FF`
- **输入框**: 圆角 10px，聚焦蓝色光环
- **标签**: 胶囊形圆角 20px，柔和色背景
- **对话框**: 圆角 20px，大阴影

### 8.3 设计文件

- `src/styles/design-tokens.css` — CSS 变量体系
- `src/styles/global.css` — Element Plus 深度覆盖

---

## 9. 大学生 CRM 扩展

### 9.1 新增数据库表（20 张）

| 表名 | 对应功能 |
|------|----------|
| `crm_student_profile` | 学生画像（年级/专业/生活费/校区/宿舍） |
| `crm_customer_tag` | 智能标签定义 |
| `crm_customer_tag_rel` | 标签-客户关联 |
| `crm_rfm_score` | RFM 评分分层 |
| `crm_member_tier` | 会员等级配置 |
| `crm_paid_membership` | 付费会员记录 |
| `crm_point_record_ext` | 积分扩展记录 |
| `crm_marketing_template` | 营销活动模板 |
| `crm_campus_campaign` | 校园活动 |
| `crm_auto_workflow` | 自动化工作流 |
| `crm_service_ticket_ext` | 扩展服务工单 |
| `crm_return_request` | 退换货申请 |
| `crm_customer_care` | 客户关怀记录 |
| `crm_ai_recommendation` | AI 推荐记录 |
| `crm_churn_prediction` | 流失预警 |
| `crm_ai_copy_template` | AI 文案模板 |
| `crm_sales_forecast_ext` | 销售预测扩展 |
| `crm_campus_cluster` | 校区商圈集群 |

### 9.2 侧边栏入口

侧边栏新增 **🎓 学生CRM** 分组，含 8 个子菜单项，全部指向综合学生分析仪表盘。

---

## 10. AI 智能化与消遣模块

### 10.1 AI 能力

| 能力 | API | 说明 |
|------|-----|------|
| 客户流失预警 | GET/POST /churn-prediction | 基于消费间隔评分 |
| 销售预测 | GET /ai/sales-forecast | 历史趋势+未来预测 |
| RFM 分析 | GET /ai/rfm-analysis | 客户细分 |
| 今日优先跟进 | GET /ai/today-priority | Top5 推荐 |
| AI 助手对话 | POST /ai/agent/command | 自然语言交互 |
| 营销文案生成 | POST /ai/marketing-copy | 多风格文案 |
| 商品推荐 | GET /ai-recommendations/:id | 个性化推荐 |

### 10.2 消遣模块

| 模块 | 入口 | 说明 |
|------|------|------|
| 摸鱼抽屉 | 侧边栏 🎈 | 笑话/毒鸡汤/冷知识轮播 |
| 电子宠物 | 右下角悬浮 | 可拖拽、投喂、右键隐藏 |
| 捏泡泡 | 顶栏 🫧 | 80 个泡泡点击消除 |
| 番茄钟 | 仪表盘 | 25+5 分钟、白噪音、呼吸引导 |
| 涂鸦板 | 仪表盘 | 7 色画笔、保存画廊 |

---

## 11. 当前数据概况

| 表 | 数据量 |
|----|--------|
| 用户 | 4 位（admin + 3 员工） |
| 客户 | 20 位 |
| 学生画像 | 16 位（大一~研二） |
| 产品 | 28 款（名创优品风格） |
| 订单 | 27 笔 |
| 线索 | 5 条 |
| 商机 | 5 个 |
| 报价 | 4 条 |
| 跟进记录 | 8 条 |
| 营销活动 | 3 场 |
| 优惠券 | 3 种 |
| 会员 | 14 位 |
| 智能标签 | 8 种 |
| RFM 评分 | 20 条 |
| 流失预警 | 20 条 |
| 校园活动 | 3 场 |
| 服务工单 | 5 条 |
| 自动化工作流 | 3 条 |
| 营销模板 | 3 个 |
| 校区集群 | 2 个 |

---

> 文档版本：v2.0 | 更新日期：2026-05-31 | 基于 Node.js + Vue 3 全栈实现
