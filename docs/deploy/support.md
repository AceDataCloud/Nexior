# Help and feedback

Studio displays a **Support** button at the bottom right of its main pages. It opens a single dialog with the current site's contacts, visible QR codes, feedback access, and content reporting. The button moves above the chat composer when they would overlap and hides while a mobile keyboard is open.

In **Settings → Site → Customer support contacts**, configure the channels you operate:

- **WeChat**: upload the QR code. It appears immediately when the dialog opens.
- **Phone / Email**: enter the actual contact value. Visitors can call or compose email directly.
- **Business hours** (`hours`): enter the actual working hours and time zone as the display text. An unset value does not create an availability promise.
- **Feedback** (`feedback`): enter an HTTP(S) link to your existing feedback form or service desk. If absent, the feedback action uses this site's configured support link or email. A site with QR-only contacts guides visitors to those contacts; it does not pretend a feedback submission was created.

These entries use the existing `Site.branding.contacts` configuration. Feedback falls back to `Site.branding.links.support` and then the site's email; it never substitutes another site's contacts. Welcome text uses the current site name.

Reporting requires sign-in. From the floating entry, visitors supply a task ID or content link so a moderator can identify the content. The existing result-level Report button continues to attach its task/message context automatically. Both use the same report form and existing API. The floating dialog shows the persisted report ID after a successful submission.

Configuring a link here does not enable the destination service. Configure the Feishu/Lark ISV feedback feature and service desk separately, and verify notification delivery and actual handling before claiming a response commitment. This change does not add a new ticketing backend or modify report notification subscriptions.

## 帮助与反馈

Studio 主页面右下角显示“客服”悬浮按钮，点击后以一个弹窗直接展示当前站点的联系方式和二维码，并提供意见反馈与内容举报。

在 **设置 → 站点 → 客服联系方式** 中配置微信、电话、邮箱；新增的“工作时间”类型用于填写实际时间及时区，“意见反馈”类型用于填写已开通的反馈表单或服务台链接。没有专用反馈链接时，使用本站支持链接或邮箱；只有二维码时，引导用户通过该客服渠道反馈。

举报需登录，从悬浮入口提交时需提供任务编号或内容链接，成功后显示实际举报编号。飞书后台开通、客服值守与通知送达仍需单独配置和验证。
