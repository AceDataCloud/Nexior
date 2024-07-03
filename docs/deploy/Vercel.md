# 利用 Vercel 快速搭建 Nexior AI 平台

[Nexior](https://github.com/AceDataCloud/Nexior) 是 GitHub 上的一个开源项目，利用它我们可以一键部署自己的 AI 应用站点，包括 AI 问答、Midjourney 绘画、知识库问答、艺术二维码等应用，无需自己开发 AI 系统、无需采购 AI 账号、无需关心 API 支持、无需配置支付系统，零启动成本，无风险通过 AI 赚取收益。

本文章会介绍 Nexior 项目在 Vercel 上的部署流程，无需任何编程技巧即可几分钟部署一套属于自己的 AI 站点，并轻松利用该站点获取收益。

## 准备

首先打开 Nexior 的 GitHub 仓库，地址为：[https://github.com/AceDataCloud/Nexior](https://github.com/AceDataCloud/Nexior)，然后注册或登录 GitHub 账号，点击 Fork，克隆一份代码到自己的本地仓库，如图所示：

![](https://cdn.acedata.cloud/3zf2hx.png)

Fork 完毕之后，我们便可以得到如下自己的个人仓库，如下：

![](https://cdn.acedata.cloud/bcxmlc.png)

这里的示例账号是 Germey，所以可以看到这里我们就 Fork 到了 Germey 这个用户下，同时有一个 forked from [AceDataCloud/Nexior](https://github.com/AceDataCloud/Nexior) 的字样，这样准备工作就完成了。

## Vercel 部署

Vercel 是一个可以帮助快速部署项目网站的平台，我们可以利用它直接和 GitHub 仓库对接，然后把 GitHub 仓库的源代码快速部署到线上，下面介绍下 Vercel 部署 Nexior 项目的流程。

打开 [https://vercel.com/](https://vercel.com/)，使用 GitHub 登录。

我们便会看到类似如下的页面，这时候点击 Import 按钮，如图所示：

<p><img src="https://cdn.acedata.cloud/jjcnnq.png" width="600" class="m-auto"></p>

此时，Vercel 便展示了你的 GitHub 仓库，选择刚才 Fork 的 Nexior 仓库即可，如图所示：

<p><img src="https://cdn.acedata.cloud/38advc.png" width="600" class="m-auto"></p>

找到 Nexior 仓库之后，点击 Import 按钮导入。

接着便会弹出一个配置页面，完全保持默认配置，点击 Deploy 按钮，如图所示：

<p><img src="https://cdn.acedata.cloud/6kvz1p.png" width="600" class="m-auto"></p>

点击 Deploy 之后，Vercel 便开始构建整个项目并进行部署，我们不需要做任何操作，只需等待 1-2 分钟左右即可，如图所示：

![](https://cdn.acedata.cloud/1i9ss8.png)

部署完毕之后，Vercel 便会弹出一个页面恭喜你的部署已经完成，此时你就成功把 Nexior 项目部署到你的线上环境了，如图所示：

![](https://cdn.acedata.cloud/qn8ndd.png)

点击 Continue to Dashboard，我们便可以看到 Vercel 为我们生成的预览域名，如图所示：

![](https://cdn.acedata.cloud/c9p0r2.png)

此时直接打开这个链接，比如这里的样例地址是 [https://nexior-germeys-projects.vercel.app/](https://nexior-germeys-projects.vercel.app/)，打开之后，我们便可以看到 Nexior 项目的运行情况了。

打开之后注册登录一下，比如用邮箱、GitHub 登录都是可以的，登录完毕之后便可以看到一个配置页面，比如 Site Configuration，我们可以自行修改该站点的标题、Logo、Favicon、管理员等信息，如下图所示：

<p><img src="https://cdn.acedata.cloud/o4fuy6.png" width="600" class="m-auto"></p>

同时还有一个比较重要的部分就是分销推广的配置，如图所示：

<p><img src="https://cdn.acedata.cloud/d8c4md.png" width="600" class="m-auto"></p>

这里我们可以修改两个信息，一个叫默认邀请人 ID、一个叫强制邀请人 ID，说明如下：

- 默认邀请人 ID：如果只设置了默认邀请人 ID，那么人人都可以分销和推广该站点，谁邀请的客户，客户的消费返利都会给到邀请人。如果站点的 URL 不携带任何推广信息的时候（URL 里面没有 inviter_id）的时候，注册用户默认情况下都会绑定到这个默认邀请人 ID 上。初始状态下这个 ID 就是站长的个人 ID。
- 强制邀请人 ID：如果设置了强制邀请人 ID，那么除了这个强制邀请人，其他人都无法从该站点获得分销返利，后台也看不到分销推广的入口。该站点所有注册用户都会被绑定到这个强制邀请人上面，所有的消费返利都是强制邀请人的。

所以，对于以上两个模式，取决于站长的推广思路，视情况而定。

另外还有一个配置选项就是功能开关，如图所示：

<p><img src="https://cdn.acedata.cloud/zwi7hu.png" width="600" class="m-auto"></p>

目前 Nexior 提供了多个功能，站长可以选择性地打开或关闭某些特定功能。

## 自定义域名

现在我们已经成功部署了一个网站，但是域名是 Vercel 为我们分配的二级域名，其实并不利于对外推广，如果能够修改为我们的自定义域名的话就会好很多。

比如说我这边有一个 [https://chictem.com](https://chictem.com) 的域名，下面介绍下自定义域名的配置。

> 如果没有域名，可以到各大域名厂商注册，例如 [namecheap](https://www.namecheap.com/)、[Godaddy](https://godaddy.com/) 等，一些中国境内服务商也可以。

接下来我们打开 Vercel 的自定义域名配置页面：

![](https://cdn.acedata.cloud/6mqomk.png)

此处输入你想要配置的自定义域名，比如这里示例配置为 [https://chictem.com](https://chictem.com)，就直接填写 chictem.com，不带 `https://` 前缀，点击 Add：

![](https://cdn.acedata.cloud/v7idkv.png)

接下来 Vercel 提示要选择域名配置的选项，推荐我们也添加一个 www 开头的域名，这个可加可不加，添加了之后就可以 www 开头的域名也能访问到此网站。这里我们直接选择最后一项直接添加根域名：

<p><img src="https://cdn.acedata.cloud/zmdx31.png" width="600" class="m-auto"></p>

确定之后我们就发现这里提示有一个待配置的 DNS：

![](https://cdn.acedata.cloud/fu7rt7.png)

这里让我们添加一个 A 记录，解析到 76.76.21.21，我们这时候需要转到域名服务商这里配置下 DNS。

> 注意：域名服务商取决于你在哪个网站域名买的域名，通常来说你在哪个网站买的域名，网站后台就有配置 DNS 的入口。

下面是一个 DNS 后台配置样例：

![](https://cdn.acedata.cloud/isy712.png)

配置完毕之后，我们就能用自定义域名访问刚配置的网站了，如图所示：

![](https://cdn.acedata.cloud/ui08w3.png)

> 注意：配置了新域名之后，注意我们需要进入到站点配置页面重新配置下站点标题、Logo 等选项，因为这个配置是跟域名绑定的，启用了新域名之后需要新配置站点。

## 代码更新

因为 Nexior 的源代码是在持续更新的，可能不断有新的功能或者 Bug 修复，代码会直接同步到源代码仓库 [https://github.com/AceDataCloud/Nexior](https://github.com/AceDataCloud/Nexior) 这里。

那我们部署的站点如果想同步更新最新代码，应该怎么做呢？

其实很简单，回到 GitHub 里面我们 Fork 的代码仓库，这里可以看到我们原本 Fork 的代码仓库已经落后于官方 Nexior 源代码几个版本了，我们可以直接点击 Sync fork 按钮，然后点击 Update branch 就可以了：

![](https://cdn.acedata.cloud/zs9tgq.png)

点击之后，我们 fork 的仓库的代码就会更新，代码更新之后，Vercel 这边的网站也会自动更新，稍等片刻重新刷新网页就发现网站更新了。

## 赚取收益

现在我们已经有了自定义域名，配置好如上内容之后，就可以把这个站点分享出去赚钱啦！

所有的用户只要有付费账单，其中有一部分便会转化为收益到达分销者的账户，到时候添加客服提现即可。

进入分销界面，可以随时查看当前邀请人数、分销总金额、总奖励等，直接添加客服提现即可。

<p><img src="https://cdn.acedata.cloud/zo05gl.png" width="600" class="m-auto"></p>
