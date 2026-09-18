# LingoDesk · 商务英语口语教练

一个按《Collins English for Business: Speaking》目录顺序组织的移动端优先口语训练网站原型。

## 当前版本

- React + TypeScript + Vite
- Lucide 图标
- 手机端响应式布局
- 全书 20 个 Unit 的课程地图
- 每个 Unit 已录入重点表达、章节练习和互动角色脚本
- 浏览器内置英文朗读（SpeechSynthesis）
- 浏览器语音识别辅助跟读（SpeechRecognition，取决于浏览器支持）
- 本地保存学习进度（localStorage）
- 每章可选择用户拥有授权的正版 MP3，在当前浏览器本地播放
- 音频资源核验面板：官方入口 + 未确认授权的第三方外链索引
- 不上传或重新分发整本 PDF、CD 音频或第三方录音

## 本地运行

```bash
npm install
npm run dev
```

如果 Windows PowerShell 阻止 `npm.ps1`，请使用：

```powershell
npm.cmd install
npm.cmd run dev
```

## 生产构建

```powershell
npm.cmd run build
```

构建产物在 `dist/`。

## Cloudflare Pages

- GitHub repository：保存源码
- Build command：`npm run build`
- Build output directory：`dist`
- 先使用 Cloudflare 分配的 `*.pages.dev` 地址

## 内容与版权

课程索引、重点表达、练习和角色脚本是面向口语训练的原创教学编排，不是整本书的逐字转载。音频面板只提供核验后的来源入口；本地播放器只读取用户在当前浏览器选择的文件，不会上传音频。

详细记录见：

- `docs/VERIFICATION.md`：书籍与听力资源核验
- `docs/CONTENT-IMPORT.md`：20 个 Unit 的录入说明
- `public/audio-README.md`：正版音频接入说明

## Cloudflare Workers 配置

项目根目录的 `wrangler.jsonc` 将 Vite 的 `dist/` 配置为 Worker 静态资源目录，并启用 SPA 回退。Cloudflare Workers 的静态资源配置需要指定 `assets.directory`；React/Vite 单页应用还需要 `assets.not_found_handling` 为 `single-page-application`。

## Cloudflare Worker 修复部署

当前项目的 Worker 静态资源配置已经写入 `wrangler.jsonc`。如果 Cloudflare 控制台的 Git 自动部署没有正确读取 `dist/`，可以使用 Wrangler 直接部署：

```powershell
cd "C:\Users\xiaolong.liu01\Desktop\口语web"
npm.cmd run deploy:worker
```

第一次使用时先运行：

```powershell
npx.cmd wrangler login
```

登录完成后再次运行部署命令。该方式不需要启用 Cloudflare Access。

如果只想用 Cloudflare Pages，也可以先运行 `npm.cmd run build`，再在 Pages 的 Direct Upload 中上传 `dist/` 文件夹。
