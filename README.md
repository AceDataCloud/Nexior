<div align="center">

# Nexior

### The open-source, self-hostable **all-in-one AI app**

**Every model in one app — ChatGPT · Claude · Gemini · Grok · DeepSeek · Midjourney · Flux · Suno · Sora · Veo · Kling · Seedance — deploy your own in minutes. BYOK or one-key. MIT licensed.**

一个开源、可自托管的**全能 AI 应用** —— 聊天 / 图片 / 音乐 / 视频 的所有模型,一处搞定。几分钟部署你自己的,BYOK 或一键直用,MIT 协议。

<p>
  <a href="https://hub.acedata.cloud">🚀 Live Demo</a> ·
  <a href="#-quick-start">⚡ Deploy in minutes</a> ·
  <a href="https://platform.acedata.cloud">🔑 Free API key</a> ·
  <a href="https://platform.acedata.cloud/support">💬 Support</a> ·
  <a href="#-star-us">⭐ Star us</a>
</p>

<p>
  <img alt="stars" src="https://img.shields.io/github/stars/AceDataCloud/Nexior?style=flat&color=blueviolet" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat" />
  <img alt="vue" src="https://img.shields.io/badge/Vue-3.5-42b883?style=flat&logo=vuedotjs&logoColor=white" />
  <img alt="capacitor" src="https://img.shields.io/badge/iOS%20%2B%20Android-Capacitor-119EFF?style=flat&logo=capacitor&logoColor=white" />
  <img alt="deploy" src="https://img.shields.io/badge/deploy-Vercel%20%7C%20Docker-black?style=flat&logo=vercel" />
</p>

</div>

---

## 🎯 What is Nexior

**Nexior is the open-source app that puts every major AI model behind one clean UI — and lets you self-host it or ship it as your own product.** Web, iOS, and Android from a single codebase (Vue 3.5 + Capacitor). No AI accounts to buy, no backend to build, no payment system to wire — point it at your own keys (BYOK) or use a single [AceData](https://platform.acedata.cloud) key for all of them, and you're live.

- 🧠 **40+ models, 4 modalities, one app** — chat, image, music, video.
- 🖥️ **Self-host anywhere** — one-click Vercel, or `docker compose up`. Your data, your domain.
- 🔑 **BYOK or one-key** — bring your own provider keys, or use a single AceData key for all of them.
- 💸 **Turn it into a business (optional)** — built-in user accounts, payments, and a referral/distribution system. Zero extra config.
- 📦 **MIT licensed** — fork it, brand it, ship it.

> Built and maintained by [AceDataCloud](https://platform.acedata.cloud). Powers the live consumer app at [hub.acedata.cloud](https://hub.acedata.cloud).

**Nexior 是把所有主流 AI 模型收进一个干净界面的开源应用 —— 可自托管,也可直接做成你自己的产品。** Web / iOS / Android 同一套代码(Vue 3.5 + Capacitor)。无需采购 AI 账号、无需搭后端、无需配支付:用你自己的 key(BYOK),或用一个 AceData key 直接全用,几分钟上线。

---

## ✨ Models in the box

| Modality | Models |
|---|---|
| 💬 **AI Chat** | ChatGPT · Claude · Gemini · Grok · DeepSeek |
| 🖼️ **AI Image** | Midjourney · Flux · OpenAI Image · Seedream · NanoBanana · QR Art · Headshots |
| 🎵 **AI Music** | Suno |
| 🎬 **AI Video** | Sora · Veo · Kling · Luma · Hailuo · Pixverse · Seedance · Pika |

All capabilities ship with a **free trial** — no credit card to try.

---

## ⚡ Quick start

### Option A — One-click deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://platform.acedata.cloud/documents/5b942c64-5612-4aab-ab3c-9e58b64cb069)

### Option B — Docker (self-host)
```bash
git clone https://github.com/AceDataCloud/Nexior.git
cd Nexior
cp .env.example .env        # set your AceData key (or BYOK provider keys)
docker compose up -d
# → http://localhost:8084
```

### Option C — Local dev
```bash
npm install
cp .env.example .env.local
npm run dev
```

Get a key (free quota) at **[platform.acedata.cloud](https://platform.acedata.cloud)**. Full guides → [`docs/deploy/`](docs/deploy/).

---

## 🚀 Launch your own AI product (optional)

Nexior isn't just a client — it's a complete **AI-SaaS starter**. Every deployment ships with:

- 👤 **User system** — email login/registration, out of the box.
- 💳 **Payments** — accept payments with zero extra config.
- 🤝 **Referral / distribution** — registered users bind permanently to the site owner; their spend pays you a commission. Withdraw anytime.

Deploy once, and `your-domain.com` is a revenue-ready AI product. Zero startup cost, zero AI accounts to manage.

> 本系统支持客源绑定机制:每个网站的注册用户可永久绑定为站长的下级客户,其在平台的所有消费按分销比例返还到你的账户,可随时提现。

---

## 🖼️ Preview

| Chat (ChatGPT) | Image (Midjourney) | Music (Suno) | Video (Sora) |
|---|---|---|---|
| ![chat](https://cdn.acedata.cloud/wqzm9r.png) | ![mj](https://cdn.acedata.cloud/0oqva0.png) | ![suno](https://cdn.acedata.cloud/999o20.png) | ![sora](https://cdn.acedata.cloud/r1cmvk.png) |

<details>
<summary>More previews (DeepSeek · Grok · Gemini · NanoBanana · Flux · Veo · Kling · Hailuo · Luma · Midjourney)</summary>

| | |
|---|---|
| DeepSeek Chat ![](https://cdn.acedata.cloud/sqe72j.png) | Grok Chat ![](https://cdn.acedata.cloud/5cl1ea.png) |
| Gemini Chat ![](https://cdn.acedata.cloud/6l28bw.png) | Nano Banana ![](https://cdn.acedata.cloud/j0h3l3.png) |
| Flux ![](https://cdn.acedata.cloud/b18s04.png) | Veo ![](https://cdn.acedata.cloud/rkzqx1.png) |
| Kling ![](https://cdn.acedata.cloud/gt5hv9.png) | Hailuo ![](https://cdn.acedata.cloud/c2jh0d.png) |
| Luma ![](https://cdn.acedata.cloud/q93b6q.png) | Midjourney ![](https://cdn.acedata.cloud/5u5tin.png) |

</details>

---

## 🧩 Tech stack

Vue 3.5 · Vite 7 · TypeScript · Vuex 4 (per-service namespaced modules) · Element Plus · Capacitor 6 (iOS + Android) · OAuth SSO.

---

## 💛 Star us

If Nexior saved you a weekend of wiring AI providers together, give it a ⭐.
Stars don't pay rent — but they tell the next builder, the next agent, and the next contributor that this is worth their attention. One click, three seconds, a real signal.

<a href="https://star-history.com/#AceDataCloud/Nexior&Date">
  <img alt="Nexior star history" src="https://api.star-history.com/svg?repos=AceDataCloud/Nexior&type=Date" width="70%" />
</a>

---

## 🤝 Community & support

- 🔑 Free API key & docs: <https://platform.acedata.cloud>
- 💬 Support: <https://platform.acedata.cloud/support>
- 🐦 Follow on X: [@acedatacloud](https://x.com/acedatacloud)
- 📧 Email: support@acedata.cloud
- 🐛 Issues & PRs welcome.

## 📄 License

MIT © [AceDataCloud](https://platform.acedata.cloud)
