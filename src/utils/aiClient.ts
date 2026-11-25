import { AIConfig, AnalyzeResult, InfoCardData } from '../types';

const OFFLINE_CARDS: InfoCardData[] = [
  {
    id: 'off-1',
    title: '【急】点击领取500元医保电子补贴，今晚失效',
    tag: '短信',
    isMalicious: true,
    category: '钓鱼链接',
    hp: 1,
    reason: '官方医保补贴不会通过陌生短信附带短链接发放，切勿点击输入银行卡号与验证码。',
  },
  {
    id: 'off-2',
    title: '国家反诈中心提醒：96110来电请务必接听',
    tag: '官方科普',
    isMalicious: false,
    category: '权威科普',
    hp: 1,
    reason: '96110是全国统一反诈预警劝阻专线，接到该号码来电说明您或家人可能正在遭遇诈骗。',
  },
  {
    id: 'off-3',
    title: '“领导”视频来电：公司急需向指定账户打款3万',
    tag: 'AI换脸',
    isMalicious: true,
    category: 'AI伪造',
    hp: 3,
    reason: 'AI换脸与语音克隆已用于冒充熟人/领导诈骗，涉及转账必须通过原电话或当面二次核实！',
  },
  {
    id: 'off-4',
    title: '地震预警APP提示：地震横波还有18秒到达，请避险',
    tag: '预警',
    isMalicious: false,
    category: '权威科普',
    hp: 1,
    reason: '地震预警利用电磁波比地震波快的原理提前数秒发出警报，收到后应迅速就近蹲下护头。',
  },
  {
    id: 'off-5',
    title: '客服来电：您网购的商品有质量问题，现双倍理赔',
    tag: '来电',
    isMalicious: true,
    category: '电信诈骗',
    hp: 1,
    reason: '正规电商售后均在官方APP内原路退回，要求加微信、下载屏幕共享APP理赔的一律是诈骗。',
  },
  {
    id: 'off-6',
    title: '专家建议：公共Wi-Fi下尽量不进行大额网银转账',
    tag: '安全贴士',
    isMalicious: false,
    category: '数字安全',
    hp: 1,
    reason: '无密码或来路不明的公共Wi-Fi可能存在流量劫持风险，敏感操作建议使用手机移动网络。',
  },
  {
    id: 'off-7',
    title: '内部消息：喝隔夜白开水100%致癌，快转给家人',
    tag: '热传',
    isMalicious: true,
    category: '健康谣言',
    hp: 1,
    reason: '符合国家标准的白开水放置一晚亚硝酸盐含量极微，远低于安全限值，属于典型伪科学谣言。',
  },
  {
    id: 'off-8',
    title: '微信安全提示：切勿向任何人泄露手机短信验证码',
    tag: '安全提示',
    isMalicious: false,
    category: '数字安全',
    hp: 1,
    reason: '短信验证码是资金和账号安全的最后一道防线，任何自称客服索要验证码的均为骗子。',
  },
  {
    id: 'off-9',
    title: '高薪日结兼职：动动手指点赞刷单，日赚800元',
    tag: '兼职',
    isMalicious: true,
    category: '电信诈骗',
    hp: 1,
    reason: '所有“先垫付做任务返佣金”的刷单均为违法及诈骗行为，前期小额返利只为诱骗后期大额投入。',
  },
  {
    id: 'off-10',
    title: '工信部提醒：收到含“.xyz”高仿政务域名链接需警惕',
    tag: '政务提醒',
    isMalicious: false,
    category: '权威科普',
    hp: 1,
    reason: '我国政府机关网站统一使用“.gov.cn”域名，遇到仿冒后缀链接切勿轻信。',
  },
  {
    id: 'off-11',
    title: '【系统通知】您的ETC已停用，请点链接认证恢复',
    tag: '伪装短信',
    isMalicious: true,
    category: '钓鱼链接',
    hp: 3,
    reason: '冒充ETC、高速管理方的钓鱼短信高频出现，认证页面会套取身份证、银行卡和密码。',
  },
  {
    id: 'off-12',
    title: 'AI生成图片可通过观察手指数量与背景文字来初步辨别',
    tag: 'AI科普',
    isMalicious: false,
    category: '数字安全',
    hp: 1,
    reason: '虽然AI绘画不断进步，但观察细节透视、文字乱码、光影一致性仍是有效的数字鉴伪方法。',
  },
  {
    id: 'off-13',
    title: '“老同学”私信：手机欠费停机，帮我充100元话费',
    tag: '社交盗号',
    isMalicious: true,
    category: '电信诈骗',
    hp: 1,
    reason: '熟人账号可能被盗，任何线上借钱、代充话费请求务必通过语音或电话核实本人。',
  },
  {
    id: 'off-14',
    title: '日常设置密码应避免使用“123456”或生日等弱口令',
    tag: '数字素养',
    isMalicious: false,
    category: '数字安全',
    hp: 1,
    reason: '采用“大小写字母+数字+符号”的组合并开启双因素认证，可大幅降低撞库盗号风险。',
  },
  {
    id: 'off-15',
    title: '某地水库发现史前巨兽？配图实为三年前旧照拼接',
    tag: '热点谣言',
    isMalicious: true,
    category: '健康谣言',
    hp: 3,
    reason: '“旧图新配”是常见网络谣言套路，可通过以图搜图或核查权威媒体通告来辨别。',
  },
];

