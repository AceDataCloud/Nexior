# Nexior Mobile Release Guide

Android (Google Play Store) 和 iOS (App Store) 的 CI/CD 构建与发布指南。

## 架构概览

```
package.json (版本源)
    ↓  npm run sync-version
android/app/build.gradle  +  ios/App/App.xcodeproj/project.pbxproj
    ↓  git tag android-v* / ios-v*
GitHub Actions
    ↓
Google Play Store (AAB)  /  TestFlight (IPA)
```

- **Android workflow**: `.github/workflows/build-android.yaml`
- **iOS workflow**: `.github/workflows/build-ios.yaml`
- **版本同步脚本**: `scripts/sync-native-version.js`

---

## 一、Google Play Store（Android）

### 1. 创建开发者账号

- 前往 https://play.google.com/console 注册（一次性 $25）
- 创建 App：包名 `com.acedatacloud.nexior`，名称 `AceData`

### 2. 生成签名 Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore nexior-release.keystore \
  -alias nexior \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Ace Data Cloud, O=Ace Data Cloud, L=Beijing, C=CN"
```

> **⚠️ 这个 keystore 文件和密码必须永久保存。丢失后无法再更新此 App。**

### 3. Base64 编码 Keystore

```bash
base64 -i nexior-release.keystore | tr -d '\n' > nexior-release.keystore.b64
```

### 4. 创建 Google Play 服务账号（CI 上传用）

1. Google Play Console → **Settings** → **API access** → **Create new service account**
2. 跳转到 Google Cloud Console，创建 Service Account，下载 JSON key 文件
3. 回到 Play Console，给该 service account 分配 **Release manager** 权限

### 5. 设置 GitHub Secrets

前往 https://github.com/AceDataCloud/Nexior/settings/secrets/actions 添加：

| Secret | 值 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `nexior-release.keystore.b64` 文件的全部内容 |
| `ANDROID_KEYSTORE_PASSWORD` | keytool 生成时设置的密码 |
| `ANDROID_KEY_ALIAS` | `nexior` |
| `ANDROID_KEY_PASSWORD` | 与 keystore 密码相同（或单独设置） |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | 服务账号 JSON 文件的全部内容（不是 base64） |

### 6. 首次手动上传

Google Play 要求第一个 AAB 必须在 Console 手动上传，之后 CI 才可自动推送。

```bash
# 本地构建
npm run pack:android

# 在 Android Studio 中用 keystore 签名打包 release AAB
# 或命令行：
cd android && chmod +x gradlew && ./gradlew bundleRelease \
  -PRELEASE_STORE_FILE=/path/to/nexior-release.keystore \
  -PRELEASE_STORE_PASSWORD=your_password \
  -PRELEASE_KEY_ALIAS=nexior \
  -PRELEASE_KEY_PASSWORD=your_password
```

产出文件在 `android/app/build/outputs/bundle/release/app-release.aab`，上传到 Play Console → **Internal testing**。

### 7. 触发 CI 构建

```bash
# 方式 1：打 tag 自动触发（默认推到 internal track）
git tag android-v3.29.5 && git push origin android-v3.29.5

# 方式 2：GitHub Actions 页面 → Build Android → Run workflow → 选择 track
#   internal  → 内部测试
#   alpha     → 封闭测试
#   beta      → 公开测试
#   production → 正式发布
```

---

## 二、App Store（iOS）

### 1. Apple Developer Program

- 前往 https://developer.apple.com/programs/ 加入（$99/年）
- 注册后记录 **Team ID**（10 位字母数字）

### 2. 创建 App ID + Provisioning Profile

1. Apple Developer → **Certificates, Identifiers & Profiles**
2. **Identifiers** → 新建 App ID，Bundle ID = `com.acedatacloud.nexior`
3. **Certificates** → 创建 **Apple Distribution** 证书，下载 `.cer` 并双击安装到 Keychain
4. **Profiles** → 新建 **App Store Connect** Distribution Profile，选择上面的证书和 App ID

### 3. 导出 P12

1. 打开 Mac **Keychain Access**
2. 找到刚安装的 Apple Distribution 证书
3. 右键 → **Export** → 保存为 `.p12`（设置导出密码）
4. Base64 编码：

```bash
base64 -i Certificates.p12 | tr -d '\n' > cert.b64
```

### 4. Base64 编码 Provisioning Profile

```bash
base64 -i AceData_AppStore.mobileprovision | tr -d '\n' > profile.b64
```

### 5. 创建 App Store Connect API Key

1. 前往 https://appstoreconnect.apple.com → **Users and Access** → **Integrations** → **App Store Connect API**
2. 点 **Generate API Key**，Role 选 **App Manager**
3. 下载 `.p8` 文件，记录 **Key ID** 和 **Issuer ID**
4. Base64 编码：

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' > key.b64
```

