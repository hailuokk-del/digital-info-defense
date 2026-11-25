import React, { useState } from 'react';
import { X, Cpu, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { AIConfig, AIProvider } from '../types';

interface Props {
  config: AIConfig;
  onSave: (cfg: AIConfig) => void;
  onClose: () => void;
}

const DEFAULT_MODELS: Record<AIProvider, string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  zhipu: ['glm-4-flash', 'glm-4-air', 'glm-4-plus'],
};

export const AISettingsModal: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [provider, setProvider] = useState<AIProvider>(config.provider);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleProviderChange = (next: AIProvider) => {
    setProvider(next);
    setModel(DEFAULT_MODELS[next][0]);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model }),
      });
      const data = await res.json();
      setTestResult({ ok: Boolean(data.ok), msg: data.message });
    } catch {
      setTestResult({ ok: false, msg: '无法连接到本地后端服务，请确认已运行 npm run dev' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({ provider, apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODELS[provider][0] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-sky-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">AI 大模型接口配置</h2>
              <p className="text-xs text-slate-500">支持 DeepSeek 与智谱 GLM，留空则使用离线题库</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/80 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 服务商选择 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">选择 AI 服务商</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleProviderChange('deepseek')}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  provider === 'deepseek'
                    ? 'border-sky-500 bg-sky-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">DeepSeek</div>
                <div className="text-[11px] text-slate-500 mt-0.5">深度求索开放平台</div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('zhipu')}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  provider === 'zhipu'
                    ? 'border-indigo-500 bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">智谱 AI (GLM)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">BigModel 开放平台</div>
              </button>
            </div>
          </div>

          {/* API Key 输入 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              API Key（仅保存在当前浏览器本地）
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'deepseek' ? 'sk-xxxxxxxxxxxxxxxx' : '输入智谱 API Key'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-sm text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">模型名称</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEFAULT_MODELS[provider].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    model === m
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* 连通性测试结果 */}
          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="break-all">{testResult.msg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50 transition"
            >
              {testing && <Loader2 className="w-4 h-4 animate-spin" />}
              测试连接
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 hover:brightness-105 transition"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
