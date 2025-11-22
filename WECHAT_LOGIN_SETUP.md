# 微信小程序登录配置指南

## 📋 概述

本项目支持微信小程序登录，通过 Supabase Edge Function 处理微信的 `code2Session` API。

## 🔧 配置步骤

### 1. 在 Supabase Dashboard 中配置环境变量

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目：`lafpbfjtbupootnpornv`
3. 进入 **Settings** → **Edge Functions** → **Secrets**
4. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `WECHAT_APP_ID` | `wxec9a529ef50c42a1` | 微信小程序AppID |
| `WECHAT_APP_SECRET` | `afb5c469d258c06cacdb67d711988f8d` | 微信小程序AppSecret |

**使用 Supabase CLI 设置（可选）：**

```bash
supabase secrets set WECHAT_APP_ID=wxec9a529ef50c42a1
supabase secrets set WECHAT_APP_SECRET=afb5c469d258c06cacdb67d711988f8d
```

### 2. 部署 Edge Function

```bash
cd /Users/chonghaoju/memoir-package
supabase functions deploy wechat-login --no-verify-jwt
```

### 3. 验证部署

部署成功后，Function URL 为：
```
https://lafpbfjtbupootnpornv.supabase.co/functions/v1/wechat-login
```

## 📱 小程序前端调用示例

### 1. 登录（Login）

如果用户已存在，直接登录；如果不存在，自动创建用户。

```javascript
// 在小程序中调用登录
wx.login({
  success: async (res) => {
    if (res.code) {
      const response = await wx.request({
        url: 'https://lafpbfjtbupootnpornv.supabase.co/functions/v1/wechat-login',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
        },
        data: {
          code: res.code,
          action: 'login' // 可选，默认为'login'
        },
        success: (res) => {
          console.log('登录成功:', res.data);
          // res.data 包含：
          // - user: 用户信息（包含id、email、user_metadata）
          // - openid: 微信openid
          // - unionid: 微信unionid（如果有）
          // - isNewUser: 是否为新用户
          // - action: 'login' 或 'register'
          // 注意：需要存储user.id，在后续API请求中作为userId参数传递
          wx.setStorageSync('userId', res.data.user.id);
        },
        fail: (err) => {
          console.error('登录失败:', err);
        }
      });
    }
  }
});
```

### 2. 注册（Register）

注册新用户，需要提供用户信息（昵称、头像等）。

```javascript
// 先获取用户信息
wx.getUserProfile({
  desc: '用于完善用户资料',
  success: (userInfoRes) => {
    // 然后获取登录code
    wx.login({
      success: async (loginRes) => {
        if (loginRes.code) {
          const response = await wx.request({
            url: 'https://lafpbfjtbupootnpornv.supabase.co/functions/v1/wechat-login',
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
            },
            data: {
              code: loginRes.code,
              action: 'register', // 注册操作
              nickname: userInfoRes.userInfo.nickName,
              avatar_url: userInfoRes.userInfo.avatarUrl,
              gender: userInfoRes.userInfo.gender, // 0:未知, 1:男, 2:女
              country: userInfoRes.userInfo.country,
              province: userInfoRes.userInfo.province,
              city: userInfoRes.userInfo.city
            },
            success: (res) => {
              if (res.data.error && res.data.userExists) {
                // 用户已存在，提示使用登录
                wx.showToast({
                  title: '用户已存在，请使用登录',
                  icon: 'none'
                });
              } else {
                console.log('注册成功:', res.data);
                wx.setStorageSync('userId', res.data.user.id);
              }
            },
            fail: (err) => {
              console.error('注册失败:', err);
            }
          });
        }
      }
    });
  }
});
```

### 使用 Supabase 客户端 SDK（推荐）

```javascript
// 安装 Supabase JS SDK
// npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lafpbfjtbupootnpornv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1. 获取微信code
wx.login({
  success: async (res) => {
    if (res.code) {
      // 2. 调用后端API获取用户信息
      const response = await fetch(
        'https://lafpbfjtbupootnpornv.supabase.co/functions/v1/wechat-login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: res.code })
        }
      );
      
      const data = await response.json();
      
      // 3. 存储用户ID，在后续API请求中使用
      // 存储到本地存储
      wx.setStorageSync('userId', data.user.id);
      wx.setStorageSync('openid', data.openid);
      
      // 后续调用API时，将userId作为参数传递
      // 例如：调用interviewer_smart API时，传递userId参数
    }
  }
});
```

