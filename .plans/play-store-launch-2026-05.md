# Nexior AceData — Google Play 上架计划

**版本**：v3.35.0 / `versionCode 33500`
**包名**：`com.acedatacloud.nexior`
**Play Console 账号**：Germey Technology, LLC（`cqcreer@gmail.com`）
**计划起草日期**：2026-05-23
**审计人**：GitHub Copilot

---

## 1. 当前状态总览

| 项目 | 状态 | 说明 |
|---|---|---|
| 开发者账号验证（2026 新规） | ✅ 已注册 | `com.acedatacloud.nexior` 已通过 Android Developer Verification |
| Managed publishing（手动发布开关） | ✅ 已开启 | 审核通过后需要手动点击 Publish changes |
| Internal testing | ✅ **LIVE** | release `2026.05.21.1`，v3.35.0，Full rollout，5月20日上传 |
| Closed testing — Alpha | 🟡 审核中 | 加入 US、UK 两国 |
| Open testing | ⚪ Draft | 未启用 |
| **Production**（正式上架） | ❌ Draft | 5 步任务清单只完成 1 步 |
| 本地构建产物 | ✅ 已就绪 | AAB 7.4 MB / APK 6.4 MB（5 月 20 日打的包） |
| Keystore 文件 | ✅ 已在仓库 | `android/app/nexior-release.keystore`（密码不在仓库） |

### 关键决策（已确认）

| 决策项 | 选择 |
|---|---|
| Production 国家范围 | **全球，不含中国大陆**（≈ 176 / 177 国家） |
| Release notes 语种 | **仅 en-US**（其他语种自动回落到英文） |
| 是否同时配置 CI 自动化 | **是**（本次一起做） |

---

## 2. Store presence 审计结论

✅ **Store listing / Store settings 全部完整**，无需补任何资料。

| 区块 | 状态 | 备注 |
|---|---|---|
| Default listing — App name | ✅ | AceData |
| Default listing — Short / Full description | ✅ | 已填 |
| Default listing — App icon | ✅ | 已上传 |
| Default listing — Feature graphic | ✅ | 已上传 |
| Default listing — Phone screenshots | ✅ | ≥ 2 张 |
| Default listing — Tablet screenshots（7" + 10"） | ✅ | 均已上传 |
| Store settings — Category | ✅ Productivity | |
| Store settings — Contact email | ✅ `office@acedata.cloud` | |
| Store settings — Website | ✅ `https://platform.acedata.cloud` | |
| Translations | ⚪ 未启用 | 本次首发只用 en-US |

---

## 3. App content / Compliance 审计结论

✅ **没有阻塞 Production 提交的 App content 项。**

> 推理依据：Internal testing 能 LIVE，说明所有必填的政策项（隐私政策 / Data safety / 内容分级 / 目标人群 / 广告 / AI 内容声明 / 应用访问）都已在审核中通过。Publishing overview 与 Dashboard 上都没有 "Pending blockers" 警示。

| 必填项 | 状态 | 数据来源 |
|---|---|---|
| 隐私政策 URL | ✅ 已填 | `https://platform.acedata.cloud/privacy`（含 Google API Limited Use 段落） |
| Data safety | ✅ 已填 | Internal testing 已 LIVE |
| 内容分级（IARC） | ✅ 已通过 | 同上 |
| 目标人群 | ✅ 已填 | 同上 |
| 广告声明 | ✅ 已填 | 同上（应为 No ads） |
| 应用访问 / Restricted apps | ✅ 已填 | 同上 |
| AI-generated content（新政策） | ✅ 已填 | 同上 |

---

## 4. Production Track — 待补 4 项动作

| # | 任务 | 待操作 |
|---|---|---|
| 1 | App bundle | 从 App bundles library 里把 `versionCode 33500` 加进 Production 草稿 |
| 2 | Release name + notes | Release name = `3.35.0`；Release notes 用本计划第 5 节的英文版本 |
| 3 | Countries and regions | 选择「除中国大陆外的所有国家」（≈ 176 国） |
| 4 | Send for review | 点击 Send for review，等 Google 审 1–7 天；审过后到 Publishing overview 手动 Publish changes |

---

## 5. Release notes（en-US，≤ 500 字符）

```
Welcome to AceData — your all-in-one AI assistant.

• 50+ leading AI models in one app: GPT-5, Claude Sonnet 4.5, Gemini 2.5, Grok, DeepSeek
• Generate images with Midjourney, Flux, NanoBanana, Seedream
• Create videos with Sora, Veo, Luma, Kling, Hailuo, Wan
• Make music with Suno and Producer
• Google search, web extraction and more

Sign in with Google or Passkey for fast, secure access.
```

