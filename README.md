# 12306 官方网站像素级复刻项目

## 项目概述

本项目旨在像素级复刻中国铁路12306官方网站，包含完整的前端界面和后端API服务。项目严格按照12306官方网站的设计规范、交互逻辑和功能特性进行开发。

## 项目结构

```
12306-replica/
├── frontend/          # 前端React应用
├── backend/           # 后端Node.js API服务
├── docs/             # 项目文档
├── assets/           # 静态资源
└── README.md         # 项目说明
```

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: CSS Modules / Styled Components
- **状态管理**: Redux Toolkit
- **路由**: React Router
- **UI组件**: Ant Design
- **HTTP客户端**: Axios

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL + Redis
- **ORM**: Sequelize
- **认证**: JWT
- **安全**: Helmet, CORS
- **日志**: Morgan

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 启动开发服务器

```bash
# 启动前端开发服务器
cd frontend
npm run dev

# 启动后端API服务器
cd backend
npm run dev
```

### 访问地址
- 前端应用: http://localhost:5174
- 后端API: http://localhost:3000

## 测试用例运行

### 前置准备
- 确保已安装依赖并能启动前后端开发服务器
- 建议先初始化测试数据：
  - 后端执行 `cd backend && node src/scripts/seedData.js`
  - 或在开发/测试环境启动时自动加载（已配置）

### 启动服务
- 启动后端：`cd backend && npm run dev`（默认端口 `3000`）
- 启动前端：`cd frontend && npm run dev`（默认端口 `5174`）

### 前端端到端测试（Playwright）
- 安装浏览器驱动（首次需要）：`cd frontend && npx playwright install`
- 运行全部 E2E：`cd frontend && npm run test:e2e`
- 运行指定用例：
  - 用户认证：`npm run test:e2e -- -g 用户认证`
  - 常用乘车人管理：`npm run test:e2e -- -g 常用乘车人管理`
  - 车票查询：`npm run test:e2e -- -g 车票查询与筛选`
  - 车次筛选与条件修改：`npm run test:e2e -- -g 车次筛选与条件修改`
  - 订票与订单支付：`npm run test:e2e -- -g 订票与订单支付`
  - 订单中心列表：`npm run test:e2e -- -g 订单中心列表`
  - 未完成订单去支付：`npm run test:e2e -- -g 订单中心未完成订单去支付`
  - 从列表点击预订：`npm run test:e2e -- -g 从列表点击预订稳定用例`

### 后端接口测试（Jest + Supertest）
- 执行：`cd backend && npm test`
- 覆盖范围：认证、订单创建与状态更新、车次查询等

## 核心功能模块

### 1. 用户系统
- 用户注册/登录
- 身份验证
- 个人信息管理

### 2. 车票查询
- 车次查询
- 余票查询
- 时刻表查询

### 3. 订票系统
- 车票预订
- 座位选择
- 订单管理

### 4. 支付系统
- 多种支付方式
- 支付状态跟踪
- 退款处理

### 5. 其他功能
- 常用联系人管理
- 历史订单查询
- 客服系统

## 开发规范

### 代码规范
- 使用ESLint + Prettier进行代码格式化
- 遵循TypeScript严格模式
- 组件命名采用PascalCase
- 文件命名采用kebab-case

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 项目进度

- [x] 项目初始化
- [x] 技术栈选择
- [x] 基础架构搭建
- [ ] UI组件开发
- [ ] 核心功能实现
- [ ] 测试覆盖
- [ ] 性能优化
- [ ] 部署上线

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues: [GitHub Issues](https://github.com/your-repo/12306-replica/issues)
- 邮箱: your-email@example.com

---

**注意**: 本项目仅用于学习和研究目的，不得用于商业用途。所有设计和功能均参考12306官方网站，版权归中国铁路总公司所有。
