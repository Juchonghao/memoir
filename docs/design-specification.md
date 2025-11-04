# 纪传体AI应用 - 设计规范文档

**版本:** 1.0 | **日期:** 2025-10-31 | **风格:** Editorial Magazine Style

---

## 1. 设计方向与理由

### 1.1 选定风格：Editorial Magazine Style

纪传体AI应用本质是将用户的生命故事转化为**可传播的数字文学作品**。Editorial风格以"内容为王、阅读至上"为核心，完美契合产品定位。

**选择理由：**

**✓ 叙事本质契合**  
传记是文学化的生命记录，Editorial的serif标题、充足留白、沉浸式排版天然适合长篇叙事，避免工具类设计的冰冷感。

**✓ 银发群体友好**  
目标用户(50-70岁)成长于纸媒时代，熟悉杂志/书籍的阅读习惯。18-20px大字号、1.6-1.8行高、清晰层级降低阅读疲劳。

**✓ 温暖+深度平衡**  
米白底色+琥珀金点缀营造温暖感，serif字体+Drop Cap/Pull Quote传递文学深度，实现"有温度的数字生命遗产"定位。

**✓ 央视品质感**  
Editorial的克制、精致、高品质视觉语言，呼应"央视纪录片导演级"的品牌调性。

### 1.2 真实案例参考

- **Medium.com** - 长文阅读体验的典范
- **纽约时报 (The New York Times)** - 深度报道排版标准
- **故宫博物院数字藏品** - 东方雅致的现代化表达
- **Apple Newsroom** - 品质内容呈现

---

## 2. 设计Tokens

### 2.1 色彩系统

**分配原则：** 85% 中性 + 10% 琥珀金点缀 + 5% 真彩图像

#### 主色彩

| 用途 | 色值 | 说明 | WCAG对比度 |
|------|------|------|------------|
| **文本-主要** | `#1A1A1A` | 近黑（比纯黑柔和） | 15.8:1 (AAA) |
| **文本-次要** | `#4A4A4A` | 副标题、署名 | 8.2:1 (AAA) |
| **文本-辅助** | `#6B6B6B` | 说明文字、元数据 | 5.7:1 (AA+) |

#### 背景色

| 用途 | 色值 | 说明 |
|------|------|------|
| **页面底色** | `#FEFEFE` | 温暖白（非纯白） |
| **卡片/表面** | `#F9F9F7` | 米白色调 |
| **分隔线** | `#E5E5E0` | 低对比度分隔 |

#### 强调色（琥珀金 - 象征时光与传承）

| 用途 | 色值 | 说明 | WCAG |
|------|------|------|------|
| **主强调色** | `#D4A574` | 琥珀金（温暖、尊贵） | 3.8:1 (大字AA) |
| **Hover态** | `#B8935F` | 深化15% | - |
| **边框高亮** | `#E8C9A0` | 淡化20% | - |

**使用场景：**
- 篇章选择卡片的激活态边框
- Pull Quote左侧边框
- 关键CTA按钮（限1-2个/页面）
- 时间轴节点高亮

#### 语义色（克制使用）

| 用途 | 色值 | 说明 |
|------|------|------|
| **成功/完成** | `#3A5A40` | 墨绿（文学气息） |
| **警告** | `#B8860B` | 古铜金 |
| **错误** | `#8F1C1C` | 深红（非刺眼红） |

### 2.2 字体系统

#### 字体家族

