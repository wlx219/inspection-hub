# InspectionHub MVP

综合质检系统 - 图纸气泡标注 + 表单拍照识别

## 功能特性

### 模式A：图纸气泡标注
- 上传图纸（图片 / PDF 多页）
- 双击添加气泡标注
- 拖拽移动气泡位置
- 10 种标注类型（线性、直径、半径、角度、螺纹、几何公差等）
- 属性编辑（尺寸值、公差、量检具）
- Excel 检测表导出

### 模式B：表单拍照识别
- 拍照或上传表单图片
- OCR 文字识别
- 表格数据提取
- 数据校验（超限判定）
- Excel 检验记录导出

## 技术栈

**前端**: React 18 + TypeScript + Vite + TailwindCSS + Fabric.js + PDF.js
**后端**: Node.js + Express + JWT 认证
**本地存储**: IndexedDB (Dexie)
**OCR**: Tesseract.js (本地) / 阿里云 / 腾讯云

## 快速开始

### 前端

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

### 后端 (可选)

```bash
cd server

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

### OCR 服务配置

| 提供者 | 配置项 | 说明 |
|--------|--------|------|
| Tesseract (默认) | 无需配置 | 本地运行，精度一般 |
| 阿里云 | `VITE_ALIYUN_ACCESS_KEY_ID` 等 | 高精度表格识别 |
| 腾讯云 | `VITE_TENCENT_SECRET_ID` 等 | 高精度表格识别 |

## 项目结构

```
inspection-hub-mvp/
├── src/
│   ├── components/        # React 组件
│   │   ├── AnnotationCanvas.tsx      # 气泡标注画布
│   │   ├── AnnotationList.tsx         # 标注列表
│   │   ├── AnnotationPropertyPanel.tsx # 属性编辑面板
│   │   ├── FileUpload.tsx            # 文件上传
│   │   ├── FormCapture.tsx           # 表单拍照
│   │   ├── InspectionDataTable.tsx    # 检验数据表
│   │   └── ModeSwitcher.tsx          # 模式切换
│   ├── pages/
│   │   └── HomePage.tsx              # 主页
│   ├── services/
│   │   └── api.ts                    # API 服务
│   ├── store/
│   │   └── index.ts                  # 状态管理
│   ├── db/
│   │   └── index.ts                  # 本地数据库
│   ├── utils/
│   │   ├── export.ts                 # Excel 导出
│   │   └── ocr.ts                    # OCR 识别
│   └── types/
│       └── index.ts                  # 类型定义
├── server/                  # 后端服务
│   └── src/
│       ├── routes/         # API 路由
│       ├── middleware/     # 中间件
│       └── index.ts        # 服务入口
└── public/
```

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/demo | 演示模式登录 |
| GET | /api/auth/me | 获取当前用户 |

### 图纸

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/drawings | 获取图纸列表 |
| POST | /api/drawings | 创建图纸 |
| GET | /api/drawings/:id | 获取图纸详情 |
| PUT | /api/drawings/:id | 更新图纸 |
| DELETE | /api/drawings/:id | 删除图纸 |

### 表单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/forms | 获取表单列表 |
| POST | /api/forms | 创建表单 |
| GET | /api/forms/:id | 获取表单详情 |
| PUT | /api/forms/:id | 更新表单 |
| DELETE | /api/forms/:id | 删除表单 |
| GET | /api/forms/stats/summary | 统计汇总 |

## 使用说明

### 模式A：图纸标注

1. 选择「图纸标注」模式
2. 上传图纸文件（支持 JPG、PNG、PDF）
3. PDF 文件会自动分页，可翻页查看
4. 双击图纸添加气泡标注
5. 点击气泡选择，然后在右侧面板编辑属性
6. 可以拖拽气泡调整位置
7. 完成后点击「导出 Excel」生成检测表

### 模式B：表单识别

1. 选择「表单识别」模式
2. 拍照或上传表单图片
3. 系统自动进行 OCR 识别
4. 识别结果以表格形式展示
5. 可编辑核对数据
6. 点击「导出 Excel」生成检验记录

## 开发说明

### Fabric.js 气泡标注

气泡使用 `fabric.Group` 将圆形和文字组合，支持：
- 双击添加
- 点击选择
- 拖拽移动
- 删除操作

### PDF 多页处理

使用 `pdfjs-dist` 解析 PDF：
- 逐页渲染为图片
- 支持翻页导航
- 每页独立保存标注

### OCR 识别流程

```
图片 → 灰度处理 → 文字检测 → 表格识别 → 结构化输出
```

## License

MIT
