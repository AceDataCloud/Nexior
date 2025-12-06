# 利用 Netlify 快速搭建 Nexior AI 平台

[Nexior](https://github.com/AceDataCloud/Nexior) 是 GitHub 上的一个开源项目，利用它我们可以一键部署自己的 AI 应用站点，包括 AI 聊天、Midjourney 绘画、知识库问答、艺术二维码等应用，无需自己开发 AI 系统、无需采购 AI 账号、无需关心 API 支持、无需配置支付系统，零启动成本，无风险通过 AI 赚取收益。

本文介绍如何利用 Netlify 将 Nexior 部署到线上，全程可视化操作，无需任何编程基础。

## 准备

1. 访问 Nexior 的 GitHub 仓库：[https://github.com/AceDataCloud/Nexior](https://github.com/AceDataCloud/Nexior)。
2. 登录或注册 GitHub 账号，点击 Fork 将仓库拷贝到自己的账户下。
3. Fork 完成后，我们会得到自己名下的 Nexior 仓库，后续 Netlify 会直接读取这个仓库。

## Netlify 部署

1. 打开 [https://www.netlify.com/](https://www.netlify.com/) 并使用 GitHub 登录。
2. 登录后在控制台点击 **Add new site**，选择 **Import an existing project**。
3. 在“Continuous Deployment”区域点击 **Deploy with Git provider**，选择 GitHub 授权访问。
4. 在仓库列表中找到刚才 Fork 的 Nexior 仓库并点击导入。
5. Netlify 会自动识别仓库根目录下的 `netlify.toml`，默认构建配置即可使用：
   - Build command: `vite build --mode=development`
   - Publish directory: `dist`
6. 点击 **Deploy site**。构建与发布过程通常需要 1-2 分钟，完成后会看到一个 `*.netlify.app` 的预览域名。

打开预览域名即可体验 Nexior，注册并登录后即可进行站点配置（站点标题、Logo、管理员等）。

## 绑定自定义域名

1. 在 Netlify 项目页左侧导航选择 **Domain settings**，点击 **Add custom domain**。
2. 填入购买好的域名（不带 `https://`），确认后按提示在域名服务商处添加 DNS 记录：
   - 添加一条 CNAME 记录指向 Netlify 分配的域名，或使用 A/ALIAS 记录指向 Netlify 提供的 IP。
3. DNS 生效后，自定义域名即可访问站点。绑定新域名后，建议重新进入站点配置页面更新站点标题、Logo 等与域名相关的配置。

## 代码更新

Nexior 源码会持续更新。如果想让已部署站点获得最新功能：

1. 回到 Fork 后的 GitHub 仓库，点击 **Sync fork** 或 **Update branch** 与上游同步。
2. 同步完成后，Netlify 会自动重新构建并发布，稍等片刻刷新页面即可看到更新。

## 赚取收益

配置好站点后，将链接分享给用户即可开始获得分销收益。所有用户的付费账单会按配置返利至对应邀请人，分销界面可以查看邀请人数、总金额、奖励等信息，联系站点客服即可提现。
