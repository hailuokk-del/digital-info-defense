import React, { useState } from 'react';
import { X, Search, ShieldAlert, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { AIConfig, AnalyzeResult } from '../types';

interface Props {
  aiConfig: AIConfig;
  onClose: () => void;
}

const SAMPLE_TEXTS = [
  '【医保局通知】您的电子医保卡已停用，请于今日24时前点击 http://yb-gov.xyz 完成实名认证，否则将影响报销！',
  '我是你部门王总，我现在在外面开会不方便接电话，你先帮我转2万元到这个合作方账号，下午回公司报销。',
  '国家反诈中心提醒：凡是自称公检法要求转账到“安全账户”的，都是电信网络诈骗。',
];

export const VerifyToolModal: React.FC<Props> = ({ aiConfig, onClose }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aiConfig, text }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        source: 'error',
        riskScore: 50,
        verdict: '分析服务暂不可用',
        category: '网络异常',
        highlights: [],
        advice: '请检查后端服务是否启动，或直接拨打 96110 反诈热线核实。',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-sky-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-sky-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">现实信息 AI 照妖镜</h2>
              <p className="text-xs text-slate-500">粘贴可疑短信、聊天记录或谣言，AI 帮你秒辨真伪</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/80 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600">快速填入示例测试：</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TEXTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setText(s);
                    setResult(null);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition"
                >
                  示例 {idx + 1}：{s.slice(0, 12)}...
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请在此粘贴您收到的可疑短信、邮件、微信对话或网络传言..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none resize-none"
          />

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:brightness-105 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'AI 正在深度扫描分析...' : '一键开启 AI 鉴伪扫描'}
          </button>

          {result && (
            <div
              className={`rounded-2xl p-4 border space-y-2.5 ${
                result.riskScore >= 65
                  ? 'bg-rose-50/70 border-rose-200'
                  : result.riskScore >= 35
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.riskScore >= 65 ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  )}
                  <span className="font-bold text-sm text-slate-800">{result.verdict}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    result.riskScore >= 65
                      ? 'bg-rose-500 text-white'
                      : result.riskScore >= 35
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  风险指数 {result.riskScore}%
                </span>
              </div>

              <div className="text-xs text-slate-600">
                <span className="font-semibold">风险类型：</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">{result.category}</span>
                <span className="ml-2 text-[11px] text-slate-400">
                  （引擎：{result.source === 'offline' ? '本地规则初筛' : result.source}）
                </span>
              </div>

              {result.highlights && result.highlights.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">高危特征词：</span>
                  {result.highlights.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-xs font-medium">
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs leading-relaxed text-slate-700 bg-white/80 rounded-xl p-3 border border-white">
                {result.advice}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