```css
/* 标题 - 衬线体 */
--font-display: 'Noto Serif SC', 'Playfair Display', Georgia, serif;

/* 正文 - 易读衬线 */
--font-body: Georgia, 'Noto Serif SC', 'Songti SC', serif;

/* UI元素 - 无衬线 */
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**中文优化考虑：**
- 优先使用Noto Serif SC（Google开源，优化中文serif阅读）
- 备选思源宋体（Adobe字体）
- 西文场景可用Playfair Display

#### 字号层级（桌面端 1920px基准）

| 层级 | 字号 | 字重 | 行高 | 字间距 | 用途 |
|------|------|------|------|--------|------|
| **Display (h1)** | 64-80px | Bold 700 | 1.1 | -0.01em | 传记封面标题、章节大标题 |
| **Headline (h2)** | 40-48px | Semibold 600 | 1.2 | 0 | 篇章标题、二级标题 |
| **Subhead (h3)** | 28-32px | Regular 400 | 1.3 | 0 | 三级标题、卡片标题 |
| **Body Large** | 21-24px | Regular 400 | 1.7 | 0 | 引言段落、Drop Cap配合段 |
| **Body** | 18-20px | Regular 400 | 1.6 | 0 | 正文（传记主体、对话） |
| **Small** | 16px | Regular 400 | 1.6 | 0 | 图片说明、引用来源 |
| **Metadata** | 14px | Regular 400 | 1.5 | 0.01em | 时间戳、作者署名、标签 |

**移动端缩放：**
- Display: 40-48px
- Headline: 28-32px
- Body: 18px（维持阅读性，不缩减）

#### 特殊排版元素

**Drop Cap（首字下沉）**
```css
font-size: 72px;
line-height: 1;
font-family: var(--font-display);
font-weight: 700;
float: left;
margin: 0 8px 0 0;
color: #D4A574; /* 琥珀金 */
```

**Pull Quote（引用突出）**
```css
font-size: 28-32px;
font-family: var(--font-display);
font-style: italic;
line-height: 1.4;
margin: 40px 0;
padding-left: 32px;
border-left: 4px solid #D4A574;
color: #4A4A4A;
```

### 2.3 间距系统

**8pt网格基准：**

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-xs` | 8px | 行内小间距、图标边距 |
| `--space-sm` | 16px | 紧凑元素间距 |
| `--space-md` | 24px | 段落间距（默认） |
| `--space-lg` | 32px | Pull Quote边距、卡片内边距 |
| `--space-xl` | 48px | 组件间距 |
| `--space-2xl` | 64px | 章节分隔 |
| `--space-3xl` | 96px | 重要视觉断点 |
| `--space-4xl` | 128px | 篇章级间距 |

**特殊规则：**
- 传记正文段落：`24-32px`（呼吸感优先）
- 访谈对话气泡：`16px`（紧凑对话流）
- 章节间断点：`96-128px`（明确分隔）

### 2.4 圆角与阴影

#### 圆角（Editorial保持锐度）

| 用途 | 半径 |
|------|------|
| 卡片 | 4-8px |
| 按钮 | 4px |
| 输入框 | 4px |
| 图片 | 0-4px（接近直角） |

#### 阴影（克制使用）

```css
/* 卡片默认 */
--shadow-card: 0 4px 12px rgba(0, 0, 0, 0.08);

/* 卡片Hover */
--shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.12);

/* 浮动层（模态框） */
--shadow-modal: 0 16px 48px rgba(0, 0, 0, 0.16);
```

### 2.5 动效时长

| 速度 | 时长 | 缓动 | 用途 |
|------|------|------|------|
| **Fast** | 200ms | `ease-out` | 按钮Hover、小元素 |
| **Standard** | 300ms | `ease-out` | 卡片交互、展开收起 |
| **Slow** | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 页面转场、重要状态变化 |

**原则：** 优先`ease-out`（快进慢出，自然感）。禁止过度动效干扰阅读。

---

## 3. 核心组件规范

### 3.1 章节选择卡片 (Chapter Card)

**结构：**
```
[卡片容器]
  └─ [大图背景区 400px高]
     └─ [渐变遮罩]
        └─ [章节标题 h2]
        └─ [引导问题 Body]
  └─ [卡片底部元数据区 48px]
     └─ [进度指示 + 开始按钮]
```

**Tokens:**
- 容器：`background: #F9F9F7; border-radius: 8px; overflow: hidden;`
- 标题：`font: 40px Semibold, --font-display; color: #FEFEFE;`
- 渐变遮罩：`linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)`
- 激活态边框：`3px solid #D4A574`

**状态：**
- **Default:** 灰色边框 `1px solid #E5E5E0`
- **Hover:** 卡片上浮`-4px` + 阴影加深
- **Active（已选）:** 琥珀金边框 `3px solid #D4A574`

