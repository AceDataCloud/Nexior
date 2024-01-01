# ZhiShuYun Hub

集成 GPT 问答、Midjourney 绘画等一站式服务的系统，主要特点包括：

- 无需自行搭建 GPT 问答、Midjourney 服务 API，即开即用。
- 支持 GPT 3.5/4.0、联网版、图像版问答，可免费体验。
- 支持 Midjourney 快速、慢速、极速版多通道绘图，免费体验。
- 开箱支持支付和分销系统，无需任何额外配置即可利用 AI 赚钱。
- 开箱支持用户系统，支持微信、邮箱登录和注册，无需额外配置。
- 完全开源免费，配置简单，可直接部署为您自己的系统。
- 基于 Vue3 开发，采用 MIT 协议，可进行任意二次开发。

以上功能由[知数云](https://data.zhishuyun.com/)提供技术支持。

## 预览

AI 绘画：

![](https://cdn.zhishuyun.com/20240101-214257.png)

AI 问答：

![](https://cdn.zhishuyun.com/20240101-214017.png)

分销系统：

![](https://cdn.zhishuyun.com/20240101-214316.png)

体验网址：[https://hub.zhishuyun.com/](https://hub.zhishuyun.com/)，微信或邮箱登录即可立即使用。

## 开发配置

如果您想将源码部署为您自己的系统并进行赚钱，或者基于本系统进行二次开发，可参考下文。

### 1. 环境配置

安装 [Node.js](https://nodejs.org/en)、[git](https://git-scm.com/)、[yarn](https://yarnpkg.com/)。

### 2. 下载源码

```
git clone https://github.com/ZhiShuYun/HubFrontend.git
```

### 3. 配置

进入到源码文件夹：

```
cd HubFrontend
```

运行命令安装依赖：

```
yarn
```

运行：

```
yarn start
```

打开 [http://localhost:8080](http://localhost:8080) 即可查看效果。