## 🔐 API 接口说明

### POST `/functions/v1/wechat-login`

**请求体（登录）：**
```json
{
  "code": "微信小程序wx.login()返回的code",
  "action": "login"  // 可选，默认为"login"
}
```

**请求体（注册）：**
```json
{
  "code": "微信小程序wx.login()返回的code",
  "action": "register",
  "nickname": "用户昵称",  // 必需
  "avatar_url": "头像URL",  // 可选
  "gender": 1,  // 可选：0-未知, 1-男, 2-女
  "country": "国家",  // 可选
  "province": "省份",  // 可选
  "city": "城市"  // 可选
}
```

**成功响应：**
```json
{
  "user": {
    "id": "用户ID（openid或unionid）",
    "email": "虚拟邮箱（openid@wechat.miniprogram）",
    "user_metadata": {
      "provider": "wechat_miniprogram",
      "wechat_openid": "微信openid",
      "wechat_unionid": "微信unionid（如果有）",
      "last_login": "最后登录时间"
    }
  },
  "openid": "微信openid",
  "unionid": "微信unionid（如果有）",
  "isNewUser": true,  // 是否为新注册用户
  "action": "register"  // "login" 或 "register"
}
```

**错误响应（用户已存在时注册）：**
```json
{
  "error": "用户已存在，请使用登录功能",
  "userExists": true
}
```

**注意：** 返回的用户ID（`user.id`）应该被小程序存储，并在后续API请求中作为 `userId` 参数传递。后端API会验证用户ID是否存在于Supabase Auth中。
```

**错误响应：**
```json
{
  "error": "错误信息",
  "errcode": "微信错误码（如果有）"
}
```

## 🔄 用户登录/注册流程

### 登录流程（action: 'login'）
1. 小程序调用 `wx.login()` 获取 `code`
2. 将 `code` 和 `action: 'login'` 发送到 Edge Function
3. Edge Function 调用微信 `code2Session` API 获取 `openid` 和 `session_key`
4. 使用 `openid`（或 `unionid`，如果存在）作为用户唯一标识
5. 在 Supabase Auth 中查找用户
   - 如果用户存在：更新最后登录时间，返回用户信息
   - 如果用户不存在：自动创建新用户（使用默认信息）
6. 在 `users` 表中同步用户信息
7. 返回用户信息（用户ID、openid、unionid等）

### 注册流程（action: 'register'）
1. 小程序调用 `wx.getUserProfile()` 获取用户信息（昵称、头像等）
2. 小程序调用 `wx.login()` 获取 `code`
3. 将 `code`、`action: 'register'` 和用户信息发送到 Edge Function
4. Edge Function 调用微信 `code2Session` API 获取 `openid` 和 `session_key`
5. 使用 `openid`（或 `unionid`，如果存在）作为用户唯一标识
6. 检查用户是否已存在
   - 如果用户已存在：返回错误，提示使用登录
   - 如果用户不存在：创建新用户，保存用户提供的信息
7. 在 `users` 表中同步用户信息
8. 返回用户信息（用户ID、openid、unionid等）

## ⚠️ 注意事项

1. **登录 vs 注册**：
   - **登录（login）**：如果用户不存在，会自动创建（使用默认信息）。适合快速登录场景。
   - **注册（register）**：需要提供用户信息（昵称、头像等）。如果用户已存在会返回错误。适合首次注册场景。

2. **用户ID使用**：小程序应该存储返回的 `user.id`，并在后续所有API请求中作为 `userId` 参数传递。后端API会验证用户ID是否存在于Supabase Auth中。

3. **安全性**：
   - `WECHAT_APP_SECRET` 必须保密，只在服务器端使用
   - 不要在前端代码中暴露 AppSecret

4. **用户标识**：
   - 优先使用 `unionid`（如果存在）作为用户ID
   - 如果没有 `unionid`，使用 `openid` 作为用户ID

5. **数据库同步**：
   - 用户信息会自动同步到 `users` 表
   - 如果 `users` 表不存在，会记录警告但不影响登录

## 🧪 测试

```bash
# 使用curl测试（需要有效的code）
curl -X POST https://lafpbfjtbupootnpornv.supabase.co/functions/v1/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code_here"}'
```

注意：测试需要真实的微信小程序 `code`，只能在小程序环境中获取。

## 📚 相关文档

- [微信小程序登录文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions 文档](https://supabase.com/docs/guides/functions)

