import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Play,
  Settings,
  Volume2,
  VolumeX,
  Search,
  Trophy,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { AIConfig, GameReport } from './types';
import { soundFX } from './utils/sound';
import { AISettingsModal } from './components/AISettingsModal';
import { VerifyToolModal } from './components/VerifyToolModal';
import { GameCanvas } from './components/GameCanvas';
import { ReportModal } from './components/ReportModal';

const STORAGE_AI_KEY = 'did_ai_config_v1';
const STORAGE_BEST_SCORE = 'did_best_score_v1';

export default function App() {
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AI_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { provider: 'deepseek', apiKey: '', model: 'deepseek-chat' };
  });

  const [bestScore, setBestScore] = useState<number>(() => {
    return Number(localStorage.getItem(STORAGE_BEST_SCORE) || 0);
  });

  const [muted, setMuted] = useState(false);
  const [view, setView] = useState<'home' | 'playing'>('home');
  const [gameKey, setGameKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [report, setReport] = useState<GameReport | null>(null);

  useEffect(() => {
    soundFX.muted = muted;
  }, [muted]);

  const handleSaveAI = (cfg: AIConfig) => {
    setAiConfig(cfg);
    localStorage.setItem(STORAGE_AI_KEY, JSON.stringify(cfg));
  };

  const handleGameOver = (rep: GameReport) => {
    setReport(rep);
    if (rep.score > bestScore) {
      setBestScore(rep.score);
      localStorage.setItem(STORAGE_BEST_SCORE, String(rep.score));
    }
  };

  const startGame = () => {
    setReport(null);
    setGameKey((k) => k + 1);
    setView('playing');
  };

  const aiLabel = aiConfig.apiKey
    ? aiConfig.provider === 'deepseek'
      ? 'DeepSeek'
      : '智谱 GLM'
    : 'AI 设置';

  return (
    <div className="h-full w-full bg-sky-100 text-slate-800 flex flex-col overflow-hidden">
      {view === 'home' ? (
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col justify-between">
          {/* 商业手游级全屏 3D 卡通主视觉背景 */}
          <img
            src="/assets/hero-bg.jpg"
            alt="数字信息保卫战"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* 上下柔光渐变遮罩，确保文字与按钮高对比可读 */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/45 via-transparent to-sky-950/65" />

          {/* 顶部悬浮手游状态栏 */}
          <header className="relative z-10 max-w-xl w-full mx-auto px-4 pt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-white">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-slate-700">
                最高战绩 <span className="text-amber-600">{bestScore}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="p-2.5 rounded-2xl bg-white/90 backdrop-blur-md text-sky-700 shadow-lg border border-white hover:bg-white transition"
                title="玩法介绍"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMuted(!muted)}
                className="p-2.5 rounded-2xl bg-white/90 backdrop-blur-md text-slate-700 shadow-lg border border-white hover:bg-white transition"
                title={muted ? '开启音效' : '静音'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black shadow-lg border transition backdrop-blur-md ${
                  aiConfig.apiKey
                    ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
                    : 'bg-white/90 text-sky-700 border-white hover:bg-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{aiLabel}</span>
              </button>
            </div>
          </header>

          {/* 中上区游戏立体大标题 */}
          <div className="relative z-10 text-center px-4 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-sky-700 text-xs font-black shadow-md mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              “智趣未来” AI 互动防诈科普小游戏
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black text-white tracking-tight"
              style={{
                textShadow: '0 4px 0 #0369a1, 0 8px 20px rgba(2, 132, 199, 0.55)',
              }}
            >
              数字信息保卫战
            </h1>
            <p
              className="text-sm sm:text-base font-bold text-sky-50 mt-2"
              style={{ textShadow: '0 2px 8px rgba(15, 23, 42, 0.55)' }}
            >
              驾驶激光坦克击落病毒战机 · 守护城市数字防线
            </p>
          </div>

          {/* 底部手游立体按键区 */}
          <div className="relative z-10 max-w-md w-full mx-auto px-5 pb-7 space-y-3">
            <button
              type="button"
              onClick={startGame}
              className="w-full flex items-center justify-center gap-2.5 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 border-b-[6px] border-orange-700 py-4 text-xl font-black text-amber-950 shadow-2xl hover:brightness-105 active:translate-y-1 active:border-b-[2px] transition-all"
            >
              <Play className="w-6 h-6 fill-current" />
              立即出击！
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowVerify(true)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-600 border-b-4 border-teal-800 py-3 text-xs sm:text-sm font-black text-white shadow-lg hover:brightness-105 active:translate-y-0.5 transition-all"
              >
                <Search className="w-4 h-4" />
                现实信息照妖镜
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/95 border-b-4 border-sky-300 py-3 text-xs sm:text-sm font-black text-sky-800 shadow-lg hover:bg-white active:translate-y-0.5 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                新手玩法教学
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 h-full overflow-hidden">
          <GameCanvas
            key={gameKey}
            aiConfig={aiConfig}
            onGameOver={handleGameOver}
            onExit={() => setView('home')}
          />
        </div>
      )}

      {/* 大厅玩法说明弹窗 */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-sky-100 space-y-4">
            <h2 className="text-lg font-black text-slate-800 text-center">🎮 新手 30 秒上手指南</h2>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
                <span className="font-black text-sky-700">⚠️ 注意伪装机制：</span>
                所有空中无人机/飞船外观都会随机出现，不会直接用颜色区分真假！请务必<span className="font-bold text-slate-800">阅读卡片文字内容</span>来做判断。
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="font-black text-rose-600">1. 击落假消息：</span>
                看到“中奖补贴、领红包、客服退款、领导急借钱、伪科学谣言”，直接点击它，坦克会自动发射激光击毁！
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="font-black text-emerald-600">2. 放行真科普：</span>
                看到“96110反诈提醒、地震预警、网络安全常识”等真实信息，不要点击它，让它安全落入底部护盾即可加分！
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="font-black text-amber-700">3. 善用 AI 技能：</span>
                拿不准时点击【AI 透视镜】进入 5 秒慢动作，AI 会直接标出红/绿提示；连击充能满 100% 可释放【全屏防火墙】清屏！
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 border-b-4 border-blue-800 py-3 text-sm font-black text-white active:translate-y-0.5 transition"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <AISettingsModal
          config={aiConfig}
          onSave={handleSaveAI}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showVerify && (
        <VerifyToolModal
          aiConfig={aiConfig}
          onClose={() => setShowVerify(false)}
        />
      )}

      {report && (
        <ReportModal
          report={report}
          onReplay={startGame}
          onBackHome={() => {
            setReport(null);
            setView('home');
          }}
        />
      )}
    </div>
  );
}
