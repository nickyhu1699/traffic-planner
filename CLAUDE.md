# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

胡氏清念宗祠重光庆典交通疏导（停车）系统 — 基于高德地图 JS API 的实时停车管理工具，用于乡村庆典活动的停车场规划与车辆调度（~1000 宾客，~150 台车）。

## Architecture

**Node.js 服务端**（`server.js`）：
- 纯 Node.js HTTP 服务器，无第三方依赖
- 端口：`process.env.PORT || 3000`
- 数据存储：`data.json`（JSON 文件，已加入 Git 跟踪）
- GitHub 同步：每次保存数据后 5 秒防抖推送到仓库（需设置 `GH_TOKEN` 环境变量）
- 路径穿越防护：静态文件服务已做 `path.normalize` + 根目录校验
- API 路由：`GET/POST /api/data`、`POST /api/parking`

**管理后台**（`public/admin.html`）：
- 高德地图 JS API 1.4.15 + 卫星图层
- 工具：停车场、指挥员、出村口、进村口、文字、箭头、导流线、移动、删除
- 登录密码：硬编码 `112233`，session 存储
- 底部实时显示鼠标经纬度，点击可复制
- 支持数据导入/导出（JSON 文件）
- 地图定位：丰顺县潘田镇上江村 `[116.307510, 23.912505]`，zoom 18

**来宾页**（`public/viewer.html`）：
- 5 秒自动刷新停车数据
- 显示停车场状态标记（充足/紧张/已满）+ 导航按钮
- 显示指挥员、出村口、进村口、文字、箭头、导流线标注
- 出村口、进村口标记提供高德导航按钮
- 左上角悬浮数据面板（总车位/已停/剩余）
- 每次刷新前清除所有旧 overlay 防止残留

**首页**（`public/index.html`）：两个入口卡片（管理后台 + 来宾页）

## Data Model

`data.json` 结构：
```json
{
  "annotations": [...],
  "parkingState": { "A区": 10 }
}
```

annotation 类型及字段：
- `parking`: `name`, `cap`, `current`, `color`, `lng`, `lat`
- `guard`: `name`, `lng`, `lat`
- `villageExit`: `lng`, `lat`
- `villageEntry`: `lng`, `lat`
- `text`: `text`, `color`, `fontSize`, `lng`, `lat`
- `arrow`: `lng1`, `lat1`, `lng2`, `lat2`, `color`, `size`
- `traffic`: `lng1`, `lat1`, `lng2`, `lat2`, `size`

## Development

```bash
node server.js              # 启动服务
# 管理页: http://localhost:3000/admin
# 来宾页: http://localhost:3000/viewer
```

## Deployment

- Render.com 免费版（`render.yaml`）
- GitHub API 推送代码（因国内网络 git push 超时）
- 需在 Render 设置环境变量 `GH_TOKEN`

## Key Constants

- 停车目标：150 台
- 停车场颜色：`LOT_COLORS` 8 色循环
- 地图中心：`[116.307510, 23.912505]`（丰顺县潘田镇上江村）
- 高德地图 Key：`26e69ba4a37c0b591917e2317bddbd12`
- 管理密码：`112233`
