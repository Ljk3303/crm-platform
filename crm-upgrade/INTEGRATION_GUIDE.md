# CRM 企业级智能销售平台 - 升级整合指南

> **适用版本**: Spring Boot 3.2.5 + Vue 3 + Element Plus  
> **升级目标**: 零售CRM → 企业级智能销售平台（对标金蝶K3 CRM + AI智能分析）  
> **核心原则**: 完全保留原有功能，仅做加法 —— 不删除、不修改原有代码，只新增模块和扩展字段

---

## 目录

- [一、项目概述](#一项目概述)
- [二、整合步骤总览](#二整合步骤总览)
- [三、数据库升级](#三数据库升级)
- [四、后端代码整合](#四后端代码整合)
- [五、前端代码整合](#五前端代码整合)
- [六、配置更新](#六配置更新)
- [七、启动验证](#七启动验证)
- [八、常见问题排查](#八常见问题排查)
- [九、后续扩展建议](#九后续扩展建议)

---

## 一、项目概述

### 1.1 原项目说明

- **技术栈**: Spring Boot 3.2.5 + Vue 3 + Element Plus
- **定位**: 零售业务客户关系管理（CRM）
- **已有模块**: 客户管理（customer）、销售订单（sales_order）、跟进记录（follow_up）等

### 1.2 升级目标

| 维度 | 原项目 | 升级后 |
|------|--------|--------|
| 定位 | 零售CRM | 企业级智能销售平台 |
| 功能模块 | 3-5个基础模块 | 20+企业级模块 |
| AI能力 | 无 | DeepSeek AI 智能分析 |
| 数据表 | ~10张 | ~52张 |
| 对标产品 | - | 金蝶K3 CRM |

### 1.3 升级策略

**【加法原则】** — 升级过程严格遵循以下准则：

1. **不删除**任何原有文件、代码、配置
2. **不修改**原有业务逻辑（仅新增字段，不改变已有字段含义）
3. **只新增**模块目录、数据表、页面组件
4. **只扩展**已有表的字段（通过 ALTER TABLE ADD COLUMN）
5. 升级失败时可快速回滚（原项目不受影响）

---

## 二、整合步骤总览

整个升级过程分为五个阶段，建议按以下顺序依次执行：

```
第一阶段：数据库升级  ──→  第二阶段：后端代码整合  ──→  第三阶段：前端代码整合
                                                              │
                                                              ▼
第五阶段：启动验证      ←──  第四阶段：配置更新
```

| 阶段 | 内容 | 预计操作时间 | 风险等级 |
|------|------|:---:|:---:|
| 1 | 数据库升级 — 执行 DDL 变更 | 5-10分钟 | **中** |
| 2 | 后端代码整合 — 复制新增模块 | 2-5分钟 | 低 |
| 3 | 前端代码整合 — 合并前端资源 | 2-5分钟 | 低 |
| 4 | 配置更新 — 检查和调整配置 | 1-2分钟 | 低 |
| 5 | 启动验证 — 启动并测试 | 10-15分钟 | 低 |

---

## 三、数据库升级

### 3.1 前置准备：备份数据库

在**执行任何 DDL 变更之前**，务必先备份数据库：

```bash
# 备份整个 crm_db 数据库
mysqldump -u root -p crm_db > crm_db_backup_$(date +%Y%m%d_%H%M%S).sql

# 仅备份表结构（不含数据）
mysqldump -u root -p --no-data crm_db > crm_db_schema_backup.sql
```

> **建议**: 先在测试环境执行，验证通过后再在生产环境操作。

### 3.2 执行 DDL 变更

本阶段涉及两个 SQL 脚本：

| 脚本文件 | 用途 | 风险 |
|----------|------|:---:|
| `sql/01_new_tables.sql` | 创建 42 张新表 | 低（仅 CREATE） |
| `sql/02_alter_existing.sql` | 修改现有 3 张表的字段 | **中**（ALTER TABLE） |

**执行步骤**:

```bash
# 1. 先执行新表创建脚本
mysql -u root -p crm_db < sql/01_new_tables.sql

# 2. 确认无误后，再执行表修改脚本
mysql -u root -p crm_db < sql/02_alter_existing.sql
```

> **回滚方案**: 如果 02_alter_existing.sql 执行失败，使用备份文件恢复：
> ```bash
> mysql -u root -p crm_db < crm_db_backup.sql
> ```

### 3.3 验证 DDL 执行结果

```sql
-- 检查新表是否全部创建成功（应返回 42 行）
SHOW TABLES LIKE 'crm_%';
SHOW TABLES LIKE 'sys_%';

-- 检查已有表的新增字段
DESC customer;
DESC sales_order;
DESC follow_up;
```

**验证清单**:

- [ ] `customer` 表新增了 `industry`, `company_size`, `annual_revenue`, `address`, `website`, `avatar`, `source_detail`, `credit_level`, `merged_to_id`, `protect_days`, `last_follow_at`, `next_follow_at` 等字段
- [ ] `sales_order` 表新增了 `order_no`, `delivery_date`, `shipping_address`, `payment_method`, `discount_amount`, `tax_amount`, `paid_amount`, `invoice_status`, `delivery_status`, `quotation_id`, `approved_by`, `approved_at` 等字段
- [ ] `follow_up` 表新增了 `next_plan_time`, `customer_name`, `satisfaction_score` 字段

### 3.4 新增表清单（42张表）

#### 客户关系模块

| 表名 | 用途 |
|------|------|
| `crm_contact` | 客户联系人信息（部门、职位、决策角色等） |
| `crm_customer_tag` | 客户标签定义（支持多级分类） |
| `crm_customer_tag_rel` | 客户与标签的多对多关联 |
| `crm_customer_share` | 客户共享记录（跨销售协作） |
| `crm_customer_protection` | 客户保护规则（防撞单回收机制） |

#### 市场活动模块

| 表名 | 用途 |
|------|------|
| `crm_marketing_activity` | 市场活动管理（展会/线上推广/线下活动等） |
| `crm_activity_target` | 活动目标客户关联 |
| `crm_activity_expense` | 活动费用记录 |

#### 线索管理模块

| 表名 | 用途 |
|------|------|
| `crm_lead` | 销售线索（来源、状态、评级等） |
| `crm_lead_follow_up` | 线索跟进记录 |

#### 商机管理模块

| 表名 | 用途 |
|------|------|
| `crm_opportunity` | 销售商机（预计金额、成交概率、阶段等） |
| `crm_opportunity_stage_log` | 商机阶段变更日志 |
| `crm_opportunity_team` | 商机协作团队成员 |
| `crm_opportunity_competitor` | 商机竞争对手分析 |

#### 报价管理模块

| 表名 | 用途 |
|------|------|
| `crm_quotation` | 销售报价单 |
| `crm_quotation_item` | 报价单明细行 |
| `crm_quotation_template` | 报价模板 |

#### 产品管理模块

| 表名 | 用途 |
|------|------|
| `crm_product` | 产品库（规格、单位、分类等） |
| `crm_product_price` | 产品价格策略（支持按客户级别定价） |

#### 发货管理模块

| 表名 | 用途 |
|------|------|
| `crm_delivery` | 发货单主表 |
| `crm_delivery_item` | 发货单明细 |

#### 应收管理模块

| 表名 | 用途 |
|------|------|
| `crm_receivable_plan` | 应收款计划 |
| `crm_receivable_record` | 回款记录 |

#### 发票管理模块

| 表名 | 用途 |
|------|------|
| `crm_invoice` | 销售发票 |

#### 售后服务模块

| 表名 | 用途 |
|------|------|
| `crm_service_request` | 服务请求 |
| `crm_service_ticket` | 服务工单 |
| `crm_service_ticket_log` | 工单处理日志 |
| `crm_service_visit` | 现场服务访问记录 |

#### 日程与任务模块

| 表名 | 用途 |
|------|------|
| `crm_schedule` | 日程管理（待办/会议/提醒） |
| `crm_task` | 任务分配与跟踪 |

#### 通知与邮件模块

| 表名 | 用途 |
|------|------|
| `crm_notice` | 系统通知公告 |
| `crm_notice_read` | 通知已读记录 |
| `crm_internal_mail` | 内部邮件/站内信 |

#### 审批流模块

| 表名 | 用途 |
|------|------|
| `crm_approval_flow` | 审批流程定义 |
| `crm_approval_record` | 审批记录（含审批状态链路） |

#### 文档管理模块

| 表名 | 用途 |
|------|------|
| `crm_document` | 知识文档库 |

#### 销售团队模块

| 表名 | 用途 |
|------|------|
| `crm_sales_team` | 销售团队定义 |
| `crm_sales_team_member` | 团队成员归属 |

#### 系统配置模块

| 表名 | 用途 |
|------|------|
| `sys_dict_type` | 字典类型定义 |
| `sys_dict_data` | 字典数据项 |
| `sys_config` | 系统参数配置 |

#### AI 智能分析模块

| 表名 | 用途 |
|------|------|
| `crm_ai_suggestion` | AI 生成的销售建议记录 |

---

## 四、后端代码整合

### 4.1 目录结构映射

升级需要将 `crm-upgrade/backend-src/` 下的代码合并到原有项目 `original-crm/crm-backend/` 中。目录映射关系如下：

```
crm-upgrade/backend-src/                          →  original-crm/crm-backend/
└── src/main/java/com/crm/module/                 →  src/main/java/com/crm/module/
    ├── ai/              (AI Mock 接口)             →   ai/
    ├── contact/         (联系人管理)                →   contact/
    ├── lead/            (线索管理)                  →   lead/
    ├── opportunity/     (商机管理)                  →   opportunity/
    ├── quotation/       (报价管理)                  →   quotation/
    ├── product/         (产品管理)                  →   product/
    ├── delivery/        (发货管理)                  →   delivery/
    ├── receivable/      (应收管理)                  →   receivable/
    ├── invoice/         (发票管理)                  →   invoice/
    ├── service/         (售后服务)                  →   service/
    ├── schedule/        (日程管理)                  →   schedule/
    ├── notice/          (通知管理)                  →   notice/
    ├── approval/        (审批流)                    →   approval/
    ├── document/        (文档管理)                  →   document/
    ├── salesteam/       (销售团队)                  →   salesteam/
    ├── dict/            (数据字典)                  →   dict/
    ├── config/          (系统配置)                  →   config/
    ├── analytics/       (数据分析)                  →   analytics/
    ├── tag/             (客户标签)                  →   tag/
    ├── share/           (客户共享)                  →   share/
    └── activity/        (市场活动)                  →   activity/
```

每个模块内包含标准的分层结构：

```
module-name/
├── controller/   # REST API 控制器
├── service/      # 业务逻辑层（实现 ServiceImpl）
├── mapper/       # MyBatis Mapper 接口
└── entity/       # 数据库实体类
```

### 4.2 复制步骤

```bash
# 方式一：使用命令行合并（推荐，Git Bash 环境）
cp -r crm-upgrade/backend-src/src/main/java/com/crm/module/* \
     original-crm/crm-backend/src/main/java/com/crm/module/

# 方式二：使用 Windows 资源管理器
# 将 crm-upgrade/backend-src/src/main/java/com/crm/module/ 下所有子文件夹
# 拖拽到 original-crm/crm-backend/src/main/java/com/crm/module/
```

> **注意**: 复制操作不会覆盖 any 已有文件（因为新模块使用独立目录），原项目的 module 目录下已有的模块不会受影响。

### 4.3 新增 Controller 接口路径

升级后新增的 REST API 接口路径如下：

| Controller | 路径前缀 | 模块 | 说明 |
|------------|----------|------|------|
| `AiMockController` | `/api/ai` | AI 智能分析 | AI 销售建议、客户画像分析等（Mock 实现） |
| `ContactController` | `/api/contacts` | 联系人 | 客户联系人 CRUD |
| `DictController` | `/api/dict` | 数据字典 | 字典类型与数据的查询 |
| `ProductController` | `/api/products` | 产品管理 | 产品库维护 |
| *(其余 Controller)* | `/api/{module}` | 其他模块 | 遵循统一规范 `/api/{模块名}` |

### 4.4 包扫描确认

主启动类 `CrmApplication.java` 中的 Mapper 扫描注解已覆盖所有新模块：

```java
@MapperScan("com.crm.module.*.mapper")
```

此配置使用通配符 `*` 匹配所有模块名，因此无需修改主类即可自动发现所有新增的 Mapper 接口。

### 4.5 依赖确认

本次升级使用的依赖均为 Spring Boot 3.x 生态已有依赖，**无需在 pom.xml 中添加新的 Maven 依赖**：

| 依赖 | 用途 | 说明 |
|------|------|------|
| `spring-boot-starter-web` | Web 框架 | 已有 |
| `spring-boot-starter-validation` | 参数校验 | 已有 |
| `mybatis-spring-boot-starter` | MyBatis ORM | 已有 |
| `mysql-connector-j` | MySQL 驱动 | 已有 |
| `lombok` | 代码生成 | 已有 |

> **确认清单**:
> - [ ] `pom.xml` 中已有上述依赖
> - [ ] `application.yml` 中数据库连接配置正确
> - [ ] MyBatis 配置中 `mapper-locations` 指向正确的 XML 路径

---

## 五、前端代码整合

### 5.1 目录结构

升级需要将 `crm-upgrade/frontend-src/src/` 下的内容合并到原有项目 `original-crm/crm-frontend/src/` 中：

```
crm-upgrade/frontend-src/src/
├── api/                          # API 请求封装
│   ├── index.js                  # API 配置与拦截器（需合并）
│   ├── ai.js                     # AI 接口
│   ├── customer.js               # 客户接口（已有 + 扩展）
│   ├── lead.js                   # 线索接口
│   └── opportunity.js            # 商机接口
├── components/                   # 公共组件
│   ├── ai/AiAssistant.vue        # AI 助手侧边栏组件
│   ├── crm/                      # CRM 通用业务组件
│   └── layout/LayoutV2.vue       # 新版布局组件（企业级导航）
├── router/index.js               # 路由配置（需替换）
├── stores/                       # Pinia 全局状态管理
├── types/                        # TypeScript 类型定义
├── utils/                        # 工具函数
└── views/                        # 页面视图
    ├── dashboard/                # 仪表盘（数据概览大屏）
    ├── lead/                     # 线索管理
    ├── opportunity/              # 商机管理
    ├── quotation/                # 报价管理
    ├── product/                  # 产品管理
    ├── service/                  # 售后服务
    ├── marketing-activity/       # 市场活动
    ├── schedule/                 # 日程与任务
    ├── collaboration/            # 团队协作
    ├── system/                   # 系统管理（字典/配置）
    └── analytics/                # 数据分析报表
```

### 5.2 复制步骤

**推荐使用手动合并方式**，逐目录确认：

```bash
# 1. 合并 api 目录
cp -r crm-upgrade/frontend-src/src/api/* original-crm/crm-frontend/src/api/

# 2. 合并 components 目录
cp -r crm-upgrade/frontend-src/src/components/* original-crm/crm-frontend/src/components/

# 3. 合并 views 目录
cp -r crm-upgrade/frontend-src/src/views/* original-crm/crm-frontend/src/views/

# 4. 合并 stores / types / utils 目录
cp -r crm-upgrade/frontend-src/src/stores/* original-crm/crm-frontend/src/stores/
cp -r crm-upgrade/frontend-src/src/types/* original-crm/crm-frontend/src/types/
cp -r crm-upgrade/frontend-src/src/utils/* original-crm/crm-frontend/src/utils/

# 5. 替换 router/index.js（已包含所有原有路由 + 新路由）
cp crm-upgrade/frontend-src/src/router/index.js original-crm/crm-frontend/src/router/index.js
```

### 5.3 路由配置说明

升级版 `router/index.js` 包含以下路由结构：

```
/ (根路径)
├── /login                          # 登录页（保持原样）
├── /dashboard                      # 主页仪表盘（新增企业级大屏）
├── /customer                       # 客户管理（原有，字段扩展）
├── /customer/:id                   # 客户详情（原有，新增更多子标签页）
├── /contact                        # 联系人管理（新增）
├── /lead                           # 线索管理（新增）
├── /opportunity                    # 商机管理（新增）
├── /quotation                      # 报价管理（新增）
├── /product                        # 产品管理（新增）
├── /sales-order                    # 销售订单（原有，字段扩展）
├── /delivery                       # 发货管理（新增）
├── /receivable                     # 应收管理（新增）
├── /invoice                        # 发票管理（新增）
├── /service                        # 售后服务（新增）
├── /marketing-activity             # 市场活动（新增）
├── /schedule                       # 日程管理（新增）
├── /notice                         # 通知公告（新增）
├── /approval                       # 审批管理（新增）
├── /document                       # 文档管理（新增）
├── /collaboration                  # 团队协作（新增）
├── /analytics                      # 数据分析（新增）
└── /system                         # 系统管理（新增）
    ├── /system/dict                # 字典管理
    ├── /system/config              # 参数配置
    └── /system/team                # 销售团队管理
```

### 5.4 依赖确认

检查 `package.json` 确保以下依赖已安装：

| 依赖 | 版本要求 | 用途 | 状态 |
|------|----------|------|:---:|
| `vue` | ^3.4.x | 前端框架 | 已有 |
| `vue-router` | ^4.x | 路由管理 | 已有 |
| `pinia` | ^2.x | 状态管理 | 已有 |
| `element-plus` | ^2.x | UI 组件库 | 已有 |
| `@element-plus/icons-vue` | ^2.x | Element Plus 图标 | 已有 |
| `echarts` | ^5.x | 数据可视化图表 | 已有 |
| `axios` | ^1.x | HTTP 请求 | 已有 |
| `dayjs` | ^1.x | 日期处理 | 已有 |

> **本次升级主要使用 Element Plus**，无需安装 Ant Design Vue。

如果依赖有缺失，使用以下命令安装：

```bash
cd original-crm/crm-frontend
npm install
```

### 5.5 入口文件更新

`main.js` 中需确保导入了新版布局组件：

```javascript
// main.js 关键更新点

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// 导入新版企业级布局组件
import LayoutV2 from '@/components/layout/LayoutV2.vue'
import AiAssistant from '@/components/ai/AiAssistant.vue'

const app = createApp(App)

app.use(ElementPlus)
app.use(createPinia())
app.use(router)

// 注册全局组件
app.component('LayoutV2', LayoutV2)
app.component('AiAssistant', AiAssistant)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
```

---

## 六、配置更新

### 6.1 后端配置

**`application.yml`** — 基本无需修改，除非数据库连接信息有变化：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/crm_db?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver

mybatis:
  mapper-locations: classpath:mapper/**/*.xml
  type-aliases-package: com.crm.module
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

server:
  port: 8080
```

**确认清单**:
- [ ] 数据库连接地址、用户名、密码正确
- [ ] `mybatis.type-aliases-package` 指向 `com.crm.module`
- [ ] `server.port` 为 8080（与前端代理一致）

### 6.2 前端配置

**`vite.config.js`** — 确保代理正确指向后端：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // 后端 Spring Boot 地址
        changeOrigin: true
      }
    }
  }
})
```

**`.env` / `.env.development`** — API 基础 URL：

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=CRM企业级智能销售平台
```

---

## 七、启动验证

### 7.1 启动后端

```bash
# 进入原项目后端目录
cd original-crm/crm-backend

# 编译并启动 Spring Boot 应用
mvn spring-boot:run

# 或者先打包再运行
mvn clean package -DskipTests
java -jar target/crm-backend-*.jar
```

**启动成功标志**:
- 控制台输出 `Started CrmApplication in X.XXX seconds`
- 无 ERROR 级别日志（Mapper 找不到、表不存在等）
- 访问 `http://localhost:8080/api/ai/suggest` 应返回 Mock 数据

### 7.2 启动前端

```bash
# 进入原项目前端目录
cd original-crm/crm-frontend

# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev
```

**启动成功标志**:
- 控制台输出 Vite 开发服务器地址（默认 `http://localhost:5173`）
- 无编译错误
- 浏览器访问显示登录页面

### 7.3 功能验证清单

执行以下完整验证，确保所有功能正常：

#### 基础功能验证

- [ ] **登录功能** — 使用原账号 `admin/admin123` 成功登录
- [ ] **原有客户管理页** — 可正常访问 `/customer`，列表数据正常加载
- [ ] **原有销售订单页** — 可正常访问 `/sales-order`
- [ ] **原有跟进记录** — 可正常访问并创建跟进记录

#### 新增模块验证

- [ ] **仪表盘大屏** — `/dashboard` 页面正常渲染 ECharts 图表
- [ ] **线索管理** — `/lead` 可正常添线索
- [ ] **商机管理** — `/opportunity` 可创建商机并变更阶段
- [ ] **报价管理** — `/quotation` 可创建报价单
- [ ] **产品管理** — `/product` 可维护产品库
- [ ] **联系人管理** — `/contact` 可添加客户联系人
- [ ] **市场活动** — `/marketing-activity` 显示活动列表
- [ ] **日程管理** — `/schedule` 可创建日程
- [ ] **数据分析** — `/analytics` 报表正常加载

#### AI 功能验证

- [ ] **AI 助手** — 在任意页面打开 AI 助手侧边栏，可输入问题并获取 Mock 回复
- [ ] **AI 接口** — 浏览器访问 `http://localhost:8080/api/ai/suggest?context=客户意向分析`，返回 Mock 数据

#### API 接口验证

```bash
# 使用 curl 快速验证各模块 API
# AI 接口
curl http://localhost:8080/api/ai/suggest

# 联系人接口
curl http://localhost:8080/api/contacts

# 产品接口
curl http://localhost:8080/api/products

# 字典接口
curl http://localhost:8080/api/dict/type/list
```

---

## 八、常见问题排查

### 8.1 数据库连接失败

**现象**: 后端启动时报 `CommunicationsException: Communications link failure`

**排查**:
1. 确认 MySQL 服务已启动: `net start mysql` (Windows) 或 `systemctl status mysql` (Linux)
2. 检查 `application.yml` 中的连接信息是否正确
3. 测试连接: `mysql -u root -p -h localhost crm_db`

### 8.2 表不存在错误

**现象**: `Table 'crm_db.crm_contact' doesn't exist`

**排查**:
1. 确认 SQL 脚本已执行: `mysql -u root -p crm_db -e "SHOW TABLES LIKE 'crm_%'"`
2. 如未执行，重新运行 `sql/01_new_tables.sql`
3. 确认执行时没有语法错误（检查 MySQL 版本兼容性）

### 8.3 Mapper 扫描不到

**现象**: `Field xxxMapper in com.crm.module.xxx.service.impl.XxxServiceImpl required a bean of type 'com.crm.module.xxx.mapper.XxxMapper'`

**排查**:
1. 确认启动类中存在 `@MapperScan("com.crm.module.*.mapper")`
2. 确认 Mapper 接口文件已复制到正确位置
3. 确认 Mapper 接口上有 `@Mapper` 注解（可选，`@MapperScan` 已覆盖）
4. 清理并重新编译: `mvn clean compile`

### 8.4 前端路由 404

**现象**: 访问新页面（如 `/lead`）显示空白或 404

**排查**:
1. 确认 `router/index.js` 中注册了新路由
2. 确认 `views/lead/` 目录存在且包含 `index.vue`
3. 检查路由的 `component` 引用路径是否正确（`@/views/lead/index.vue`）
4. 清除浏览器缓存后重试

### 8.5 API 请求跨域

**现象**: 浏览器控制台显示 CORS 错误

**排查**:
1. 确认 `vite.config.js` 中配置了 `/api` 代理
2. 确认代理 `target` 指向 `http://localhost:8080`
3. 重启前端开发服务器（`npm run dev`）
4. 确认后端 `server.port` 为 8080

### 8.6 ECharts 图表不显示

**现象**: 仪表盘页面空白，控制台报 ECharts 相关错误

**排查**:
1. 确认 `echarts` 已安装: `npm list echarts`
2. 如未安装: `npm install echarts`
3. 确认组件中正确导入了 echarts 实例

### 8.7 Element Plus 图标不显示

**现象**: 页面上图标位置显示空白

**排查**:
1. 确认 `@element-plus/icons-vue` 已安装: `npm list @element-plus/icons-vue`
2. 确认 `main.js` 中已全局注册图标组件
3. 在组件中使用时，图标名称需转为 PascalCase: `<UserFilled />`

---

## 九、后续扩展建议

### 9.1 接入真实 DeepSeek API

当前 AI 功能使用 Mock 数据，接入真实 API 的步骤：

```java
// 修改 AiMockController → 对接 DeepSeek API
// 1. 在 application.yml 添加配置
deepseek:
  api-key: ${DEEPSEEK_API_KEY}
  api-url: https://api.deepseek.com/v1/chat/completions
  model: deepseek-chat

// 2. 创建 DeepSeekClient 替换 MockService
@Service
public class DeepSeekAiService {
    // 使用 RestTemplate 或 WebClient 调用 DeepSeek API
}
```

### 9.2 实现 RBAC 权限控制

```sql
-- 建议新增的权限相关表
CREATE TABLE `sys_role` (...);
CREATE TABLE `sys_menu` (...);
CREATE TABLE `sys_role_menu` (...);
CREATE TABLE `sys_user_role` (...);
```

前端可配合 `v-permission` 指令实现按钮级权限控制。

### 9.3 移动端适配

- 使用 `postcss-px-to-viewport` 实现移动端适配
- 基于 Element Plus 移动端组件或 Vant UI 开发 H5 版本
- 考虑 PWA 方案实现离线访问

### 9.4 消息推送集成

- **站内通知**: 使用 WebSocket 实现实时消息推送
- **邮件通知**: 集成 Spring Mail 发送审批通知
- **企业微信/钉钉**: 通过 Webhook 集成企业通讯工具
- **短信通知**: 集成阿里云或腾讯云短信服务

### 9.5 数据报表增强

- 引入 Apache ECharts 更深度的图表类型（热力图、漏斗图、桑基图）
- 数据导出支持 Excel/PDF 格式
- 报表定时发送（配合 Quartz 定时任务）

### 9.6 性能优化

- MySQL 慢查询优化（为高频查询字段添加复合索引）
- 引入 Redis 缓存热点数据（客户信息、字典数据等）
- 前端路由懒加载和组件异步加载
- 大文件分片上传（文档管理模块）

---

## 附录 A：回滚方案

如果升级后出现严重问题，可快速回滚：

```bash
# 1. 数据库回滚
mysql -u root -p crm_db < crm_db_backup.sql

# 2. 后端代码回滚（删除新增模块目录）
cd original-crm/crm-backend/src/main/java/com/crm/module/
rm -rf ai/ contact/ lead/ opportunity/ quotation/ product/ delivery/
rm -rf receivable/ invoice/ service/ schedule/ notice/ approval/
rm -rf document/ salesteam/ dict/ config/ analytics/ tag/ share/ activity/

# 3. 前端代码回滚（删除新增目录）
cd original-crm/crm-frontend/src/
rm -rf views/dashboard/ views/lead/ views/opportunity/ views/quotation/
rm -rf views/product/ views/service/ views/marketing-activity/
rm -rf views/schedule/ views/collaboration/ views/system/ views/analytics/
rm -rf components/ai/ components/layout/LayoutV2.vue
rm -rf api/ai.js api/lead.js api/opportunity.js

# 4. 恢复 router/index.js（从 Git 恢复）
git checkout -- src/router/index.js
```

## 附录 B：目录结构速查

```
crm-upgrade/
├── INTEGRATION_GUIDE.md          ← 本文档
├── backend-src/                  ← 后端新增源代码
│   └── src/main/java/com/crm/
│       ├── common/               ← 公共工具类
│       └── module/               ← 20个业务模块
├── frontend-src/                 ← 前端新增源代码
│   └── src/
│       ├── api/                  ← API 接口封装
│       ├── components/           ← 公共组件
│       ├── router/               ← 路由配置
│       ├── stores/               ← 状态管理
│       ├── types/                ← 类型定义
│       ├── utils/                ← 工具函数
│       └── views/                ← 页面视图
└── sql/                          ← 数据库变更脚本
    ├── 01_new_tables.sql         ← 42张新表 DDL
    └── 02_alter_existing.sql     ← 3张表字段扩展
```

---

> **文档版本**: v1.0  
> **最后更新**: 2026-05-30  
> **适用项目**: original-crm/（原零售CRM项目）  
> **升级来源**: crm-upgrade/（企业级智能销售平台升级包）
