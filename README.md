# LingoDesk - 商务英语口语教练

一个按《Collins English for Business: Speaking》目录顺序组织的移动端优先口语训练网站原型。

## 当前版本

- React + TypeScript + Vite
- 全书 20 个 Unit 的课程地图
- 每个 Unit 的重点表达、章节练习和互动角色脚本
- 浏览器英文朗读和语音识别辅助跟读
- 本地保存学习进度
- 邮箱 + 密码注册、登录和退出
- Supabase Auth 会话持久化
- 每章可选择授权的正版 MP3 在当前浏览器本地播放
- Cloudflare Pages / Workers 静态资源配置

## 本地运行

```powershell
npm.cmd install
npm.cmd run dev
```

## 生产构建

```powershell
npm.cmd run build
```

构建产物在 `dist/`。

## 配置邮箱密码登录

登录功能使用 Supabase Auth。复制 `.env.example` 为 `.env`：

```powershell
Copy-Item .env.example .env
```

在 `.env` 中填写：

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
# Legacy projects may use VITE_SUPABASE_ANON_KEY instead
# VITE_SUPABASE_ANON_KEY=your_legacy_anon_public_key
```

只能使用 publishable/anon key，不要把 `service_role` key 或数据库密码放入前端、GitHub 或 Cloudflare Pages。

## Cloudflare Pages 构建设置

```text
框架预设：无（没有 Vite 选项时选择无）
构建命令： npm run build
构建输出目录： dist
根目录：留空
```

在 Cloudflare Pages 的 Settings -> Environment variables 中添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，然后重新部署。

## 内容与版权

课程索引、重点表达、练习和角色脚本是面向口语训练的原创教学编排，不是整本书的逐字转载。
