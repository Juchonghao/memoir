// 微信小程序登录处理函数
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface WeChatCode2SessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取环境变量
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const wechatAppId = Deno.env.get('WECHAT_APP_ID');
    const wechatAppSecret = Deno.env.get('WECHAT_APP_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase配置未设置' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wechatAppId || !wechatAppSecret) {
      return new Response(
        JSON.stringify({ error: '微信配置未设置，请在Supabase Dashboard中配置WECHAT_APP_ID和WECHAT_APP_SECRET' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 解析请求体
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: '无效的JSON请求体' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code, action, nickname, avatar_url, gender, country, province, city } = requestData;

    if (!code) {
      return new Response(
        JSON.stringify({ error: '缺少code参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // action: 'login' 或 'register'
    // login: 仅登录，如果用户不存在则自动创建
    // register: 注册新用户，需要提供用户信息（nickname, avatar_url等）
    const isRegister = action === 'register';

    // 调用微信 code2Session API
    const wxApiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${wechatAppId}&secret=${wechatAppSecret}&js_code=${code}&grant_type=authorization_code`;
    
    console.log('调用微信API:', wxApiUrl.replace(wechatAppSecret, '***'));
    
    const wxResponse = await fetch(wxApiUrl);
    const wxData: WeChatCode2SessionResponse = await wxResponse.json();

    if (wxData.errcode || !wxData.openid) {
      console.error('微信API返回错误:', wxData);
      return new Response(
        JSON.stringify({ 
          error: wxData.errmsg || '微信登录失败',
          errcode: wxData.errcode 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { openid, session_key, unionid } = wxData;

    // 使用Supabase Service Role创建或查找用户
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 使用unionid（如果存在）或openid作为用户唯一标识
    const userId = unionid || openid;
    const email = `${userId}@wechat.miniprogram`; // 虚拟邮箱

    // 尝试查找现有用户
    let authUser;
    let isNewUser = false;
    try {
      const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserById(userId);
      
      if (existingUser?.user && !getUserError) {
        // 用户已存在
        if (isRegister) {
          // 如果是注册操作但用户已存在，返回错误
          return new Response(
            JSON.stringify({ 
              error: '用户已存在，请使用登录功能',
              userExists: true 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // 登录：更新用户元数据和最后登录时间
        console.log('用户已存在，更新元数据:', userId);
        const updateMetadata: any = {
          provider: 'wechat_miniprogram',
          wechat_openid: openid,
          wechat_unionid: unionid,
          last_login: new Date().toISOString(),
        };

        // 如果提供了新的用户信息，更新它们
        if (nickname) updateMetadata.nickname = nickname;
        if (avatar_url) updateMetadata.avatar_url = avatar_url;
        if (gender !== undefined) updateMetadata.gender = gender;
        if (country) updateMetadata.country = country;
        if (province) updateMetadata.province = province;
        if (city) updateMetadata.city = city;

        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: updateMetadata
          }
        );

        if (updateError) {
          console.error('更新用户失败:', updateError);
        } else {
          authUser = updatedUser?.user;
        }
      }
    } catch (e) {
      console.log('用户不存在，将创建新用户');
    }

    // 如果用户不存在，创建新用户
    if (!authUser) {
      isNewUser = true;
      
      // 注册时，用户信息是必需的
      if (isRegister && !nickname) {
        return new Response(
          JSON.stringify({ error: '注册时请提供用户信息（nickname等）' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('创建新用户:', userId);
      const userMetadata: any = {
        provider: 'wechat_miniprogram',
        wechat_openid: openid,
        wechat_unionid: unionid,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      // 添加用户提供的信息
      if (nickname) userMetadata.nickname = nickname;
      if (avatar_url) userMetadata.avatar_url = avatar_url;
      if (gender !== undefined) userMetadata.gender = gender;
      if (country) userMetadata.country = country;
      if (province) userMetadata.province = province;
      if (city) userMetadata.city = city;
      if (nickname) userMetadata.full_name = nickname; // 同时设置full_name

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        id: userId,
        email: email,
        email_confirm: true,
        user_metadata: userMetadata
      });

      if (createError) {
        console.error('创建用户失败:', createError);
        return new Response(
          JSON.stringify({ error: '创建用户失败', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = newUser?.user;
    }

    // 确保用户记录存在于users表中
    try {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: email,
          full_name: authUser.user_metadata?.nickname || authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.warn('更新users表失败（可能表不存在）:', upsertError);
      }
    } catch (e) {
      console.warn('users表操作异常:', e);
    }

    // 生成Supabase JWT token
    // 使用admin API创建session并获取access_token
    // 注意：Supabase Admin API不直接提供生成JWT的方法
    // 这里返回用户信息，小程序需要使用Supabase客户端SDK来管理session
    // 或者小程序可以存储用户ID，后续请求时使用自定义认证方式
    
    // 尝试生成一个临时token（通过创建session）
    // 由于Supabase的限制，我们返回用户ID和相关信息
    // 小程序应该使用这些信息来建立session

    // 返回用户信息
    // 注意：小程序需要使用返回的用户ID来建立Supabase session
    // 推荐方式：在后续API请求中携带用户ID，后端验证用户存在性
    // 或者使用Supabase客户端SDK的自定义认证流程
    return new Response(
      JSON.stringify({
        user: {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        },
        openid: openid,
        unionid: unionid,
        isNewUser: isNewUser, // 标识是否为新注册用户
        action: isRegister ? 'register' : 'login',
        // session_key不应该返回给前端，仅在后端使用
        // 小程序应该：
        // 1. 存储用户ID（authUser.id）
        // 2. 在后续API请求中携带用户ID作为userId参数
        // 3. 后端API会验证用户ID是否存在于Supabase Auth中
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('微信登录错误:', error);
    return new Response(
      JSON.stringify({ error: '服务器错误', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