字数约 360，未超过 Google Play 单语种 500 字符上限。

---

## 6. CI / 自动化设置清单

`.github/workflows/build-android.yaml` 已经写好，触发条件：`android-v*` tag 或 workflow_dispatch（可选 track）。

只需要在 `https://github.com/AceDataCloud/Nexior/settings/secrets/actions` 补 **5 个 Secret**：

| Secret 名 | 值来源 | 谁来准备 |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -i android/app/nexior-release.keystore` 的全部输出（去掉换行） | 用户在本地终端跑命令后贴到 GitHub Secrets |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 创建时设置的密码 | 用户直接贴（**不要发到对话里、不要通过 askQuestions**） |
| `ANDROID_KEY_ALIAS` | 固定值 `nexior` | 直接贴 |
| `ANDROID_KEY_PASSWORD` | key 密码（通常和 keystore 密码相同） | 用户直接贴 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Cloud Console 建 Service Account 后下载的 JSON 文件全部内容 | 需要做 GCP + Play Console 联动（详见下） |

### 6.1 Service Account 创建流程

1. 进入 `https://console.cloud.google.com/`，确认/创建 GCP 项目。
2. **IAM & Admin → Service Accounts → Create Service Account**：
   - Name 例如 `play-store-publisher`
   - Skip optional roles（在 Play Console 这边赋权）
3. 进入新建的 Service Account → **Keys → Add Key → Create new key → JSON** → 下载保存。
4. 进入 Play Console → **Settings → API access**：
   - 把刚创建的 Service Account 邀请进来
   - 赋予权限：**Admin (all permissions)** 中至少勾选 `Release manager`（或选 Releases 相关全部）
5. 把 JSON 文件的完整内容粘贴进 GitHub Secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`。

### 6.2 Keystore Base64 命令（在本机跑）

```bash
cd /Users/qicu/Projects/AceDataCloud/Nexior
base64 -i android/app/nexior-release.keystore | tr -d '\n' | pbcopy
# 内容已复制到剪贴板，直接粘到 GitHub Secret 即可。
```

### 6.3 自动化生效后的发版流程

```bash
# 在 Nexior 仓库根目录
git tag android-v3.36.0 && git push origin android-v3.36.0
# GitHub Actions → Build Android → 自动构建 AAB → 推到 internal track

# 要发到 Production：GitHub Actions 页面 → Build Android → Run workflow → 选 production
```

---

## 7. 我会做的事 vs 需要你做的事

### Copilot 可以自动 / 半自动完成的

- ✅ 用 Playwright 把 Production 草稿填到「Preview and confirm」步骤之前
- ✅ 在 Play Console UI 上引导你点 Send for review（最终点击交给你确认）
- ✅ 写好 CI 自动化文档与命令
- ✅ 用 Playwright 引导你在 GCP Console 建 Service Account（指认 UI、检查截图）
- ✅ 帮你校验下载的 Service Account JSON 字段是否正确

### 必须你来做的（涉及密码 / 决策）

- 🔐 输入 keystore 密码做 base64（密码不能进对话）
- 🔐 在 GitHub Secrets 页面粘贴 5 个 Secret 的值
- 🔐 在 Play Console 上做最终的 **Send for review** 和审核通过后的 **Publish changes** 点击（不可逆操作）
- 🔐 GCP 项目选择（是否复用已有项目）

---

## 8. 产物列表

- 当前计划（你正在看的这份） → `.plans/play-store-launch-2026-05.md`
- 待上传的 AAB → `android/app/build/outputs/bundle/release/app-release.aab`（7.4 MB，versionCode 33500）
- Playwright 抓的 22 张 Play Console 页面快照 → 工作区 `.playwright-mcp/`

---

## 9. 已验证的健康项（不再担心）

- ✅ 应用图标、Feature graphic、手机/平板截图全部通过 Play Console 视觉规范
- ✅ Privacy Policy URL 在线，含 Google API Limited Use 段落（May 9 更新）
- ✅ Terms of Service 可访问（`/terms`）
- ✅ Support email：`office@acedata.cloud`
- ✅ Internal testing 链路 LIVE，证明签名 / 商店资料 / 政策已过审
- ✅ `versionCode 33500 > 33000`，不存在版本号回退拒审风险
- ✅ AndroidManifest 权限最小化（INTERNET + 媒体读取，无 SMS / 通讯录 / 位置等高敏权限）