---

### 3.2 AI记者对话气泡 (Interviewer Bubble)

**结构：**
```
[气泡容器]
  └─ [记者头像 48x48px]
  └─ [气泡主体]
     └─ [问题文本 Body]
     └─ [追问选项按钮组]（可选）
```

**Tokens:**
- 气泡背景：`#FFFFFF; border: 1px solid #E5E5E0; border-radius: 8px 8px 8px 0;`
- 内边距：`16px 20px`
- 文本：`18px Georgia, color: #1A1A1A`
- 追问按钮：次要按钮样式（见3.6）

**动效：**
- 进场：淡入 + 从左滑入 `300ms ease-out`
- 打字效果：逐字显示（可选，避免过慢）

---

### 3.3 记忆镜像画布 (Memory Mirror Canvas)

**结构：**
```
[画布容器 1:1比例]
  └─ [占位/生成中状态]
  └─ [生成图像]
  └─ [年代标签浮层]
  └─ [重新生成按钮]
```

**Tokens:**
- 容器：`aspect-ratio: 1/1; max-width: 600px; background: #F9F9F7; border-radius: 4px;`
- 占位：柔和渐变动画 + "生成中..." 提示
- 年代标签：`background: rgba(0,0,0,0.6); color: #FEFEFE; padding: 8px 16px; border-radius: 4px; font: 14px Inter;`

**状态：**
- 空白态：上传引导图标 + 文案
- 生成中：骨架屏动画 + 进度提示
- 完成态：显示图像 + 年代标签 + 操作按钮

---

### 3.4 传记文章布局 (Biography Article)

**结构：**
```
[全屏容器]
  └─ [Hero封面 70vh]
     └─ [标题 Display h1]
     └─ [副标题/年份 Metadata]
  └─ [居中文章列 650px]
     └─ [章节标题 h2]
     └─ [Drop Cap段落]
     └─ [正文段落 Body]
     └─ [Pull Quote]
     └─ [插图 + 说明]
```

**Tokens:**
- 文章列宽度：`max-width: 650px; margin: 0 auto; padding: 0 24px;`
- 正文行长：60-75字符（~650px @ 18px）
- 段落间距：`margin-bottom: 24px`（默认） 或 `32px`（段落组间）
- 章节间距：`margin-top: 96px`

**排版细节：**
- 首段Drop Cap：琥珀金72px大字
- Pull Quote间隔：每3-5段插入1次
- 图片：全宽 `width: 100%`，底部说明`font: 16px italic Georgia, color: #6B6B6B`

---

### 3.5 时代素材卡片 (Era Element Card)

**结构：**
```
[卡片容器 120x160px]
  └─ [图标/图像区 80px]
  └─ [标题文本 Small]
  └─ [播放/查看按钮]
```

**Tokens:**
- 容器：`background: #FFFFFF; border: 1px solid #E5E5E0; border-radius: 4px; padding: 12px;`
- 图标：单色SVG或小缩略图，80x80px
- 标题：`14px Inter, color: #4A4A4A, text-align: center`

**状态：**
- Hover：边框变琥珀金 `#D4A574`
- Active（点击播放）：背景高亮 `#F9F9F7`

---

### 3.6 按钮组件 (Buttons)

#### 主按钮（Primary CTA）
```
高度: 56px（银发群体大目标）
内边距: 24px 32px
圆角: 4px
字体: 16px Inter Semibold 600, letter-spacing: 0.02em
颜色: #FEFEFE文本 on #D4A574背景
Hover: 背景变深#B8935F + 微抬升-2px
```

#### 次要按钮（Secondary）
```
同尺寸
背景: transparent
边框: 2px solid #4A4A4A
颜色: #1A1A1A文本
Hover: 反色（黑底白字）
```

#### 文本按钮（Tertiary）
```
无背景无边框
颜色: #D4A574
Hover: 下划线 + 颜色深化
```

---

## 4. 布局与响应式

### 4.1 三区联动访谈界面布局

