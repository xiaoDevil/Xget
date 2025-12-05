# Xget 部署指南

## 🚀 Cloudflare Workers 自动部署

### 步骤 1：准备 Cloudflare 账号

1. 访问 [Cloudflare 注册页面](https://dash.cloudflare.com/sign-up) 创建免费账号
2. 登录后访问 [API Tokens 页面](https://dash.cloudflare.com/?to=/:account/api-tokens)
3. 点击 **Create Token** → 选择 **Edit Cloudflare Workers** 模板
4. 复制并保存生成的 **API Token**（只显示一次！）
5. 访问 [Workers 和 Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)，复制页面右上角的 **Account ID**

### 步骤 2：配置 GitHub 仓库

1. **Fork 本仓库**到你的 GitHub 账号
2. 进入你的仓库 → **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下两个密钥：

   | 名称 | 值 | 说明 |
   |------|-----|------|
   | `CLOUDFLARE_API_TOKEN` | 刚才复制的 API Token | Cloudflare API 访问凭证 |
   | `CLOUDFLARE_ACCOUNT_ID` | 刚才复制的 Account ID | Cloudflare 账户标识 |

### 步骤 3：触发部署

部署会在以下情况自动触发：

- ✅ 推送代码到 `main` 分支
- ✅ 在 **Actions** 页面手动点击 **Run workflow**

**注意**：修改文档文件（`.md`）、`LICENSE` 等不会触发部署

### 步骤 4：查看部署结果

1. 进入 GitHub 仓库 → **Actions** 标签页
2. 查看最新的 **Deploy to Cloudflare Workers** 工作流
3. 部署成功后，访问 [Cloudflare Workers 控制台](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
4. 找到名为 `xget` 的 Worker，默认域名为：`xget.<你的子域>.workers.dev`

### 步骤 5：绑定自定义域名（可选）

1. 在 Cloudflare Workers 控制台点击你的 Worker
2. 进入 **Settings** → **Domains & Routes**
3. 点击 **Add Custom Domain**
4. 输入你的域名（需要先在 Cloudflare 添加域名解析）

---

## 🖥️ Cloudflare Workers 本地部署

### 前置要求

- Node.js 18+ 和 npm
- 已安装并登录 Wrangler CLI

### 步骤 1：安装依赖

```bash
# 克隆仓库
git clone https://github.com/xixu-me/Xget.git
cd Xget

# 安装依赖
npm install
```

### 步骤 2：登录 Cloudflare

```bash
# 登录 Cloudflare 账号（会打开浏览器授权）
npx wrangler login
```

### 步骤 3：配置 wrangler.toml

检查 `wrangler.toml` 配置：

```toml
name = "xget"                      # Worker 名称
main = "src/index.js"              # 入口文件
compatibility_date = "2024-10-22"  # 兼容日期
workers_dev = false                # 是否使用 workers.dev 域名

[placement]
mode = "smart"                     # 智能节点选择
```

### 步骤 4：本地测试

```bash
# 启动本地开发服务器（http://localhost:8787）
npm run dev

# 测试 GitHub 加速
curl http://localhost:8787/gh/torvalds/linux/archive/refs/heads/master.zip
```

### 步骤 5：部署到生产环境

```bash
# 部署到 Cloudflare Workers
npm run deploy

# 输出示例：
# ✨  Built successfully, built project size is 15 KiB.
# ✨  Successfully published your script to
#  https://xget.<你的子域>.workers.dev
```

---

## 🌐 Cloudflare Pages 部署

### 与 Workers 的区别

- **Workers**：适合 API 服务，直接运行代码
- **Pages**：适合静态站点 + Functions，更好的 CI/CD 集成

### 部署步骤（GitHub Actions）

配置与 Workers 相同，只需确保 `.github/workflows/pages-cf.yml` 工作流存在并已启用。

部署后访问：`https://xget.pages.dev`

---

## 🇨🇳 EdgeOne Pages 部署（国内加速）

### 适用场景

- 主要服务中国境内用户
- 需要腾讯云 CDN 加速

### 部署步骤

1. 访问 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone/pages?tab=api)
2. 创建 API Token 并保存
3. 在 GitHub 仓库添加 Secret：`EDGEONE_API_TOKEN`
4. 推送代码自动触发部署

---

## 🐳 Docker 自托管部署（无边缘加速）

### 使用场景

- 私有化部署
- 需要完全控制环境
- 不需要全球边缘加速

### 快速启动

```bash
# 使用预构建镜像
docker pull ghcr.io/xixu-me/xget:latest

# 运行容器（端口 8080）
docker run -d \
  --name xget \
  -p 8080:8080 \
  ghcr.io/xixu-me/xget:latest

# 测试
curl http://localhost:8080/gh/torvalds/linux
```

### 使用 Docker Compose

```yaml
version: '3.8'
services:
  xget:
    image: ghcr.io/xixu-me/xget:latest
    ports:
      - "8080:8080"
    restart: unless-stopped
    environment:
      - TIMEOUT_SECONDS=30
      - MAX_RETRIES=3
      - CACHE_DURATION=1800
```

保存为 `docker-compose.yml` 后运行：

```bash
docker-compose up -d
```

---

## ⚙️ 环境变量配置

在 Cloudflare Workers 控制台 → **Settings** → **Variables** 中配置：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `TIMEOUT_SECONDS` | 30 | 上游请求超时时间（秒） |
| `MAX_RETRIES` | 3 | 最大重试次数 |
| `RETRY_DELAY_MS` | 1000 | 重试延迟（毫秒） |
| `CACHE_DURATION` | 1800 | 缓存时长（秒，30分钟） |
| `ALLOWED_METHODS` | GET,HEAD | 允许的 HTTP 方法 |
| `ALLOWED_ORIGINS` | * | CORS 允许的来源 |
| `MAX_PATH_LENGTH` | 2048 | 最大路径长度 |

---

## 🧪 部署后测试

### 测试 GitHub 加速

```bash
# 原始地址
https://github.com/torvalds/linux/archive/refs/heads/master.zip

# Xget 加速地址
https://你的域名/gh/torvalds/linux/archive/refs/heads/master.zip
```

### 测试 npm 加速

```bash
# 原始地址
https://registry.npmjs.org/react/-/react-18.2.0.tgz

# Xget 加速地址
https://你的域名/npm/react/-/react-18.2.0.tgz
```

### 测试 AI 推理加速

```bash
# 原始 OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Xget 加速
curl https://你的域名/ip/openai/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 🔍 常见问题

### Q: Cloudflare Workers 免费版够用吗？

**A**: 免费版每天 10 万次请求，个人使用绰绰有余。付费版（$5/月）可获得 1000 万次请求。

### Q: 为什么推荐 Cloudflare Workers 而不是自托管？

**A**:
- ✅ **边缘加速**：Cloudflare 有 330+ 全球节点，自托管只有一个服务器位置
- ✅ **自动缓存**：Cloudflare 内置 Cache API，自托管需要自己搭建 Redis/Nginx 缓存
- ✅ **免运维**：无需担心服务器故障、DDoS 防护、SSL 证书更新
- ✅ **成本低**：免费额度大，付费版也比自己买服务器便宜

### Q: 部署后还是很慢？

**A**:
1. 首次访问资源需要从上游拉取，后续访问会命中缓存
2. 检查 `X-Cache-Status` 响应头，看是否命中缓存
3. Git 操作和 AI 请求默认跳过缓存，保证实时性
4. 确认你的 Worker 部署在正确的区域

### Q: 如何更新已部署的 Worker？

**A**:
- **GitHub Actions 部署**：直接推送代码到 `main` 分支自动更新
- **本地部署**：运行 `npm run deploy` 会覆盖现有 Worker

### Q: 可以同时部署到多个平台吗？

**A**: 可以！本项目支持同时部署到 Cloudflare Workers、Pages、EdgeOne、Vercel 等多个平台，通过 GitHub Actions 自动化管理。

---

## 📊 性能监控

部署后，每个响应都包含性能指标：

```bash
curl -I https://你的域名/gh/torvalds/linux

# 响应头示例：
X-Cache-Status: HIT                          # 缓存命中
X-Performance-Metrics: {"cache_hit":5}       # 缓存查询耗时 5ms
CF-Cache-Status: HIT                         # Cloudflare 缓存状态
CF-Ray: 8a1234567890abcd-LAX                 # 节点位置（洛杉矶）
```

---

## 🎓 进阶配置

### 自定义平台支持

编辑 `src/config/platforms.js`：

```javascript
export const PLATFORMS = {
  // 添加新平台
  'my-platform': 'https://my-api.com',

  // AI 推理平台（使用 ip- 前缀）
  'ip-myprovider': 'https://api.myprovider.com',

  // 容器镜像仓库（使用 cr- 前缀）
  'cr-myregistry': 'https://registry.mycompany.com'
};
```

重新部署即可生效。

### 配置智能路由

在 `wrangler.toml` 中调整：

```toml
[placement]
mode = "smart"  # 智能选择节点
# mode = "off"  # 关闭智能路由（默认使用最近节点）
```

---

## 📚 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
- [本项目 GitHub 仓库](https://github.com/xixu-me/Xget)