function pickLocalOfflineWave(wave: number, weakCategories: string[]): InfoCardData[] {
  const pool = [...OFFLINE_CARDS];
  if (weakCategories.length > 0) {
    pool.sort((a, b) => {
      const aHit = weakCategories.includes(a.category) ? 0 : 1;
      const bHit = weakCategories.includes(b.category) ? 0 : 1;
      return aHit - bHit + (Math.random() - 0.5);
    });
  } else {
    pool.sort(() => Math.random() - 0.5);
  }
  const count = Math.min(8 + wave * 2, 12);
  return pool.slice(0, count).map((item, idx) => ({
    ...item,
    id: `local-w${wave}-${idx}-${Date.now()}`,
  }));
}

function localAnalyzeMessage(text: string): AnalyzeResult {
  const lower = text.toLowerCase();
  const highRiskKeywords = ['验证码', '转账', '安全账户', '屏幕共享', '点击链接', '补贴', '刷单', '中奖', '解冻', '.xyz', '.top'];
  const hits = highRiskKeywords.filter((k) => lower.includes(k));
  const riskScore = Math.min(95, 25 + hits.length * 22);
  return {
    source: 'offline',
    riskScore: hits.length === 0 ? 18 : riskScore,
    verdict: hits.length >= 2 ? '高危诈骗嫌疑' : hits.length === 1 ? '存在可疑风险' : '暂未发现典型高危特征',
    category: hits.length > 0 ? '高危诱导话术' : '常规信息',
    highlights: hits,
    advice:
      hits.length > 0
        ? `检测到敏感高危关键词（${hits.join('、')}）。请勿点击陌生链接或向任何人提供验证码与转账！`
        : '当前使用本地规则初筛。建议在右上角“AI 设置”填入 DeepSeek 或智谱 Key 开启深度语义鉴伪。',
  };
}

const PROVIDER_ENDPOINTS = {
  deepseek: { url: 'https://api.deepseek.com/chat/completions', defaultModel: 'deepseek-chat' },
  zhipu: { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', defaultModel: 'glm-4-flash' },
};

async function callLLMDirect(
  cfg: AIConfig,
  messages: { role: string; content: string }[],
  temperature = 0.7
): Promise<string> {
  if (!cfg.apiKey.trim()) throw new Error('NO_API_KEY');
  const ep = PROVIDER_ENDPOINTS[cfg.provider] || PROVIDER_ENDPOINTS.deepseek;
  const resp = await fetch(ep.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: cfg.model.trim() || ep.defaultModel,
      messages,
      temperature,
    }),
  });
  if (!resp.ok) throw new Error(`HTTP_${resp.status}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('EMPTY_RESPONSE');
  return content;
}

function parseJsonSafe(rawText: string) {
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

export async function testAIConnection(cfg: AIConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/test-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // 静态托管环境无 /api，改用浏览器直连
  }

  try {
    const reply = await callLLMDirect(cfg, [{ role: 'user', content: '请只回复两个字：连通' }], 0.1);
    return { ok: true, message: `直连成功！模型响应：${reply.slice(0, 30)}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg === 'NO_API_KEY' ? '请先填写 API Key' : `连接失败：${msg}` };
  }
}

export async function generateWaveCards(
  cfg: AIConfig,
  wave: number,
  weakCategories: string[]
): Promise<{ source: string; cards: InfoCardData[] }> {
  try {
    const res = await fetch('/api/generate-wave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cfg, wave, weakCategories }),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data.cards)) return data;
    }
  } catch {
    // 无后端时走纯静态降级逻辑
  }

  if (cfg.apiKey.trim()) {
    try {
      const count = Math.min(8 + wave * 2, 12);
      const weakHint =
        weakCategories.length > 0
          ? `玩家在【${weakCategories.join('、')}】较薄弱，请多生成2~3条该类题目。`
          : '均衡覆盖电信诈骗、AI伪造、钓鱼链接、健康谣言、权威科普与数字安全。';
      const raw = await callLLMDirect(
        cfg,
        [
          {
            role: 'system',
            content: `生成${count}条信息数据包JSON数组，含title(12-22字),tag,isMalicious(boolean),category,hp(1或3),reason。${weakHint}只输出JSON。`,
          },
          { role: 'user', content: `生成第${wave}波共${count}条。` },
        ],
        0.85
      );
      const parsed = parseJsonSafe(raw);
      if (Array.isArray(parsed) && parsed.length >= 4) {
        return {
          source: cfg.provider,
          cards: parsed.slice(0, count).map((c, idx) => ({
            id: `direct-${cfg.provider}-w${wave}-${idx}-${Date.now()}`,
            title: String(c.title || '未知信息数据包').slice(0, 32),
            tag: String(c.tag || '网络信息').slice(0, 6),
            isMalicious: Boolean(c.isMalicious),
            category: String(c.category || '电信诈骗'),
            hp: c.isMalicious && Number(c.hp) >= 2 ? 3 : 1,
            reason: String(c.reason || '请保持警惕，核查官方渠道来源。').slice(0, 80),
          })),
        };
      }
    } catch {
      // fallback
    }
  }

  return { source: 'offline', cards: pickLocalOfflineWave(wave, weakCategories) };
}

export async function analyzeMessage(cfg: AIConfig, text: string): Promise<AnalyzeResult> {
  try {
    const res = await fetch('/api/analyze-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cfg, text }),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // 静态托管降级
  }

  if (cfg.apiKey.trim()) {
    try {
      const raw = await callLLMDirect(
        cfg,
        [
          {
            role: 'system',
            content:
              '分析可疑短信/聊天记录，只输出JSON：{"riskScore":0-100整数,"verdict":"安全可信|需谨慎核实|高危诈骗嫌疑","category":"类别","highlights":["高危词"],"advice":"建议"}',
          },
          { role: 'user', content: text.slice(0, 600) },
        ],
        0.2
      );
      const parsed = parseJsonSafe(raw);
      return { source: cfg.provider, ...parsed };
    } catch {
      // fallback
    }
  }

  return localAnalyzeMessage(text);
}
