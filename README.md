# 12306 像素级复刻项目

## 项目概述
- 像素级复刻中国铁路 12306 网站的核心界面与订票流程，包含前端应用与后端 API。
- 面向试用与中期验收，提供一键本地运行、测试与可选 MySQL 兼容验证。

## 项目结构
```
12306/
├── frontend/          # 前端 React + TypeScript + Vite
├── backend/           # 后端 Express + Sequelize (SQLite/MySQL)
├── docs/              # 文档（测试指南、项目计划等）
└── README.md          # 使用与部署指南（当前文件）
```

## 技术栈（与当前代码一致）
- 前端：React 19 + TypeScript、Vite 7、React Router 7
- 后端：Node.js、Express 5、Sequelize 6、SQLite3、MySQL2
- 测试：Jest（后端）、Playwright（E2E）、Vitest（前端单测）

## 快速开始（本地试用）
**环境要求**
- Node.js 20
- 可选：Docker（用于 MySQL 兼容测试）

**安装依赖（两种方式任选其一，建议选择方法一）**

方式一：进入子目录安装（开发者常用）
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

方式二：在仓库根目录使用 --prefix（一键跨平台）
```bash
npm install --prefix backend
npm install --prefix frontend
```

**启动服务（两种方式任选其一，建议使用方法一）**

方式一：进入子目录运行（推荐开发模式，自动热重载）
- 终端 A（后端）：
  - `cd backend`
  - `npm run dev`（使用 nodemon 监听源码）
- 终端 B（前端）：
  - `cd frontend`
  - `npm run dev`

方式二：在仓库根目录使用 --prefix（适合一键启停）
- 启动后端（开发或演示二选一）：
  - 开发模式：`npm run dev --prefix backend`
  - 演示模式：`npm start --prefix backend`
- 启动前端：`npm run dev --prefix frontend`

- 就绪检查：访问 `http://localhost:3000/health` 与 `http://localhost:5174`

> 说明：前端已在 `vite.config.ts` 配置 `server.port=5174` 与 `/api` 代理到后端 `http://localhost:3000`。

## 部署与运行（目前在课程上没有此需求）
**方案 A：快速演示（SQLite）**
- 后端：`PORT=3000 npm start --prefix backend`
- 前端构建：`npm run build --prefix frontend`
- 前端预览：`npm run preview --prefix frontend`（默认 `http://localhost:4173`）
- 反向代理：将前端请求 `/api` 指向后端 `http://localhost:3000`（Nginx/网关均可）

**方案 B：MySQL 部署**
- 启动数据库（示例，Docker）：
  ```bash
  docker run -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=trae_12306 -p 3306:3306 mysql:8
  ```
- 后端环境变量：
  - `DB_DIALECT=mysql`
  - `DB_HOST=127.0.0.1` `DB_PORT=3306` `DB_USER=root` `DB_PASS=root` `DB_NAME=trae_12306`
  - 可选：`API_PREFIX=/api/v1`、`CORS_ORIGIN=http://localhost:5174`
  - 订单回收与状态轮转：`ORDER_UNPAID_TTL_MS`、`ORDER_CLEANUP_INTERVAL_MS`
- 启动后端：`npm start --prefix backend`
- 前端同方案 A

### Nginx 反向代理示例
```nginx
server {
  listen 80;
  server_name your-domain.com;

  # 前端静态资源（构建产物）
  root /var/www/12306-frontend/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # 代理后端 API
  location /api/v1/ {
    proxy_pass http://127.0.0.1:3000/api/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
  }
}
```

注意：前端当前使用绝对地址 `http://127.0.0.1:3000/api/v1`（`frontend/src/services/api.ts:1`）。若部署到远程域名，请确保后端可通过该地址访问，或将该常量调整为部署域名的 API 根路径并相应设置 `CORS_ORIGIN`。

### Docker Compose 示例（MySQL + Backend）
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: trae_12306
    ports:
      - '3306:3306'
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-proot']
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DB_DIALECT: mysql
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASS: root
      DB_NAME: trae_12306
      API_PREFIX: /api/v1
      CORS_ORIGIN: http://localhost:5174
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - '3000:3000'
```
该示例仅用于后端与数据库的容器化；前端可在宿主机上进行构建与静态服务。若需要前端容器与统一域名，请将 `frontend` 构建产物挂载到 Nginx 容器并确保前端的 API 地址与后端一致。

## 测试与质量
- 测试与运行指南：详见 `docs/测试与运行指南.md`
- 后端 SQLite 测试：`npm test --prefix backend`
- 后端 MySQL 测试：`npm run test:mysql --prefix backend`
- 前端 E2E（需服务就绪）：
  - 安装浏览器：`npx playwright install`
  - 启动服务后执行：`npm run test:e2e --prefix frontend`
- 前端单测：`npm run test:unit --prefix frontend -- --coverage`
- 质量检查：`npm run lint --prefix frontend && npm run typecheck --prefix frontend`

## 功能范围（融合项目计划）
- 首页与购票入口、公告与导航
- 用户系统：注册、登录、身份验证、个人中心、常用乘车人管理
- 车票服务：车次查询、余票与时刻表、订票和订单管理
- 支付流程：订单支付、支付状态、退票/改签（模拟）
- 其他：帮助与站点查询（演示数据）

## 里程碑与质量（摘要）
- 里程碑：组件库、核心页面、API、集成与验收（详见 `docs/项目计划.md`）
- 质量保障：ESLint、TypeScript 类型检查、自动化测试（E2E/单测/后端集成）

## 常见问题
- 无法访问接口：检查后端是否运行、`/health` 是否返回 OK、前端代理是否正确
- E2E 登录不稳定：使用统一登录工具 `frontend/tests/e2e/utils/auth.ts` 的 `ensureLogin(page)`
- SQLite 并发写锁：已启用 WAL 与 `busy_timeout`；若仍异常，确认单机负载与并发测试设置
- MySQL 兼容：`users.passenger_type` 使用中文枚举；`order_passengers.phone` 为 `VARCHAR(15)`，超长后端返回 400
- 生产部署注意：前端默认调用 `http://127.0.0.1:3000/api/v1`，跨域部署时请配置后端 `CORS_ORIGIN` 为前端域名，或调整前端 `API_BASE_URL` 与 Nginx 代理。

## 开发与贡献
- 代码规范：ESLint、TypeScript 严格模式、组件命名 PascalCase、文件命名 kebab-case
- Git 提交规范：`feat/fix/docs/style/refactor/test/chore`
- PR 流程：Fork → 分支 → 提交 → 推送 → 发起 PR

## 许可证与声明
- 许可证：MIT（见 `LICENSE`）
- 声明：本项目仅用于学习与研究；UI 与流程参考 12306 网站，版权归相关方所有