### 6. 设置 GitHub Secrets

| Secret | 值 |
|---|---|
| `IOS_P12_BASE64` | P12 证书的 base64 内容 |
| `IOS_P12_PASSWORD` | 导出 P12 时设置的密码 |
| `IOS_PROVISIONING_PROFILE_BASE64` | Provisioning Profile 的 base64 内容 |
| `IOS_PROVISIONING_PROFILE_NAME` | Profile 名称（Apple Developer 页面上显示的） |
| `IOS_TEAM_ID` | Apple Developer Team ID |
| `APP_STORE_CONNECT_KEY_ID` | API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID |
| `APP_STORE_CONNECT_KEY_BASE64` | `.p8` 文件的 base64 内容 |

### 7. 在 App Store Connect 创建 App

- https://appstoreconnect.apple.com → **My Apps** → **+** → Bundle ID 选 `com.acedatacloud.nexior`

### 8. 触发 CI 构建

```bash
# 方式 1：打 tag 自动触发
git tag ios-v3.29.5 && git push origin ios-v3.29.5

# 方式 2：GitHub Actions 页面 → Build iOS → Run workflow
```

构建完成后 IPA 自动上传到 TestFlight，审核通过后可发布到 App Store。

---

## 三、日常发版流程

```bash
# 1. 更新 package.json 版本号（通过 beachball 或手动修改）

# 2. 同步版本到 Android + iOS native 项目
npm run sync-version

# 3. 提交版本变更
git add -A && git commit -m "chore: bump version to x.y.z"

# 4. 打 tag 触发 CI
git tag android-vX.Y.Z && git tag ios-vX.Y.Z
git push origin android-vX.Y.Z ios-vX.Y.Z
```

Android 可通过 GitHub Actions 手动选择 track 逐步放量：`internal → alpha → beta → production`。

---

## 四、GitHub Secrets 清单

| Secret | 用途 | 平台 |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | 签名密钥库 | Android |
| `ANDROID_KEYSTORE_PASSWORD` | 密钥库密码 | Android |
| `ANDROID_KEY_ALIAS` | 密钥别名 | Android |
| `ANDROID_KEY_PASSWORD` | 密钥密码 | Android |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play Store 上传凭证 | Android |
| `IOS_P12_BASE64` | 签名证书 | iOS |
| `IOS_P12_PASSWORD` | 证书密码 | iOS |
| `IOS_PROVISIONING_PROFILE_BASE64` | 描述文件 | iOS |
| `IOS_PROVISIONING_PROFILE_NAME` | 描述文件名称 | iOS |
| `IOS_TEAM_ID` | 开发者团队 ID | iOS |
| `APP_STORE_CONNECT_KEY_ID` | API Key ID | iOS |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID | iOS |
| `APP_STORE_CONNECT_KEY_BASE64` | API Key 文件 | iOS |

---

## 五、Live Update（OTA 热更新 / `@capgo/capacitor-updater`）

App 通过 `@capgo/capacitor-updater` 从 COS 自托管的 manifest 拉新 `dist/` bundle，实现免商店审核的前端代码热更新（仅 JS/HTML/CSS，符合 Apple/Google 政策）。

