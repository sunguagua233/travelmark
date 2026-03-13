<div align="center">

# RoutePlanner

**智能行程规划助手 - 让旅行井井有条**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

## 项目简介

RoutePlanner 是一款功能强大的旅行行程规划应用，帮助您轻松管理旅行计划、搜索目的地、规划路线并收藏感兴趣的地点。

### 核心功能

- **地点搜索** - 基于 OpenStreetMap 的全球地点搜索，支持中英文
- **路线规划** - 在地图上标记行程点，自动生成路线连线
- **拖拽排序** - 可拖拽调整行程顺序，实时更新路线
- **收藏管理** - 保存心仪地点为收藏标记，支持自定义图标
- **图片附件** - 为每个地点添加图片附件，记录旅行美好瞬间
- **分组管理** - 创建行程分组，按计划归类管理
- **备注信息** - 添加详细备注，支持小红书链接跳转

## 技术栈

### 前端
- **React 19** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **React Router** - 路由管理
- **Motion (Framer Motion)** - 动画效果
- **Leaflet + React-Leaflet** - 地图组件
- **Lucide Icons** - 图标库

### 后端
- **Express** - Web 服务器
- **SQLite (better-sqlite3)** - 数据库
- **Vite Middleware** - 开发模式热更新

## 界面预览

### 首页 - 行程管理
![首页](preview/screenshots/home.png)

### 地图 - 路线规划
![地图](preview/screenshots/map.png)

### 详情 - 标记编辑
![详情](preview/screenshots/detail.png)

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装与运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/routeplanner.git
   cd routeplanner
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**

   打开浏览器访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
npm run preview
```

## 使用指南

### 创建行程

1. 点击首页右上角的 `+` 按钮
2. 输入行程名称
3. 点击创建，进入地图页面

### 添加地点

1. 在地图页面搜索框中输入地点名称
2. 选择搜索结果中的地点
3. 点击 `+` 按钮添加到行程
4. 编辑地点详情（分类、备注、图片等）

### 规划路线

- 添加的地点会自动按顺序连线
- 点击右上角菜单可切换路线显示
- 打开侧边栏可拖拽调整行程顺序

### 创建分组

1. 点击首页底部的「新建分组」按钮
2. 输入分组名称
3. 在分组内创建新行程

## 项目结构

```
routeplanner/
├── src/
│   ├── components/          # React 组件
│   │   ├── Home.tsx        # 首页
│   │   └── ItineraryView.tsx # 行程详情页
│   ├── services/
│   │   └── api.ts          # API 服务
│   ├── types.ts            # TypeScript 类型定义
│   ├── App.tsx             # 应用入口
│   ├── index.css           # 全局样式
│   └── main.tsx            # React 入口
├── server.ts               # Express 后端服务器
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/groups` | 获取所有分组 |
| POST | `/api/groups` | 创建分组 |
| GET | `/api/itineraries` | 获取所有行程 |
| POST | `/api/itineraries` | 创建行程 |
| GET | `/api/itineraries/:id` | 获取行程详情 |
| POST | `/api/markers` | 创建标记点 |
| PUT | `/api/markers/:id` | 更新标记点 |
| DELETE | `/api/markers/:id` | 删除标记点 |
| PUT | `/api/markers/bulk` | 批量更新标记顺序 |

## 数据库

应用使用 SQLite 数据库，数据存储在 `itinerary.db` 文件中。

数据库包含以下表：
- `groups` - 行程分组
- `itineraries` - 行程
- `markers` - 地点标记
- `attachments` - 图片附件

## 开发计划

- [ ] 用户认证与多设备同步
- [ ] 导出行程为 PDF/GPX
- [ ] 导入小红书/马蜂窝攻略
- [ ] 实时协作编辑
- [ ] 移动端 App

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 致谢

- [OpenStreetMap](https://www.openstreetmap.org/) - 地图数据
- [Leaflet](https://leafletjs.com/) - 地图库
- [React](https://react.dev/) - UI 框架

---

<div align="center">
Made with  by RoutePlanner Team
</div>
