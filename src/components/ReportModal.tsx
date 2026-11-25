import React from 'react';
import { Award, RotateCcw, Home, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GameReport } from '../types';

interface Props {
  report: GameReport;
  onReplay: () => void;
  onBackHome: () => void;
}

export const ReportModal: React.FC<Props> = ({ report, onReplay, onBackHome }) => {
  const rank =
    report.accuracy >= 90 && report.score >= 800
      ? { label: 'S 级 · 火眼金睛卫士', color: 'text-amber-600 bg-amber-50 border-amber-200' }
      : report.accuracy >= 75
      ? { label: 'A 级 · 数字安全达人', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
      : { label: 'B 级 · 反诈新锐', color: 'text-sky-600 bg-sky-50 border-sky-200' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-sky-100 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
            <Award className="w-4 h-4" />
            数字素养防线战报
          </div>
          <div className="text-4xl font-black tracking-tight">{report.score} 分</div>
          <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 shadow-sm">
            {rank.label}
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* 核心数据 */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-2xl bg-sky-50 p-3 border border-sky-100">
              <div className="text-xs text-slate-500">坚守波次</div>
              <div className="text-lg font-extrabold text-sky-700 mt-0.5">第 {report.waveReached} 波</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-100">
              <div className="text-xs text-slate-500">甄别准确率</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-0.5">{report.accuracy}%</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 border border-amber-100">
              <div className="text-xs text-slate-500">最高连击</div>
              <div className="text-lg font-extrabold text-amber-600 mt-0.5">{report.maxCombo} 连击</div>
            </div>
          </div>

          {/* 分类防御能力 */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 mb-2.5">各领域信息甄别表现</h3>
            <div className="space-y-2">
              {Object.entries(report.categoryStats).map(([cat, st]) => {
                const rate = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 100;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="text-slate-500">
                        {st.correct}/{st.total} ({rate}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 错题与破绽复盘 */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              {report.mistakes.length > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  本局失误复盘（共 {report.mistakes.length} 条）
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  完美防御！本局零失误
                </>
              )}
            </h3>

            {report.mistakes.length > 0 && (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {report.mistakes.map((m, i) => (
                  <div key={i} className="rounded-xl bg-rose-50/60 border border-rose-100 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">{m.card.title}</span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.type === 'missed_malicious'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {m.type === 'missed_malicious' ? '漏防假消息' : '误伤真信息'}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">💡 解析：{m.card.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <Home className="w-4 h-4" />
            返回大厅
          </button>
          <button
            type="button"
            onClick={onReplay}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-sky-200 hover:brightness-105 transition"
          >
            <RotateCcw className="w-4 h-4" />
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
};
