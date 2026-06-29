# 纪法知识快问快答

一款用于党政纪法教育活动的桌面答题工具，支持 Excel 导入题目、SQLite 数据库存储、大转盘抽人等丰富功能。

## 功能特性

- 三种题型：单选题、多选题、判断题
- Excel 导入/导出/模板下载
- SQLite 数据库存储（浏览器端 sql.js）
- 大转盘人员抽取（Canvas 动画）
- 首页标题/副标题自定义
- 答案解析显示/隐藏开关
- 字体、字号、背景自定义
- 快捷键自定义
- 题目编辑、增删改查
- 人员管理（导入/导出/编辑）
- Windows 桌面端（Electron 打包）

## 技术栈

- React 19 + TypeScript
- Vite 7 + Tailwind CSS 3
- shadcn/ui 组件库
- sql.js (SQLite WebAssembly)
- xlsx (Excel 解析)
- framer-motion (动画)
- Electron 36 (桌面端)

## 开发

```bash
npm install
npm run dev          # 开发模式
npm run build        # 生产构建
npm run electron:pack # 打包 Windows EXE
```

## 数据存储

使用 sql.js 在浏览器端运行 SQLite 数据库，数据导出为二进制存储在 localStorage 中，刷新页面不丢失。

## License

MIT
