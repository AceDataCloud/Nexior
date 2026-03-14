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
