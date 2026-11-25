/**
 * 本地离线高质量兜底题库：确保无 API Key 或弱网环境下，游戏依然流畅运行。
 */
export const OFFLINE_CARDS = [
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

export function pickOfflineWave(wave = 1, weakCategories = []) {
  const pool = [...OFFLINE_CARDS];
  // 若有薄弱类别，优先把该类别的卡片排在前面
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
    id: `off-w${wave}-${idx}-${Date.now()}`,
  }));
}