> **当前 PR**（feat/ota-client）只接入了客户端 SDK，发布流水线还未自动化。手动发布 OTA 流程见下文；CI 集成在后续 PR 中完成。

### 启用

构建时设置环境变量（默认关闭，合并后不会立即生效）：

```bash
# .env.production / GitHub Actions 环境变量
VITE_LIVE_UPDATE_ENABLED=true
VITE_LIVE_UPDATE_BASE_URL=https://cdn.acedata.cloud/nexior/updates   # 可选，默认值
VITE_LIVE_UPDATE_CHANNEL=stable                                       # 可选，默认 stable
```

App 启动时会异步检查 manifest，发现新版本则后台下载并切换到下次冷启动生效。任何环节失败都安静跳过，不影响启动。

### COS 目录布局

```
acedatacloud2-1256437459/      # COS bucket
└── nexior/updates/
    ├── stable/
    │   ├── ios.json           # 当前 stable iOS manifest
    │   ├── android.json       # 当前 stable Android manifest
    │   └── bundles/
    │       ├── 3.35.3.zip     # zipped dist/
    │       └── 3.35.4.zip
    └── beta/                  # 预留：灰度通道
        ├── ios.json
        └── android.json
```

公开 CDN URL：`https://cdn.acedata.cloud/nexior/updates/...`

### Manifest 格式

`stable/ios.json` 示例：

```json
{
  "version": "3.35.3",
  "url": "https://cdn.acedata.cloud/nexior/updates/stable/bundles/3.35.3.zip",
  "checksum": "ZGVhZGJlZWY...",
  "min_native_version": "3.35.2"
}
```

字段说明：

| 字段 | 必填 | 含义 |
|---|---|---|
| `version` | 是 | bundle 版本号。客户端只在 `version > 当前运行的 bundle.version` 时下载。 |
| `url` | 是 | bundle zip 的绝对 https URL。 |
| `checksum` | 是 | bundle zip 的 sha256 (base64 编码)。客户端激活前校验，不匹配则丢弃。 |
| `min_native_version` | 否 | 兼容的最低原生壳版本。低于此版本的安装会跳过此 bundle（由 `app-version` 闸门处理强升）。 |

### 发布一个 OTA（`publish-ota` 工作流）

通过 `.github/workflows/publish-ota.yaml` 一键发布，iOS 和 Android 同步生效。

**触发方式：** GitHub Actions → `publish-ota` → Run workflow。

**参数：**

| 参数 | 默认 | 说明 |
|---|---|---|
| `version` | — | bundle 版本号，必须严格大于客户端当前运行版本才会生效。 |
| `channel` | `stable` | `stable` 或 `beta`。 |
| `min_native_version` | 空 | 可选。原生壳低于此版本的安装跳过本 bundle，由 `app-version` 闸门接管强升。 |
| `platforms` | `ios,android` | 同时写入哪些 manifest。dist 是平台无关的同一份 zip，默认两端一起更新。 |
| `dry_run` | false | 只打印计划上传的 key + manifest 内容，不实际 PUT。 |

**工作流做的事：**

1. `npm ci && VITE_LIVE_UPDATE_ENABLED=true npm run build` 生成 `dist/`。
2. zip 整个 `dist/` 为 `<version>.zip`。
3. `pip install cos-python-sdk-v5`，然后跑 `scripts/publish_ota_bundle.py`，由它：
   - 计算 zip 的 sha256（base64）作为 `checksum`；
   - 上传 zip 到 `cos://<bucket>/nexior/updates/<channel>/bundles/<version>.zip`（`Cache-Control: public, max-age=31536000, immutable`）；
   - 上传 `ios.json` 和 `android.json`（同一份 manifest 内容）到 `cos://.../<channel>/<platform>.json`（`Cache-Control: public, max-age=60`，让回滚秒级生效）。
4. 同时把 zip 作为 workflow artifact 保留 30 天，便于排查。

**需要的 repo secrets：** `TENCENT_CLOUD_SECRET_ID`、`TENCENT_CLOUD_SECRET_KEY`。

