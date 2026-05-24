# 好好吃饭 🍽️

一个专门为我女朋友暖心的饮食记录网站，为减脂计划打造。

## 功能

- 🌤 **天气提醒** - 自动获取佛山天气，AI生成暖心提醒
- 💕 **纪念日** - 记录在一起的天数
- 🎯 **每日摄入量** - 根据体重自动计算热量和营养目标
- 🍽️ **饮食记录** - 记录早午晚餐和加餐
- 🤖 **AI分析** - AI智能分析食物营养成分
- 💬 **暖心提示** - 每次分析后AI生成温馨提醒
- 📊 **统计图表** - 圆环进度显示摄入情况
- 📅 **日历历史** - 按日历查看历史记录
- ☁️ **云端同步** - 数据存在JSONBIN

## 技术栈

- 纯静态 HTML/CSS/JS
- DeepSeek API - 食物营养分析 + 暖心提醒生成
- wttr.in API - 天气获取
- JSONBIN - 云端数据存储

## 配置

在 `app.js` 中修改：

```javascript
// DeepSeek API
const API_KEY = 'your-api-key';

// JSONBIN云存储
const JSONBIN_ID = 'your-bin-id';
const JSONBIN_KEY = 'your-master-key';

// 个人信息
const HEIGHT = 身高;  // 身高(cm)
const AGE = 年龄;      // 年龄
const LOVE_DATE = new Date('20xx-xx-xx');  // 纪念日
```

## 文件结构

```
├── index.html      # 主页面
├── style.css       # 样式
├── app.js          # 逻辑代码
├── background.jpg  # 背景图片（需自行添加）
└── README.md       # 说明文档
```

## 部署

支持任意静态托管：
- GitHub Pages
- Vercel
- Netlify
- 任何Web服务器

## 最后声明
希望其他人别使用，因为我没有做数据隔离，只为我女朋友打造。
你们可以参考其技术，同时也别使用我的ai密钥，因为我没钱。
（为防止有人用，我已经加密了）

