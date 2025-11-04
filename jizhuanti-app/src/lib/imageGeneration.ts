// 图像生成API集成 - 使用Pollinations.AI
// 用于"记忆镜像引擎"功能，将用户照片转化为年代化风格

/**
 * 生成记忆镜像图像
 * @param userPhotoUrl 用户上传的照片URL
 * @param era 年代风格 (e.g., '1960s', '1980s', '2000s')
 * @param chapter 传记章节，用于生成相关背景
 * @returns 生成的图像URL
 */
export async function generateMemoryMirror(
  userPhotoUrl: string,
  era: string,
  chapter?: string
): Promise<string> {
  // Pollinations.AI 图像生成API
  // 使用文本提示生成图像，支持风格化
  // 如果 userPhotoUrl 为空，则完全基于章节和年代生成
  
  const stylePrompts: Record<string, string> = {
    '1960s': 'vintage 1960s Chinese style, sepia tone, old photograph, nostalgic, warm family atmosphere',
    '1970s': 'retro 1970s Chinese style, warm colors, classic photo, traditional Chinese elements',
    '1980s': 'vintage 1980s Chinese style, bright colors, classic portrait, nostalgic Chinese life',
    '1990s': '1990s Chinese style photograph, film grain, nostalgic, modern Chinese family',
    '2000s': 'early 2000s Chinese digital camera style, soft focus, contemporary Chinese life',
  }

  const chapterContexts: Record<string, string> = {
    childhood: 'Chinese child in traditional setting, innocent, joyful, playing in courtyard or garden, warm family scene',
    youth: 'young Chinese person, youthful energy, ambitious, hopeful, school or early career setting',
    career: 'professional Chinese person, determined, successful, office or workplace setting, confident',
    family: 'warm Chinese family moment, multiple generations, loving, harmonious, traditional Chinese home',
    reflection: 'elderly Chinese person, reflective, wise, peaceful, looking back at memories, serene',
  }

  const stylePrompt = stylePrompts[era] || stylePrompts['1980s']
  const chapterContext = chapter ? (chapterContexts[chapter] || chapterContexts['childhood']) : chapterContexts['childhood']

  // 构建完整的提示词 - 更详细的中文场景描述
  const prompt = userPhotoUrl 
    ? `A portrait in ${stylePrompt}, ${chapterContext}, based on user photo, high quality, detailed, realistic, professional photography`
    : `${chapterContext}, ${stylePrompt}, Chinese person, authentic Chinese facial features, traditional Chinese clothing or setting, high quality, detailed, realistic, professional photography, warm lighting, emotional depth`

  // Pollinations.AI 的 API endpoint
  const encodedPrompt = encodeURIComponent(prompt)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&enhance=true&seed=${Date.now()}`

  return imageUrl
}

/**
 * 上传用户照片到Supabase Storage
 * @param file 用户选择的文件
 * @param userId 用户ID
 * @param supabase Supabase客户端
 * @returns 上传后的文件URL
 */
export async function uploadUserPhoto(
  file: File,
  userId?: string,
  supabase?: any
): Promise<string> {
  // 如果没有提供userId和supabase，使用简化的实现
  if (!userId || !supabase) {
    // 创建本地URL作为备用
    return URL.createObjectURL(file)
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('user-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  // 获取公共URL
  const { data: urlData } = supabase.storage
    .from('user-photos')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

/**
 * 保存生成的记忆镜像到Supabase Storage
 * @param imageUrl 生成的图像URL
 * @param sessionId 访谈会话ID
 * @param supabase Supabase客户端
 * @returns 保存后的文件URL
 */
export async function saveMemoryMirror(
  imageUrl: string,
  sessionId: string,
  supabase?: any
): Promise<string> {
  try {
    // 如果没有supabase，返回原始URL
    if (!supabase) {
      return imageUrl
    }

    // 下载生成的图像
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    // 上传到Supabase Storage
    const fileName = `${sessionId}/${Date.now()}.png`
    const { data, error } = await supabase.storage
      .from('memory-mirrors')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(`Failed to save memory mirror: ${error.message}`)
    }

    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from('memory-mirrors')
      .getPublicUrl(fileName)

    // 保存记录到数据库
    await supabase.from('media_files').insert({
      session_id: sessionId,
      file_type: 'memory_mirror',
      file_url: urlData.publicUrl,
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'pollinations_ai',
      },
    })

    return urlData.publicUrl
  } catch (error) {
    console.error('Failed to save memory mirror:', error)
    // 如果保存失败，返回原始URL
    return imageUrl
  }
}

/**
 * 根据章节和年代获取推荐的时代符号
 * @param chapter 传记章节
 * @param era 年代
 * @returns 时代符号数组
 */
export function getEraSymbols(chapter: string, era?: string): string[] {
  const symbolsByChapter: Record<string, Record<string, string[]>> = {
    childhood: {
      '1960s': ['粮票', '搪瓷碗', '小人书', '收音机'],
      '1970s': ['绿军装', '搪瓷缸', '军挎包', '红领巾'],
      '1980s': ['连环画', '糖葫芦', '竹蜻蜓', '弹珠'],
      '1990s': ['玩具枪', '变形金刚', '小霸王', '电子琴'],
      '2000s': ['动画片', '零食', '游戏机', '儿童读物'],
    },
    youth: {
      '1960s': ['红卫兵', '大字报', '样板戏', '军歌'],
      '1970s': ['喇叭裤', '蛤蟆镜', '录音机', '绿皮火车'],
      '1980s': ['霹雳舞', '健美裤', '磁带', '双卡录音机'],
      '1990s': ['呼机', '随身听', 'BP机', '自行车'],
      '2000s': ['QQ', 'MP3', '手机', '网络游戏'],
    },
    career: {
      '1960s': ['铁饭碗', '工作证', '粮票', '布票'],
      '1970s': ['知青', '下乡', '工分', '集体劳动'],
      '1980s': ['大哥大', '公文包', '的确良衬衫', '国库券'],
      '1990s': ['传呼机', '台式电脑', 'BP机', '诺基亚'],
      '2000s': ['互联网', '手机', 'QQ', '创业'],
    },
    family: {
      '1960s': ['黑白电视', '缝纫机', '自行车', '全家福'],
      '1970s': ['搪瓷盆', '暖水瓶', '煤球炉', '收音机'],
      '1980s': ['彩色电视', '洗衣机', '冰箱', '录像机'],
      '1990s': ['数码相机', 'VCD', '空调', '摩托车'],
      '2000s': ['数码相机', '笔记本电脑', '旅游', '汽车'],
    },
    reflection: {
      '1960s': ['老照片', '纪念章', '日记本', '书信'],
      '1970s': ['粮票收藏', '毛主席像章', '红宝书', '纪念币'],
      '1980s': ['磁带收藏', '老物件', '家庭相册', '回忆录'],
      '1990s': ['数码相册', '智能手机', '网购', '高铁'],
      '2000s': ['AI', '元宇宙', '新能源车', '智能家居'],
    },
  }

  const chapterSymbols = symbolsByChapter[chapter] || symbolsByChapter['childhood']
  const eraSymbols = chapterSymbols[era || '1980s'] || chapterSymbols['1980s']
  
  return eraSymbols
}
