# 认证链路与部署检查

## 本轮修复

- `src/lib/auth.ts` 统一初始化、邮件回调和会话同步。SDK 自动 URL 检测关闭，避免 SDK 与回调页面同时消费一次性授权码。
- 支持默认邮件链接返回的 `access_token` / `refresh_token`、PKCE `code`，以及自定义模板的 `token_hash` + `type=magiclink|signup|email`。
- 回调先验证有效会话再导航；失效、已使用、缺少浏览器验证码上下文等错误显示可读提示。敏感参数处理后从地址栏清除。
- 登录与注册会显式同步返回的会话。注册无会话时显示“请验证邮箱”，有会话时直接进入首页。
- 注册邮件与魔法链接统一回到当前站点 `/auth/callback`。所有受保护路由等待初始化并读取当前真实认证状态，而非旧 Router context。
- 表单同步锁防重复提交，认证失败后解除等待状态并保留重试能力。

## Supabase 控制台必须核对

1. **Authentication → URL Configuration**
   - Site URL 设置为真实部署站点，不应是过期的 localhost 地址。
   - Redirect URLs 加入实际站点的 `https://你的域名/auth/callback`；开发环境可加 `http://localhost:5473/auth/callback` 和 `http://127.0.0.1:5473/auth/callback`。
   - 各子域、协议、端口不同，必须按实际使用地址配置。
2. **Authentication → Providers → Email**
   - 开启 Email provider；如需要注册则允许新用户注册。
   - 开启 Confirm email 时，密码注册会先等待验证，这是正常流程；关闭时可直接返回登录会话。
3. **Authentication → Email Templates**
   - Confirm signup 和 Magic Link 默认模板使用 `{{ .ConfirmationURL }}`。
   - 不要把链接只写成 `{{ .SiteURL }}` 或 `{{ .RedirectTo }}`：这些地址不会携带验证凭据，可能仅激活邮箱而无法在应用内建立会话。
   - 自定义直接验证模板可使用 `/auth/callback?token_hash={{ .TokenHash }}&type=signup` 或 `type=magiclink`，但需确认模板类型正确。
4. PKCE 链接需要在发起请求的同一浏览器中打开，跨浏览器或清除本地存储后需重新发起流程。应用默认邮件仍沿用 Supabase implicit flow，因此不强制新链接使用 PKCE。
5. 之前只通过魔法链接创建的账号可能没有密码。先使用魔法链接登录，在“我的”设置密码后再使用密码登录；重新注册不会为已有账号补上密码。
6. 旧链接可能过期或已被邮箱安全扫描器访问。部署更新后应重新发送邮件，使用最新链接。

## 验证边界

浏览器回归使用隔离模拟 Auth 响应验证提交、导航、会话持久化与各种失败状态，不发送真实邮件，不修改真实用户数据。
本地测试不能代替部署站点的重定向白名单、邮件模板、SMTP 和真实用户凭据验证。不要在日志或截图中提供链接里的访问令牌、刷新令牌或用户密码。