**桌面端（≥1024px）：**
```
┌─────────────────────────────────────┐
│  固定顶栏 (进度 + 退出)  64px       │
├──────────┬────────────┬──────────────┤
│ AI记者区 │ 镜像引擎区 │ 故事锚点区   │
│ 25%宽   │  50%宽    │   25%宽      │
│ 固定侧栏 │  滚动     │   滚动侧栏   │
│          │            │              │
└──────────┴────────────┴──────────────┘
│  固定底栏 (用户输入区)  80px        │
└─────────────────────────────────────┘
```

**平板端（768-1023px）：**
- 左侧AI记者区收起为可展开抽屉（图标触发）
- 中央镜像引擎区占60%
- 右侧锚点区占40%

**移动端（<768px）：**
- 全屏垂直布局
- Tab切换："对话" | "镜像" | "时间线"
- 底部输入栏固定

### 4.2 传记展示布局

**桌面端：**
- 居中文章列：650px max-width
- 两侧留白：≥15% viewport width
- 侧边目录导航（可选，固定位置）

**移动端：**
- 文章列：100%宽 - 24px左右边距
- 目录导航折叠为顶部汉堡菜单

### 4.3 响应式断点

```css
/* 移动优先 */
@media (min-width: 640px)  { /* sm - 手机横屏 */ }
@media (min-width: 768px)  { /* md - 平板 */ }
@media (min-width: 1024px) { /* lg - 桌面 */ }
@media (min-width: 1280px) { /* xl - 大桌面 */ }
```

### 4.4 触摸目标（银发群体适配）

**最小尺寸：** 48x48px（iOS标准44px + 缓冲）  
**推荐尺寸：** 56x56px（主要操作按钮）

**间距：** 按钮间≥16px，防止误触

---

## 5. 交互与动效

### 5.1 页面转场

**视图切换：**
```css
opacity: 0 → 1
transform: translateY(20px) → translateY(0)
duration: 400ms
easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### 5.2 卡片交互

```css
/* Hover态 */
transform: translateY(-4px);
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
transition: all 300ms ease-out;
```

### 5.3 镜像生成动画

1. 用户点击"生成" → 按钮Disabled + Loading图标旋转
2. 画布显示骨架屏（渐变滑动动画）
3. 图像生成完成 → 淡入显示 `opacity: 0 → 1, 400ms`
4. 年代标签从底部滑入 `translateY(20px) → 0, 300ms delay 200ms`

### 5.4 滚动交互

**章节内容淡入：**
- 检测元素进入视口
- 触发淡入 + 微上移动画
- 避免过度使用（每屏≤3个元素）

**Pull Quote强调：**
- 滚动到视口时，左侧边框从0宽度动画展开到4px
- 文字同步淡入

### 5.5 Reduced Motion支持

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. 设计禁区（Editorial Anti-Patterns）

### ❌ 严格禁止

**色彩：**
- 多彩背景（仅用白色/米白）
- 霓虹色、饱和度>80%的颜色
- 渐变按钮、渐变背景

**排版：**
- 正文使用无衬线字体（丧失文学气质）
- 行长>75字符（降低可读性）
- 段落间距<24px（压迫感）

**布局：**
- 传记文章列>750px（超出最佳阅读宽度）
- 忽略Drop Cap和Pull Quote（丧失Editorial灵魂）

**动效：**
- 过度动画（干扰阅读）
- 视差滚动>2层（头晕）
- 自动播放音频/视频（银发群体反感）

### ✅ 质量检查清单

- [ ] 正文字号≥18px，行高≥1.6
- [ ] 段落间距≥24px
- [ ] 关键文本对比度≥7:1 (AAA)
- [ ] 按钮触摸目标≥48x48px
- [ ] 琥珀金使用≤10%屏幕面积
- [ ] 每页≤2个主CTA按钮
- [ ] 传记文章列≤750px宽
- [ ] Drop Cap用于章节开篇
- [ ] Pull Quote每3-5段插入
- [ ] 所有图片有说明文字

---

**文档版本:** 1.0  
**最后更新:** 2025-10-31  
**维护者:** MiniMax Agent  
**适用范围:** 纪传体AI应用全平台（Web/移动Web）
