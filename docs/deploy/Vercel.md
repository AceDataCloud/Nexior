# Nexior 在 Vercel 上的部署

本文章会介绍 Nexior 项目在 Vercel 上的部署流程，无需任何编程技巧即可几分钟部署一套属于自己的 AI 站点，并轻松利用该站点获取收益。

## 准备

首先打开 https://github.com/AceDataCloud/Nexior，登录 GitHub 账号，然后点击 Fork，克隆一份代码到自己的本地仓库，如图所示：

![](https://cdn.acedata.cloud/3zf2hx.png)

我们便可以得到如下自己的个人仓库，如下：

![](https://cdn.acedata.cloud/bcxmlc.png)

可以看到这里我们就 Fork 到了 Germey 这个用户下，同时有一个 forked from [AceDataCloud/Nexior](https://github.com/AceDataCloud/Nexior) 的字样，这样准备工作就完成了。

## Vercel 部署

接着打开 https://vercel.com/，使用 Github 登录。

我们便会看到类似如下的页面，这时候点击 Import 按钮，如图所示：

![image-20240618231428610](https://cdn.acedata.cloud/jjcnnq.png)

此时，Vercel 便展示了你的 GitHub 仓库，选择刚才 Fork 的 Nexior 仓库即可，如图所示：

![](https://cdn.acedata.cloud/38advc.png)

找到 Nexior 仓库之后，点击 Import 按钮导入。

接着便会弹出一个配置页面，完全保持默认配置，点击 Deploy 按钮，如图所示：

![image-20240618231538517](https://cdn.acedata.cloud/6kvz1p.png)

点击 Deploy 之后，Vercel 便开始构建整个项目并进行部署，我们不需要做任何操作，只需等待 1-2 分钟左右即可，如图所示：

![](https://cdn.acedata.cloud/1i9ss8.png)

部署完毕之后，Vercel 便会弹出一个页面恭喜你的部署已经完成，此时你就成功把 Nexior 项目部署到你的线上环境了，如图所示：

![](https://cdn.acedata.cloud/qn8ndd.png)

点击 Continue to Dashboard，我们便可以看到 Vercel 为我们生成的预览域名，如图所示：

![](https://cdn.acedata.cloud/c9p0r2.png)

此时直接打开这个链接，比如这里的样例地址是 https://nexior-germeys-projects.vercel.app/，打开之后，我们便可以看到 Nexior 项目的运行情况了。

打开之后注册登录一下，比如用邮箱、Github 登录都是可以的，登录完毕之后便可以看到一个配置页面，比如 Site Configutation，我们可以自行修改该站点的标题、Logo、Favicon、管理员等信息，如下图所示：

![](https://cdn.acedata.cloud/o4fuy6.png)

同时还有一个比较重要的部分就是分销推广的配置，如图所示：

![](https://cdn.acedata.cloud/d8c4md.png)

这里我们可以修改两个信息，一个叫默认邀请人 ID、一个叫强制邀请人 ID，说明如下：

* 默认邀请人 ID：如果只设置了默认邀请人 ID，那么人人都可以分销和推广该站点，谁邀请的客户，客户的消费返利都会给到邀请人。如果站点的 URL 不携带任何推广信息的时候（URL 里面没有 inviter_id）的时候，注册用户默认情况下都会绑定到这个默认邀请人 ID 上。初始状态下这个 ID 就是站长的个人 ID。
* 强制邀请人 ID：如果设置了强制邀请人 ID，那么除了这个强制邀请人，其他人都无法从该站点获得分销返利，后台也看不到分销推广的入口。该站点所有注册用户都会被绑定到这个强制邀请人上面，所有的消费返利都是强制邀请人的。

所以，对于以上两个模式，取决于站长的推广思路，视情况而定。

另外还有一个配置选项就是功能开关，如图所示：

![image-20240618232038168](https://cdn.acedata.cloud/zwi7hu.png)

目前 Nexior 提供了多个功能，站长可以选择性地打开或关闭某些特定功能。

## 赚钱

配置好如上内容之后，就可以把这个站点分享出去赚钱啦！

所有的用户只要有付费账单，其中有一部分便会转化为收益到达分销者的账户，到时候添加客服提现即可。