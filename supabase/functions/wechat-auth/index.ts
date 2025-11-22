// 微信OAuth登录处理函数
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface WeChatTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

interface WeChatUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // 获取环境变量
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const wechatAppId = Deno.env.get('WECHAT_APP_ID')!;
    const wechatAppSecret = Deno.env.get('WECHAT_APP_SECRET')!;
    const redirectUri = Deno.env.get('WECHAT_REDIRECT_URI') || `${supabaseUrl.replace('/functions/v1', '')}/auth/v1/callback`;

    if (!wechatAppId || !wechatAppSecret) {
      return new Response(
        JSON.stringify({ error: '微信配置未设置，请在Supabase Dashboard中配置WECHAT_APP_ID和WECHAT_APP_SECRET' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 获取授权URL（重定向到微信登录）
    if (action === 'getAuthUrl' || !action) {
      const state = crypto.randomUUID();
      const scope = 'snsapi_userinfo'; // 需要用户授权，获取用户信息
      const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${wechatAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;

      return new Response(
        JSON.stringify({ 
          authUrl,
          state 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 处理微信回调（通过code获取access_token和用户信息）
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code) {
        return new Response(
          JSON.stringify({ error: '缺少授权码' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 通过code获取access_token
      const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${wechatAppId}&secret=${wechatAppSecret}&code=${code}&grant_type=authorization_code`;
      
      const tokenResponse = await fetch(tokenUrl);
      const tokenData: WeChatTokenResponse = await tokenResponse.json();

      if (tokenData.errcode || !tokenData.access_token) {
        console.error('获取access_token失败:', tokenData);
        return new Response(
          JSON.stringify({ error: '获取微信访问令牌失败', details: tokenData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 获取用户信息
      const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;
      const userInfoResponse = await fetch(userInfoUrl);
      const userInfo: WeChatUserInfo = await userInfoResponse.json();

      if (userInfo.errcode || !userInfo.openid) {
        console.error('获取用户信息失败:', userInfo);
        return new Response(
          JSON.stringify({ error: '获取微信用户信息失败', details: userInfo }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 使用Supabase Service Role创建或更新用户
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // 使用openid作为唯一标识符
      const userId = userInfo.unionid || userInfo.openid;
      const email = `${userId}@wechat.local`; // 虚拟邮箱，因为微信没有提供邮箱

      // 检查用户是否已存在
      const { data: existingUser } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: { user: null } }));

      let authUser;
      if (existingUser?.user) {
        // 更新现有用户
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              provider: 'wechat',
              wechat_openid: userInfo.openid,
              wechat_unionid: userInfo.unionid,
              nickname: userInfo.nickname,
              avatar_url: userInfo.headimgurl,
              full_name: userInfo.nickname,
            }
          }
        );
        authUser = updatedUser?.user;
      } else {
        // 创建新用户
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          id: userId,
          email: email,
          email_confirm: true,
          user_metadata: {
            provider: 'wechat',
            wechat_openid: userInfo.openid,
            wechat_unionid: userInfo.unionid,
            nickname: userInfo.nickname,
            avatar_url: userInfo.headimgurl,
            full_name: userInfo.nickname,
          }
        });
        authUser = newUser?.user;
      }

      // 生成JWT token
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (sessionError || !sessionData) {
        return new Response(
          JSON.stringify({ error: '创建会话失败', details: sessionError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 返回用户信息和token
      return new Response(
        JSON.stringify({
          user: {
            id: authUser?.id,
            email: authUser?.email,
            user_metadata: authUser?.user_metadata,
          },
          session: {
            access_token: sessionData.properties?.hashed_token,
            refresh_token: sessionData.properties?.hashed_token,
          },
          redirectUrl: '/chapters' // 前端重定向地址
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: '无效的操作' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('微信登录错误:', error);
    return new Response(
      JSON.stringify({ error: '服务器错误', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

