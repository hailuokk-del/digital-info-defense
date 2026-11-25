import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pickOfflineWave } from './offlineData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PROVIDER_ENDPOINTS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
  },
  zhipu: {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-flash',
  },
};

/**
 * 统一调用 DeepSeek / 智谱 GLM（兼容 OpenAI Chat Completions 协议）
 */
async function callLLM({ provider = 'deepseek', apiKey, model, messages, temperature = 0.7 }) {
  const cfg = PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS.deepseek;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('NO_API_KEY');
  }

  const targetModel = (model && model.trim()) || cfg.defaultModel;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);

  try {
    const resp = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`HTTP_${resp.status}: ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('EMPTY_LLM_RESPONSE');
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 从大模型输出中容错提取 JSON
 */
function parseJsonSafe(rawText) {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    throw new Error('JSON_PARSE_FAILED');
  }
}

/**
 * 1. 测试 API 连通性接口
 */
app.post('/api/test-ai', async (req, res) => {
  const { provider, apiKey, model } = req.body || {};
  try {
    const reply = await callLLM({
      provider,
      apiKey,
      model,
      messages: [
        { role: 'user', content: '请只回复两个字：连通' },
      ],
      temperature: 0.1,
    });
    res.json({ ok: true, message: `连接成功！模型响应：${reply.slice(0, 30)}` });
  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message === 'NO_API_KEY' ? '请先填写 API Key' : `连接失败：${err.message}`,
    });
  }
});

/**
 * 2. AI 动态生成关卡数据包（含薄弱项自适应强化 + 离线兜底）
 */
app.post('/api/generate-wave', async (req, res) => {
  const { provider, apiKey, model, wave = 1, weakCategories = [] } = req.body || {};

  if (!apiKey || !apiKey.trim()) {
    return res.json({
      source: 'offline',
      cards: pickOfflineWave(wave, weakCategories),
    });
  }

  const count = Math.min(8 + wave * 2, 12);
  const weakHint =
    weakCategories.length > 0
      ? `玩家上一波在【${weakCategories.join('、')}】类别防御较薄弱，请重点多生成2~3条该类别的高迷惑性信息进行定向训练。`
      : '请均衡覆盖电信诈骗、AI伪造、钓鱼链接、健康谣言、权威科普与数字安全常识。';

  const systemPrompt = `你是“数字信息保卫战”科普小游戏的AI出题官。
请生成 ${count} 条贴近中国大陆日常生活的“信息数据包”供玩家在快节奏游戏中快速判断真伪。
要求：
1. 必须包含约 60% 虚假/诈骗/钓鱼/谣言信息（isMalicious: true）和 40% 真实权威科普/安全提醒（isMalicious: false）。
2. 每条 title 控制在 12~22 个汉字，一眼能看懂，有真实感或紧迫感。
3. ${weakHint}
4. 在第 ${wave} 波中，安排 1~2 条高伪装度的恶意信息设置 hp: 3（作为Boss信息），其余普通信息 hp: 1。
5. 严格只输出 JSON 数组，不要输出任何额外解释。格式如下：
[
  {
    "title": "信息标题",
    "tag": "2-4字来源标签如短信/热搜/官方科普",
    "isMalicious": true,
    "category": "电信诈骗|AI伪造|钓鱼链接|健康谣言|权威科普|数字安全",
    "hp": 1,
    "reason": "15-35字的一句话防骗或科普解析"
  }
]`;

  try {
    const raw = await callLLM({
      provider,
      apiKey,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请生成第 ${wave} 波信息数据包，共 ${count} 条。` },
      ],
      temperature: 0.85,
    });

    const parsed = parseJsonSafe(raw);
    if (!Array.isArray(parsed) || parsed.length < 4) {
      throw new Error('INVALID_CARD_ARRAY');
    }

    const cards = parsed.slice(0, count).map((c, idx) => ({
      id: `ai-${provider}-w${wave}-${idx}-${Date.now()}`,
      title: String(c.title || '未知信息数据包').slice(0, 32),
      tag: String(c.tag || '网络信息').slice(0, 6),
      isMalicious: Boolean(c.isMalicious),
      category: String(c.category || (c.isMalicious ? '电信诈骗' : '权威科普')),
      hp: c.isMalicious && Number(c.hp) >= 2 ? 3 : 1,
      reason: String(c.reason || '请保持警惕，核查官方渠道来源。').slice(0, 80),
    }));

    return res.json({ source: provider, cards });
  } catch (err) {
    console.warn(`[generate-wave] AI 调用失败，已自动降级到离线题库:`, err.message);
    return res.json({
      source: 'offline-fallback',
      error: err.message,
      cards: pickOfflineWave(wave, weakCategories),
    });
  }
});

/**
 * 3. 【现实信息验真】AI 照妖镜分析接口
 */
app.post('/api/analyze-message', async (req, res) => {
  const { provider, apiKey, model, text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ ok: false, message: '请输入需要检测的文本内容' });
  }

  // 无 Key 时使用本地规则引擎兜底分析
  if (!apiKey || !apiKey.trim()) {
    const lower = text.toLowerCase();
    const highRiskKeywords = ['验证码', '转账', '安全账户', '屏幕共享', '点击链接', '补贴', '刷单', '中奖', '解冻', '.xyz', '.top'];
    const hits = highRiskKeywords.filter((k) => lower.includes(k));
    const riskScore = Math.min(95, 25 + hits.length * 22);
    return res.json({
      source: 'offline',
      riskScore: hits.length === 0 ? 18 : riskScore,
      verdict: hits.length >= 2 ? '高危诈骗嫌疑' : hits.length === 1 ? '存在可疑风险' : '暂未发现典型高危特征',
      category: hits.length > 0 ? '高危诱导话术' : '常规信息',
      highlights: hits,
      advice:
        hits.length > 0
          ? `检测到敏感高危关键词（${hits.join('、')}）。请勿点击陌生链接或向任何人提供验证码与转账！`
          : '当前未填写 AI API Key，已使用本地规则初筛。建议在右上角“AI 设置”填入 DeepSeek 或智谱 Key 开启深度语义鉴伪。',
    });
  }

  const systemPrompt = `你是“数字信息保卫战”的AI反诈与信息鉴真专家。
请分析用户输入的可疑短信、聊天记录或网络传闻，严格输出 JSON 对象（不要多余文字）：
{
  "riskScore": 0到100的整数(越高越危险),
  "verdict": "安全可信|需谨慎核实|高危诈骗嫌疑",
  "category": "所属类别如钓鱼链接/电信诈骗/AI伪造/健康谣言/正常通知",
  "highlights": ["提取出的1到3个可疑关键词或话术片段"],
  "advice": "50-90字的专业防骗建议与核查方式"
}`;

  try {
    const raw = await callLLM({
      provider,
      apiKey,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请分析以下内容：\n${text.slice(0, 600)}` },
      ],
      temperature: 0.2,
    });
    const result = parseJsonSafe(raw);
    return res.json({ source: provider, ...result });
  } catch (err) {
    return res.json({
      source: 'offline-fallback',
      riskScore: 60,
      verdict: 'AI 解析异常，建议谨慎核实',
      category: '待核查信息',
      highlights: [],
      advice: `AI 接口调用失败（${err.message}），请通过官方APP或拨打96110人工核实该信息。`,
    });
  }
});

// 生产环境托管前端静态产物（适用于 Render / Zeabur / 云主机单端口部署）
if (!process.env.VERCEL && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 数字信息保卫战服务已启动: http://localhost:${PORT}`);
  });
}

export default app;
