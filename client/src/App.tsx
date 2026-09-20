import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud, Activity, Settings, Database, Play, CheckCircle,
  Sun, Moon, Cpu, FileSpreadsheet, X, Trophy, Target, Zap,
  TrendingUp, BarChart2, GitBranch, Layers, Award, ChevronRight,
  Brain, FlaskConical
} from 'lucide-react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ResponsiveContainer, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from 'recharts';

// ─── Animated Counter ──────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 900;
    const step = 16;
    const increment = (end - start) / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

// ─── Confusion Matrix ───────────────────────────────────────────────────────
function ConfusionMatrix({ matrix, isDarkMode }: { matrix: number[][]; isDarkMode: boolean }) {
  if (!matrix || matrix.length === 0) return null;
  const max = Math.max(...matrix.flat());
  const labels = matrix.length === 2 ? ['Negative', 'Positive'] : matrix.map((_, i) => `Class ${i}`);
  return (
    <div className="flex flex-col items-center gap-2">
      <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Predicted →</p>
      <div className="flex gap-1 items-center">
        <p className={`text-xs mr-2 writing-mode-vertical transform -rotate-90 whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Actual ↑</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, minmax(0, 1fr))` }}>
          {matrix.map((row, i) =>
            row.map((val, j) => {
              const intensity = max > 0 ? val / max : 0;
              const isCorrect = i === j;
              return (
                <div
                  key={`${i}-${j}`}
                  className="w-16 h-16 flex flex-col items-center justify-center rounded-lg text-white font-bold text-sm transition-all"
                  style={{
                    backgroundColor: isCorrect
                      ? `rgba(16, 185, 129, ${0.2 + intensity * 0.7})`
                      : `rgba(239, 68, 68, ${0.1 + intensity * 0.6})`,
                    border: isCorrect ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(239,68,68,0.3)'
                  }}
                  title={`Actual: ${labels[i]}, Predicted: ${labels[j]}`}
                >
                  <span className="text-base">{val}</span>
                  <span className="text-[9px] opacity-70">{labels[j]}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-3 h-3 rounded bg-emerald-500/60 inline-block"></span>Correct</span>
        <span className="flex items-center gap-1 text-xs text-red-400"><span className="w-3 h-3 rounded bg-red-500/60 inline-block"></span>Incorrect</span>
      </div>
    </div>
  );
}

// ─── Medal Badge ────────────────────────────────────────────────────────────
function MedalBadge({ rank }: { rank: number }) {
  if (rank === 0) return <span className="text-lg">🥇</span>;
  if (rank === 1) return <span className="text-lg">🥈</span>;
  if (rank === 2) return <span className="text-lg">🥉</span>;
  return <span className="text-xs font-bold text-gray-500">#{rank + 1}</span>;
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, isDarkMode }: any) {
  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`} />
      <div className={`p-2.5 rounded-xl w-fit ${color.replace('bg-', 'bg-').replace('500', '500/15')}`}>
        {icon}
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
        <p className="text-2xl font-black mt-0.5">{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Pipeline Step ───────────────────────────────────────────────────────────
function PipelineStep({ icon, label, done, active }: { icon: React.ReactNode; label: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
        done ? 'bg-emerald-500 border-emerald-500 text-white' :
        active ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse' :
        'bg-gray-800 border-gray-700 text-gray-600'
      }`}>{icon}</div>
      <span className={`text-[10px] font-semibold text-center ${done ? 'text-emerald-400' : active ? 'text-indigo-400' : 'text-gray-600'}`}>{label}</span>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [file, setFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [enableDL, setEnableDL] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'queued' | 'success' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [results, setResults] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [cmModel, setCmModel] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'deep_learning'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'queued' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`http://localhost:5001/api/jobs/${jobId}`);
          if (res.data.status === 'completed' || res.data.status === 'success') {
            setResults(res.data.data);
            if (res.data.data.task_type === 'SUPERVISED' && res.data.data.supervised_results) {
              const models = Object.keys(res.data.data.supervised_results.evaluations || {});
              if (models.length > 0) { setSelectedModel(models[0]); setCmModel(models[0]); }
            }
            setStatus('success');
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setStatus('error');
            clearInterval(interval);
          }
        } catch (err) { console.error('Polling error', err); }
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [status, jobId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    const formData = new FormData();
    formData.append('dataset', file);
    formData.append('target', targetColumn);
    formData.append('enable_dl', enableDL.toString());
    try {
      const res = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setJobId(res.data.jobId);
      setStatus('queued');
    } catch { setStatus('error'); }
  };

  const reset = () => { setFile(null); setTargetColumn(''); setStatus('idle'); setJobId(null); setResults(null); setActiveTab('overview'); };

  // ── Data helpers ──
  const evals = results?.supervised_results?.evaluations || {};
  const modelNames = Object.keys(evals);

  const sortedModels = [...modelNames].sort((a, b) => (evals[b]?.accuracy || 0) - (evals[a]?.accuracy || 0));
  const bestModel = sortedModels[0];
  const bestAccuracy = evals[bestModel]?.accuracy || 0;

  const getAccuracies = () => modelNames.map(name => ({
    name: name.replace('_ensemble', ' ens.').replace('_', ' '),
    fullName: name,
    Accuracy: parseFloat((evals[name]?.accuracy * 100).toFixed(1)),
    F1: parseFloat(((evals[name]?.f1_score || 0) * 100).toFixed(1)),
  }));

  const getRocCurve = (model: string) => {
    const ev = evals[model];
    if (!ev?.roc_curve) return [];
    return ev.roc_curve.map((p: any) => ({ fpr: +p.fpr.toFixed(3), tpr: +p.tpr.toFixed(3) }));
  };

  const radarData = modelNames.map(name => ({
    model: name.replace('_ensemble', '').replace('_', ' '),
    Accuracy: +((evals[name]?.accuracy || 0) * 100).toFixed(1),
    F1: +((evals[name]?.f1_score || 0) * 100).toFixed(1),
    AUC: +((evals[name]?.roc_auc || 0) * 100).toFixed(1),
  }));

  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const cs = (cls: string) => isDarkMode ? cls : cls;

  const card = isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0f] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>

      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`w-64 flex flex-col border-r transition-colors duration-300 ${isDarkMode ? 'bg-[#0d0d14] border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="font-black text-xl flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
              <Activity className="text-indigo-400 animate-pulse" size={22} />
            </div>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ML Studio</span>
          </div>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Data Pipeline Engine v1.0</p>
        </div>

        {/* Nav */}
        <div className="p-4 flex-1">
          <p className={`text-[10px] font-bold tracking-widest uppercase mb-3 px-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Workspace</p>
          <nav className="space-y-1">
            {[
              { icon: <Database size={18} />, label: 'Datasets', active: true },
              { icon: <Cpu size={18} />, label: 'Models', active: false },
              { icon: <GitBranch size={18} />, label: 'Pipelines', active: false },
              { icon: <BarChart2 size={18} />, label: 'Experiments', active: false },
              { icon: <Settings size={18} />, label: 'Settings', active: false },
            ].map(({ icon, label, active }) => (
              <button key={label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? isDarkMode ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700'
                  : isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}>
                {icon} {label}
              </button>
            ))}
          </nav>

          {/* Status widget */}
          {status === 'queued' && (
            <div className="mt-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-xs font-semibold text-indigo-300">Training Active</span>
              </div>
              <p className="text-[11px] text-gray-500">Job #{jobId} running…</p>
            </div>
          )}
          {status === 'success' && (
            <div className="mt-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">Analysis Done</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">{modelNames.length} models trained</p>
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors ${
            isDarkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}>
            {isDarkMode ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
          </button>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto">

        {/* Header */}
        <header className={`px-8 py-5 border-b sticky top-0 z-20 backdrop-blur-md ${isDarkMode ? 'border-gray-800/50 bg-[#0a0a0f]/80' : 'border-gray-200 bg-gray-50/80'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Data Pipeline Engine</h1>
              <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Automated EDA → Ensemble Learning → Deep Learning → Interactive Visualizations
              </p>
            </div>
            {status === 'success' && (
              <button onClick={reset} className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}>
                + New Analysis
              </button>
            )}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">

          {/* ─── IDLE: Upload Zone ──────────────────────────────────────── */}
          {status === 'idle' && (
            <div className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                  file
                    ? isDarkMode ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-emerald-400 bg-emerald-50'
                    : isDarkMode ? 'border-indigo-500/30 bg-[#12121a] hover:border-indigo-500/60 hover:bg-indigo-500/5' : 'border-indigo-300 bg-white hover:border-indigo-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none bg-indigo-500" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none bg-purple-500" />

                <div className={`p-5 rounded-2xl mb-6 ${file ? 'bg-emerald-500/10' : 'bg-indigo-500/10'}`}>
                  {file ? <FileSpreadsheet size={52} className="text-emerald-400" /> : <UploadCloud size={52} className="text-indigo-400" />}
                </div>
                <h3 className="text-2xl font-black mb-2">{file ? '✅ Dataset Ready' : 'Drop your CSV here'}</h3>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {file ? <span className="font-mono px-3 py-1 rounded bg-black/20">{file.name}</span> : 'Drag & drop or click to browse • Supports CSV format'}
                </p>
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                <span className={`px-6 py-2.5 rounded-xl font-semibold text-sm ${file ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                  {file ? 'Replace File' : 'Browse Files'}
                </span>
              </div>

              {/* Pipeline phases display */}
              {file && (
                <div className={`p-7 rounded-2xl border ${card}`}>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Layers size={20} className="text-indigo-400" /> Pipeline Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Target Column</label>
                      <input
                        type="text"
                        value={targetColumn}
                        onChange={e => setTargetColumn(e.target.value)}
                        placeholder="e.g. 'diabetes' or 'price'"
                        className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Leave blank for unsupervised mode (PCA + K-Means)</p>
                    </div>
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <input id="dl" type="checkbox" checked={enableDL} onChange={e => setEnableDL(e.target.checked)} className="w-5 h-5 mt-0.5 accent-indigo-500" />
                      <div>
                        <label htmlFor="dl" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
                          <Brain size={15} className="text-purple-400" /> Enable Deep Learning
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Builds & trains a Keras MLP with Early Stopping</p>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline phases */}
                  <div className={`flex items-center justify-between px-6 py-4 rounded-xl mb-6 ${isDarkMode ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
                    {[
                      { icon: <Database size={16} />, label: 'EDA' },
                      { icon: <TrendingUp size={16} />, label: 'Preprocess' },
                      { icon: <Layers size={16} />, label: 'Ensemble' },
                      { icon: <GitBranch size={16} />, label: 'Unsupervised' },
                      { icon: <Brain size={16} />, label: 'Deep Learning' },
                      { icon: <BarChart2 size={16} />, label: 'Dashboard' },
                    ].map((step, i, arr) => (
                      <React.Fragment key={step.label}>
                        <PipelineStep icon={step.icon} label={step.label} done={false} active={false} />
                        {i < arr.length - 1 && <ChevronRight size={14} className="text-gray-700 mt-[-16px]" />}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleUpload}
                      disabled={status === 'uploading'}
                      className="group flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      Run Full Pipeline <Play size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── UPLOADING ───────────────────────────────────────────────── */}
          {status === 'uploading' && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-lg font-semibold text-indigo-400">Uploading dataset…</p>
              </div>
            </div>
          )}

          {/* ─── QUEUED: Live Pipeline View ───────────────────────────────── */}
          {status === 'queued' && (
            <div className={`p-10 rounded-3xl border text-center ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-center gap-6 mb-8">
                {[
                  { icon: <Database size={16} />, label: 'EDA', done: true, active: false },
                  { icon: <TrendingUp size={16} />, label: 'Preprocess', done: true, active: false },
                  { icon: <Layers size={16} />, label: 'Ensemble', done: false, active: true },
                  { icon: <GitBranch size={16} />, label: 'Unsupervised', done: false, active: false },
                  { icon: <Brain size={16} />, label: 'Deep Learning', done: false, active: false },
                  { icon: <BarChart2 size={16} />, label: 'Dashboard', done: false, active: false },
                ].map((step, i, arr) => (
                  <React.Fragment key={step.label}>
                    <PipelineStep {...step} />
                    {i < arr.length - 1 && <ChevronRight size={14} className="text-gray-700 mt-[-16px]" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-indigo-500/20 mb-5 animate-pulse">
                <Cpu size={44} className="text-indigo-400" />
              </div>
              <h3 className="text-3xl font-black mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Training Models…
              </h3>
              <p className="text-gray-400 max-w-md mx-auto text-sm">
                Running GridSearchCV across 4 algorithms, building Voting & Stacking ensembles, then fitting the Keras MLP. Dashboard will appear automatically when complete.
              </p>
              <div className="flex justify-center gap-2 mt-6">
                {['EDA', 'Preprocessing', 'GridSearchCV', 'Ensembles', 'Evaluation'].map((s, i) => (
                  <span key={s} className={`text-xs px-3 py-1 rounded-full border ${i < 2 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : i === 2 ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 animate-pulse' : 'border-gray-700 text-gray-600'}`}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* ─── SUCCESS DASHBOARD ────────────────────────────────────────── */}
          {status === 'success' && results && (
            <div className="space-y-6">

              {/* Success banner */}
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl"><CheckCircle className="text-emerald-400" size={26} /></div>
                  <div>
                    <h2 className="text-xl font-black">Analysis Complete 🎉</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Mode: <span className="font-mono text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded">{results.task_type}</span>
                      {results.preprocessing?.original_shape && <> &nbsp;·&nbsp; Dataset: <span className="text-gray-300">{results.preprocessing.original_shape[0].toLocaleString()} rows × {results.preprocessing.original_shape[1]} cols</span></>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">Job #{results.job_id}</span>
                </div>
              </div>

              {/* ── SUPERVISED ── */}
              {results.task_type === 'SUPERVISED' && results.supervised_results && (() => {
                const rowCount = results.preprocessing?.original_shape?.[0] || 0;
                const colCount = results.preprocessing?.original_shape?.[1] || 0;

                return (
                  <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard isDarkMode={isDarkMode} icon={<Trophy size={20} className="text-yellow-400" />} label="Best Model" value={bestModel?.replace(/_/g, ' ')} color="bg-yellow-500" />
                      <StatCard isDarkMode={isDarkMode} icon={<Target size={20} className="text-emerald-400" />} label="Best Accuracy"
                        value={<AnimatedNumber value={bestAccuracy * 100} decimals={1} suffix="%" />} sub={`ROC AUC: ${(evals[bestModel]?.roc_auc * 100 || 0).toFixed(1)}%`} color="bg-emerald-500" />
                      <StatCard isDarkMode={isDarkMode} icon={<Layers size={20} className="text-indigo-400" />} label="Models Trained" value={modelNames.length} sub="incl. Voting + Stacking" color="bg-indigo-500" />
                      <StatCard isDarkMode={isDarkMode} icon={<Database size={20} className="text-purple-400" />} label="Dataset Size" value={rowCount.toLocaleString()} sub={`${colCount} features`} color="bg-purple-500" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-800">
                      {(['overview', 'models', 'deep_learning'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                          {tab.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* ── Overview Tab ── */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Accuracy + F1 grouped bar */}
                        <div className={`p-6 rounded-2xl border ${card}`}>
                          <h3 className="text-base font-bold mb-1 flex items-center gap-2"><BarChart2 size={18} className="text-indigo-400" /> Accuracy vs F1 Score — All Models</h3>
                          <p className="text-xs text-gray-500 mb-5">Higher is better. Ensemble models (Voting, Stacking) typically outperform individual classifiers.</p>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getAccuracies()} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
                                <YAxis stroke="#6b7280" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} formatter={(v: any) => [`${v}%`]} />
                                <Legend />
                                <Bar dataKey="Accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="F1" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* ROC Curve */}
                        <div className={`p-6 rounded-2xl border ${card}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-base font-bold flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> ROC Curve</h3>
                              <p className="text-xs text-gray-500 mt-0.5">AUC = {((evals[selectedModel]?.roc_auc || 0) * 100).toFixed(2)}% — closer to top-left corner is better</p>
                            </div>
                            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-300'}`}>
                              {modelNames.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getRocCurve(selectedModel)} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} />
                                <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="#6b7280" label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 11 }} />
                                <YAxis type="number" domain={[0, 1]} stroke="#6b7280" label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                                <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={3} dot={false} name="ROC Curve" />
                                {/* Diagonal reference line — fake it with data */}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Radar Chart */}
                        {radarData.length > 0 && (
                          <div className={`p-6 rounded-2xl border ${card}`}>
                            <h3 className="text-base font-bold mb-1 flex items-center gap-2"><Zap size={18} className="text-yellow-400" /> Multi-Metric Radar</h3>
                            <p className="text-xs text-gray-500 mb-5">Accuracy, F1, and AUC (×100) per model — outer = better</p>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                  <PolarGrid stroke={isDarkMode ? '#1f2937' : '#e5e7eb'} />
                                  <PolarAngleAxis dataKey="model" tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
                                  <Radar name="Accuracy" dataKey="Accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                                  <Radar name="F1" dataKey="F1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                  <Radar name="AUC" dataKey="AUC" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                                  <Legend />
                                  <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Models Tab ── */}
                    {activeTab === 'models' && (
                      <div className="space-y-5">
                        {/* Model leaderboard */}
                        <div className={`rounded-2xl border overflow-hidden ${card}`}>
                          <div className="px-6 pt-5 pb-3">
                            <h3 className="text-base font-bold flex items-center gap-2"><Award size={18} className="text-yellow-400" /> Model Leaderboard</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Sorted by accuracy (descending)</p>
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className={isDarkMode ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-50 text-gray-500'}>
                                <th className="px-6 py-3 text-left font-semibold text-xs uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left font-semibold text-xs uppercase tracking-wider">Model</th>
                                <th className="px-6 py-3 text-right font-semibold text-xs uppercase tracking-wider">Accuracy</th>
                                <th className="px-6 py-3 text-right font-semibold text-xs uppercase tracking-wider">F1 Score</th>
                                <th className="px-6 py-3 text-right font-semibold text-xs uppercase tracking-wider">ROC AUC</th>
                                <th className="px-6 py-3 text-right font-semibold text-xs uppercase tracking-wider">RMSE</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {sortedModels.map((name, rank) => {
                                const ev = evals[name];
                                return (
                                  <tr key={name} className={`transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${rank === 0 ? isDarkMode ? 'bg-yellow-500/5' : 'bg-yellow-50' : ''}`}>
                                    <td className="px-6 py-4"><MedalBadge rank={rank} /></td>
                                    <td className="px-6 py-4 font-semibold">{name.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-4 text-right">
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${ev?.accuracy >= 0.95 ? 'bg-emerald-500/20 text-emerald-400' : ev?.accuracy >= 0.85 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {ev?.accuracy !== undefined ? `${(ev.accuracy * 100).toFixed(2)}%` : '—'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-400">{ev?.f1_score !== undefined ? `${(ev.f1_score * 100).toFixed(2)}%` : '—'}</td>
                                    <td className="px-6 py-4 text-right text-gray-400">{ev?.roc_auc !== undefined ? `${(ev.roc_auc * 100).toFixed(2)}%` : '—'}</td>
                                    <td className="px-6 py-4 text-right text-gray-400">{ev?.rmse !== undefined ? ev.rmse.toFixed(4) : '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Confusion Matrix */}
                        <div className={`p-6 rounded-2xl border ${card}`}>
                          <div className="flex items-center justify-between mb-5">
                            <div>
                              <h3 className="text-base font-bold flex items-center gap-2"><FlaskConical size={18} className="text-purple-400" /> Confusion Matrix</h3>
                              <p className="text-xs text-gray-500 mt-0.5">Green = correct predictions, Red = misclassifications</p>
                            </div>
                            <select value={cmModel} onChange={e => setCmModel(e.target.value)} className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-300'}`}>
                              {modelNames.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div className="flex justify-center">
                            <ConfusionMatrix matrix={evals[cmModel]?.confusion_matrix || []} isDarkMode={isDarkMode} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Deep Learning Tab ── */}
                    {activeTab === 'deep_learning' && results.dl_results && (
                      <div className="space-y-6">
                        {/* DL stat cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <StatCard isDarkMode={isDarkMode} icon={<Brain size={20} className="text-purple-400" />} label="Epochs Trained" value={results.dl_results.epochs_trained} sub="with Early Stopping" color="bg-purple-500" />
                          <StatCard isDarkMode={isDarkMode} icon={<Target size={20} className="text-emerald-400" />} label="MLP Accuracy"
                            value={<AnimatedNumber value={(results.dl_results.evaluation?.accuracy || 0) * 100} decimals={1} suffix="%" />} color="bg-emerald-500" />
                          <StatCard isDarkMode={isDarkMode} icon={<Zap size={20} className="text-yellow-400" />} label="MLP AUC"
                            value={<AnimatedNumber value={(results.dl_results.evaluation?.roc_auc || 0) * 100} decimals={1} suffix="%" />} color="bg-yellow-500" />
                          <StatCard isDarkMode={isDarkMode} icon={<Activity size={20} className="text-indigo-400" />} label="Architecture" value="MLP" sub="Dense(128)→Drop→Dense(64)" color="bg-indigo-500" />
                        </div>

                        {/* Training curves */}
                        {results.dl_results.training_curve && (
                          <div className={`p-6 rounded-2xl border ${card}`}>
                            <h3 className="text-base font-bold mb-1 flex items-center gap-2"><Activity size={18} className="text-indigo-400" /> Training Curves</h3>
                            <p className="text-xs text-gray-500 mb-5">Loss and accuracy per epoch — Early Stopping prevents overfitting</p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-semibold text-gray-400 mb-2">Loss</p>
                                <div className="h-56">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={results.dl_results.training_curve} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} />
                                      <XAxis dataKey="epoch" stroke="#6b7280" />
                                      <YAxis stroke="#6b7280" />
                                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                                      <Legend />
                                      <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} name="Train Loss" />
                                      <Line type="monotone" dataKey="val_loss" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Val Loss" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-400 mb-2">Accuracy</p>
                                <div className="h-56">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={results.dl_results.training_curve} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} />
                                      <XAxis dataKey="epoch" stroke="#6b7280" />
                                      <YAxis stroke="#6b7280" domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} formatter={(v: any) => [`${(v * 100).toFixed(1)}%`]} />
                                      <Legend />
                                      <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={false} name="Train Acc" />
                                      <Line type="monotone" dataKey="val_accuracy" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Val Acc" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DL Confusion Matrix */}
                        {results.dl_results.evaluation?.confusion_matrix && (
                          <div className={`p-6 rounded-2xl border ${card}`}>
                            <h3 className="text-base font-bold mb-5 flex items-center gap-2"><FlaskConical size={18} className="text-purple-400" /> MLP Confusion Matrix</h3>
                            <div className="flex justify-center">
                              <ConfusionMatrix matrix={results.dl_results.evaluation.confusion_matrix} isDarkMode={isDarkMode} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'deep_learning' && !results.dl_results && (
                      <div className={`p-10 rounded-2xl border text-center ${card}`}>
                        <Brain size={40} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">Deep Learning was not enabled for this run.</p>
                        <p className="text-sm text-gray-600 mt-1">Toggle "Enable Deep Learning" before uploading to see MLP training curves.</p>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* ── UNSUPERVISED ── */}
              {results.task_type === 'UNSUPERVISED' && results.unsupervised_results && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard isDarkMode={isDarkMode} icon={<GitBranch size={20} className="text-purple-400" />} label="Optimal Clusters (k)" value={results.unsupervised_results.kmeans?.best_k ?? '—'} color="bg-purple-500" />
                    <StatCard isDarkMode={isDarkMode} icon={<Layers size={20} className="text-indigo-400" />} label="PCA Components" value={results.unsupervised_results.pca?.explained_variance_ratio?.length ?? '—'} sub="Dimensionality reduction" color="bg-indigo-500" />
                    <StatCard isDarkMode={isDarkMode} icon={<Database size={20} className="text-cyan-400" />} label="Dataset Rows" value={results.preprocessing?.original_shape?.[0]?.toLocaleString() ?? '—'} color="bg-cyan-500" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-2xl border ${card}`}>
                      <h3 className="text-base font-bold mb-5">PCA 2D Projection</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} />
                            <XAxis dataKey="x" type="number" stroke="#6b7280" name="PC 1" />
                            <YAxis dataKey="y" type="number" stroke="#6b7280" name="PC 2" />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                            <Scatter data={(results.unsupervised_results.pca?.projections || []).slice(0, 500)} fill="#8b5cf6" opacity={0.7} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className={`p-6 rounded-2xl border ${card}`}>
                      <h3 className="text-base font-bold mb-1">K-Means Silhouette Score</h3>
                      <p className="text-xs text-gray-500 mb-4">Peak = optimal number of clusters</p>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={results.unsupervised_results.kmeans?.elbow_silhouette_curve || []} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} />
                            <XAxis dataKey="k" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                            <Line type="monotone" dataKey="silhouette" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} name="Silhouette" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