> dist 是同一份 web bundle，iOS WKWebView 和 Android WebView 直接复用，所以两端共享同一个 zip URL，只是 manifest 文件名不同。需要让 iOS 单独停留在某个旧版本时，把 `platforms` 改成 `android` 单跑即可。

### 回滚

把 `*.json` 改回上一版本的 manifest 即可。下次冷启动 App 会发现 `manifest.version <= current` 自动跳过下载，但 **不会自动回滚已激活的更新**——这需要发一个 `version` 比当前高的 manifest，指向旧 zip。如需立即回滚已激活的坏 bundle，需要在新 manifest 里 `version` 写一个比坏 bundle 更高的值，`url` 指向上一个好 zip。

### Apple / Google 合规要点

- 只热更新 web 资源（`dist/` 内容），**绝不**改 native 代码、不下载可执行二进制、不绕过 App Review 添加新功能（已审核功能的 bugfix / 文案 / UI 调整 OK）。
- `@capgo/capacitor-updater` 在 iOS 上使用 WKWebView 加载本地文件，符合 [App Store Guideline 3.3.2](https://developer.apple.com/app-store/review/guidelines/#3.3.2) 关于解释性代码的例外条款（与 React Native CodePush、Expo Updates 同类机制）。
- 引入大版本特性时仍需走商店审核 + 提升 `app-version` 接口里的 `min_supported`。

## 六、Stripe（Android 原生 PaymentSheet）

Android 客户端通过 `@capacitor-community/stripe` 调起 Stripe 原生 PaymentSheet，
而不是再用 `window.open(pay_url)` 跳浏览器。后端为 Android 下单时返回的是
`PaymentIntent client_secret`（写在 `order.metadata.stripe_client_secret` 里），
而不是 PaymentLink 的 URL。

> **iOS 不启用此通道**：iOS bundle 仍按 App Store Review Guideline 3.1.1 完全隐
> 藏 Stripe / 微信 / 支付宝入口（`showPayment(): !isIOS()`）。Stripe Android 与
> iOS IAP 是两条独立的轨道。

### 构建环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | 是（Android build） | Stripe Dashboard → 开
发者 → API 密钥里取的 `pk_live_*` / `pk_test_*` 可发布密钥。**只用 publishable
key**，绝不在前端嵌入 secret key。未设置时下单流程仍会成功，但 PaymentSheet 不会
弹出（仅在控制台打 `VITE_STRIPE_PUBLISHABLE_KEY is not configured` 错误）。 |

`pk_live_*` 与生产 PayBackend 的 `STRIPE_LIVE_SECRET_KEY` 必须属于**同一个**
Stripe 账户，否则 client_secret 会被 SDK 拒绝（`No such payment_intent`）。

### 链路

```
Nexior (Android)                PlatformBackend           PayBackend           Stripe
  └─ onPay(payWay=Stripe,
          surface=android)
        ──► POST /orders/:id/pay
              └─ create_stripe_payment_intent
                    ──► POST /payment/stripe/intent
                          └─ stripe.PaymentIntent.create
                                ◄── { id: pi_xxx, client_secret }
                    ◄── 同上
              └─ order.pay_id = pi_xxx
                 order.metadata.stripe_client_secret = ...
              ◄── Order with metadata
        ◄── 同上
  └─ StripePay.vue watches visible:
        └─ Stripe.initialize(publishableKey)
        └─ Stripe.createPaymentSheet({ paymentIntentClientSecret })
        └─ Stripe.presentPaymentSheet()
              └─ user 完成 ──► Stripe 直接结算 ──► PaymentIntent.status = succeeded
        └─ onRefresh() 立即拉一次 GET /orders/:id
              └─ PlatformBackend → PayBackend GET /payment/stripe/pi_xxx
                    └─ stripe.PaymentIntent.retrieve → succeeded → state=SUCCESS
              └─ Order.state = PAID
```

PC / WAP 浏览器走的仍是旧的 PaymentLink 路径（`pay_url = https://buy.stripe.com/
...`），后端通过 `surface == "android"` 区分。
