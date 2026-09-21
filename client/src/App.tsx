import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud, Activity, Settings, Database, Play, Grid, CheckCircle,
  Sun, Moon, Cpu, FileSpreadsheet, Trophy, Target, Zap,
  TrendingUp, BarChart2, GitBranch, Layers, Award, ChevronRight, Network,
  Brain, FlaskConical, Sparkles, Download, AlertTriangle
, MessageSquare, X, Send } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const memoizedRemarkPlugins = [remarkGfm];
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ResponsiveContainer, ComposedChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from 'recharts';


function AiInsightBlock({ text, sectionKey, isDarkMode }: { text?: string, sectionKey: string, isDarkMode: boolean }) {
  const [chat, setChat] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');

  const [loading, setLoading] = useState(false);

  if (!text) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    setChat(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await axios.post('/api/insights/followup', {
        section: sectionKey,
        question: q,
        baseInsight: text
      });
      setChat(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to get answer.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mt-4 p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? 'bg-purple-900/20 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800'} text-sm shadow-inner`}>
      <div className="flex items-start gap-3">
        <Sparkles size={18} className="text-purple-400 mt-0.5 shrink-0" />
        <div className={`prose-sm max-w-none leading-relaxed w-full ${isDarkMode ? 'prose-invert prose-p:text-purple-200' : 'prose-p:text-purple-800'}`}>
          <ReactMarkdown remarkPlugins={memoizedRemarkPlugins}>{text}</ReactMarkdown>
        </div>
      </div>
      
      {chat.length > 0 && (
        <div className="mt-2 pl-8 flex flex-col gap-3 border-t border-purple-500/20 pt-3">
          {chat.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-2.5 rounded-lg max-w-[90%] ${msg.role === 'user' ? (isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-900') : (isDarkMode ? 'bg-gray-800/80 text-gray-200' : 'bg-white text-gray-800 border')}`}>
                {msg.role === 'assistant' ? <div className="prose-sm prose-p:m-0"><ReactMarkdown remarkPlugins={memoizedRemarkPlugins} components={markdownComponents}>{msg.content.replace(/<br\s*\/?>/gi, '\n')}</ReactMarkdown></div> : msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-purple-400 animate-pulse ml-2">Thinking...</div>}
        </div>
      )}

      <form onSubmit={handleAsk} className="mt-1 pl-8 relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask a follow-up about ${sectionKey}...`}
          className={`w-full text-xs rounded-lg pl-3 pr-10 py-2 border focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all ${isDarkMode ? 'bg-black/20 border-purple-500/30 text-white placeholder-gray-500' : 'bg-white border-purple-200 text-black placeholder-gray-400'}`}
        />
        <button type="submit" disabled={loading || !input.trim()} className="absolute right-2 p-1 text-purple-500 hover:text-purple-400 disabled:opacity-50">
          <Play size={14} className="fill-current" />
        </button>
      </form>
    </div>
  );
}
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

const markdownComponents = {
  table: ({node, ...props}: any) => <table className="w-full border-collapse border border-gray-500/30 my-3 text-sm" {...props} />,
  th: ({node, ...props}: any) => <th className="border border-gray-500/30 p-2.5 bg-gray-500/10 text-left font-bold" {...props} />,
  td: ({node, ...props}: any) => <td className="border border-gray-500/30 p-2.5 align-top" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
  li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
  a: ({node, ...props}: any) => <a className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
};

const CopilotChat = ({ jobId, status, file, targetColumn, enableDL, isDarkMode, setJobId, setStatus, setActiveTab }: any) => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<any[]>([]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  const handleCopilotSubmit = async (e: any) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;
    
    const newMsgs = [...copilotMessages, { role: "user", content: copilotInput }];
    setCopilotMessages(newMsgs);
    setCopilotInput("");
    setIsCopilotTyping(true);
    
    try {
      const res = await axios.post('/api/copilot/chat', {
        job_id: jobId,
        messages: newMsgs,
        dataset_path: file ? `/tmp/uploads/${file.name}` : undefined,
        target_column: targetColumn,
        enable_dl: enableDL
      });
      
      setCopilotMessages([...newMsgs, res.data.message]);
      
      if (res.data.new_job_id) {
        setJobId(res.data.new_job_id);
        setStatus('queued');
        setActiveTab('eda');
      }
    } catch (err) {
      console.error(err);
      setCopilotMessages([...newMsgs, { role: "assistant", content: "Error communicating with Copilot backend." }]);
    }
    setIsCopilotTyping(false);
  };

  if (status === 'idle') return null;

  return (
    <>
      {!isCopilotOpen && (
        <button 
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all z-50 flex items-center justify-center group"
        >
          <MessageSquare size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-2 font-bold">
            Pipeline Copilot
          </span>
        </button>
      )}

      {isCopilotOpen && (
        <div className={`fixed bottom-6 right-6 w-[450px] h-[550px] flex flex-col rounded-2xl shadow-2xl overflow-hidden z-50 border transition-all animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="font-bold">Pipeline Copilot</span>
            </div>
            <button onClick={() => setIsCopilotOpen(false)} className="hover:bg-white/20 p-1 rounded-md transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {copilotMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <MessageSquare size={48} className="mb-4" />
                <p className="text-sm">I'm your ML Copilot.<br/>Ask me to explain the data or instruct me to change preprocessing settings and retrain!</p>
              </div>
            )}
            {copilotMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-xs font-bold uppercase text-gray-500 mb-1 px-1">
                  {msg.role === 'user' ? 'You' : 'Copilot'}
                </span>
                <div className={`p-3 rounded-2xl max-w-[90%] text-sm shadow-sm overflow-x-auto ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : isDarkMode ? 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                }`}>
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' || isDarkMode ? 'prose-invert' : ''} prose-p:leading-relaxed prose-pre:bg-black/20 prose-pre:p-2 prose-pre:rounded-lg prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-gray-500/30 prose-th:p-2 prose-th:bg-gray-500/10 prose-td:border prose-td:border-gray-500/20 prose-td:p-2`}>
                    <ReactMarkdown remarkPlugins={memoizedRemarkPlugins} components={markdownComponents}>{msg.content.replace(/<br\s*\/?>/gi, '\n')}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isCopilotTyping && (
              <div className="flex items-start">
                <div className={`p-3 rounded-2xl rounded-bl-none ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleCopilotSubmit} className={`p-3 border-t flex gap-2 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
            <input 
              type="text" 
              placeholder="Drop income outliers and retrain..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              className={`flex-1 px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'
              }`}
            />
            <button type="submit" disabled={!copilotInput.trim() || isCopilotTyping} className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

function App() {
  const [inferenceForm, setInferenceForm] = useState<Record<string, any>>({});
  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [inferenceLoading, setInferenceLoading] = useState(false);
  const [selectedInferenceModel, setSelectedInferenceModel] = useState<string>('');

  const handleInferenceSubmit = async () => {
    if (!selectedInferenceModel) return;
    setInferenceLoading(true);
    setInferenceResult(null);
    try {
      const res = await axios.post(`/api/jobs/${jobId}/predict`, {
        model_name: selectedInferenceModel,
        features: inferenceForm
      });
      setInferenceResult(res.data);
    } catch (e: any) {
      alert("Inference failed: " + (e.response?.data?.error || e.message));
    } finally {
      setInferenceLoading(false);
    }
  };

  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const firstLine = text.split('\n')[0];
        const cols = firstLine.split(',').map(c => c.trim().replace(/^"|"$/g, '')).filter(c => c);
        setColumns(cols);
        setTargetColumn(''); // reset target when new file uploaded
      };
      reader.readAsText(file.slice(0, 1024)); // only read first 1KB
    } else {
      setColumns([]);
    }
  }, [file]);

  const [targetColumn, setTargetColumn] = useState<string>('');
  const searchParams = new URLSearchParams(window.location.search);
  const initialJobId = searchParams.get('job');
  const initialTab = searchParams.get('tab') as any || 'eda';

  const [enableDL, setEnableDL] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'queued' | 'success' | 'error'>(initialJobId ? 'queued' : 'idle');
  const [jobId, setJobId] = useState<string | null>(initialJobId);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#0a0a0f' : '#f9fafb';
  }, [isDarkMode]);

  const [results, setResults] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [cmModel, setCmModel] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'eda' | 'overview' | 'models' | 'deep_learning' | 'inference'>(initialTab);

  // URL Sync
  useEffect(() => {
    const url = new URL(window.location.href);
    if (jobId) url.searchParams.set('job', jobId);
    else url.searchParams.delete('job');
    
    if (activeTab !== 'eda') url.searchParams.set('tab', activeTab);
    else url.searchParams.delete('tab');

    window.history.replaceState({}, '', url);
  }, [jobId, activeTab]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [insights, setInsights] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    if (!results) return;
    setIsGeneratingInsights(true);
    setInsightError(null);
    try {
      const summary: any = {
        task_type: results.task_type,
        dataset_shape: results.preprocessing?.original_shape
      };
      if (results.task_type === 'SUPERVISED') {
        summary.models = {};
        Object.entries(results.supervised_results?.evaluations || {}).forEach(([m, ev]: any) => {
           summary.models[m] = { accuracy: ev.accuracy, f1_score: ev.f1_score, roc_auc: ev.roc_auc };
        });
      } else {
        summary.clustering = {
          optimal_k: results.unsupervised_results?.kmeans?.best_k,
          peak_silhouette: Math.max(...(results.unsupervised_results?.kmeans?.elbow_silhouette_curve || []).map((x:any)=>x.silhouette)),
          pca_variance: results.unsupervised_results?.pca?.explained_variance_ratio
        };
      }
      
      const res = await axios.post('/api/insights', { summary });
      setInsights(res.data.insights);
    } catch (err: any) {
      setInsightError(err.response?.data?.error || 'Failed to generate insights.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };


  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'queued' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/jobs/${jobId}`);
          if (res.data.status === 'success' && res.data.data) {
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

  
  // Auto-select the best model for Deep Dive when results load
  useEffect(() => {
    if (results?.task_type === 'SUPERVISED' && results.supervised_results?.evaluations) {
      const evals = results.supervised_results.evaluations;
      const sorted = Object.keys(evals).sort((a, b) => (evals[b].accuracy || 0) - (evals[a].accuracy || 0));
      if (sorted.length > 0 && !cmModel) {
        setCmModel(sorted[0]);
        if (!selectedInferenceModel) setSelectedInferenceModel(sorted[0]);
      }
    }
  }, [results, cmModel, selectedInferenceModel]);

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
      const res = await axios.post('/api/upload', formData, {
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
              { icon: <Database size={18} />, label: 'New Analysis', active: status === 'idle', onClick: reset },
              { icon: <Activity size={18} />, label: 'Results Dashboard', active: status !== 'idle', onClick: () => {} },
            ].map(({ icon, label, active, onClick }) => (
              <button key={label} onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? isDarkMode ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700'
                  : isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5 cursor-pointer' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer'
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
              <p className="text-[11px] text-gray-500">Pipeline running…</p>
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
                      <select
                        value={targetColumn}
                        onChange={e => setTargetColumn(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none font-medium ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">⚡️ Unsupervised (Clustering)</option>
                        {columns.length > 0 && <optgroup label="Supervised (Predict Column)">
                          {columns.map(c => (
                            <option key={c} value={c}>Predict '{c}'</option>
                          ))}
                        </optgroup>}
                      </select>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Sparkles size={12} className="text-indigo-400" />
                        {targetColumn ? `Supervised Pipeline will be built to predict ${targetColumn}` : 'No target selected. K-Means clustering will run.'}
                      </p>
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
                      disabled={status as string === 'uploading'}
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
          {status as string === 'uploading' && (
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
                  
                  <button onClick={handleGenerateInsights} disabled={isGeneratingInsights} className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50">
                    {isGeneratingInsights ? <Activity size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                    {isGeneratingInsights ? 'Analyzing...' : 'AI Insights'}
                  </button>
                </div>
              </div>

              {/* ── GLOBAL TABS ── */}
              <div className={`flex gap-2 border-b mt-6 mb-6 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button onClick={() => setActiveTab('eda')} className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab === 'eda' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                  EDA & Preprocessing
                </button>
                <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab !== 'eda' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                  Model Results
                </button>
              </div>

              {/* ── TABS CONTAINER ── */}
              <div className="relative w-full">

              {/* ── EDA TAB CONTENT ── */}
              <div className={activeTab === 'eda' ? 'relative z-10 opacity-100 ' : 'absolute top-0 left-0 w-full opacity-0 invisible pointer-events-none'}>
                {results.preprocessing && (() => {
                const edaFeatures = results.preprocessing?.eda?.features || [];
                const corrMatrix = results.preprocessing?.eda?.correlation_matrix || [];
                const corrFeatures: string[] = Array.from(new Set(corrMatrix.map((d: any) => d.x)));
                const numFeatures = edaFeatures.filter((f: any) => f.mean !== undefined);
                const totalOutliers = numFeatures.reduce((s: number, f: any) => s + (f.outlier_count || 0), 0);
                const totalMissing = edaFeatures.reduce((s: number, f: any) => s + (f.missing || 0), 0);
                // const pcaVariance = 
                const pcaData = (() => {
                  const ev = results.unsupervised_results?.pca?.explained_variance_ratio;
                  if (!ev) return [];
                  let cumulative = 0;
                  return ev.map((v: number, i: number) => {
                    cumulative += v * 100;
                    return { name: `PC${i+1}`, individual: parseFloat((v*100).toFixed(1)), cumulative: Math.min(100, parseFloat(cumulative.toFixed(1))) };
                  });
                })();
                
                const skewnessLabel = (s: number) => {
                  if (Math.abs(s) < 0.5) return { label: 'Symmetric', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
                  if (s > 0.5) return { label: 'Right Skewed', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
                  return { label: 'Left Skewed', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
                };

                                  return (
<div className="space-y-6 mb-6">

                    {/* AI Insights Card for EDA */}
                    {(insights?.eda || (activeTab === 'eda' && (insightError || isGeneratingInsights))) && (
                      <div className={`p-6 rounded-2xl border relative overflow-hidden ${isDarkMode ? 'bg-purple-900/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-600"></div>
                        <h3 className="text-lg font-black flex items-center gap-2 mb-4 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                          <Sparkles size={20} className="text-purple-400" /> AI EDA Insights
                        </h3>
                        
                        {isGeneratingInsights && (
                          <div className="flex items-center gap-3 text-purple-400 animate-pulse font-medium">
                            <Cpu size={20} className="animate-bounce" /> Groq Llama-3 is analyzing your dataset properties...
                          </div>
                        )}
                        
                        {insightError && (
                          <div className="text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-sm">
                            {insightError}
                          </div>
                        )}

                        {insights?.eda && (
                          <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-purple-300' : 'prose-p:text-gray-700 prose-strong:text-purple-700'}`}>
                            <ReactMarkdown remarkPlugins={memoizedRemarkPlugins}>{insights.eda}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data Doctor Report */}
                    {results.audit && results.audit.issues && (
                      <div className={`p-6 rounded-2xl border relative overflow-hidden ${results.audit.issues.length > 0 ? (isDarkMode ? 'bg-red-900/10 border-red-500/30' : 'bg-red-50 border-red-200') : (isDarkMode ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200')}`}>
                        <div className={`absolute top-0 left-0 w-full h-1 ${results.audit.issues.length > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}></div>
                        <h3 className={`text-lg font-black flex items-center gap-2 mb-4 ${results.audit.issues.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          <Activity size={20} /> Data Doctor Audit
                        </h3>
                        
                        {results.audit.explanation && (
                          <div className={`prose prose-sm max-w-none mb-4 ${isDarkMode ? 'prose-invert' : ''}`}>
                            <ReactMarkdown remarkPlugins={memoizedRemarkPlugins}>{results.audit.explanation}</ReactMarkdown>
                          </div>
                        )}
                        
                        {results.audit.issues.length > 0 && (
                          <div className="flex flex-col gap-2 mt-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Detected Flags</p>
                            {results.audit.issues.map((issue: any, idx: number) => (
                              <div key={idx} className={`p-3 rounded-lg text-sm border flex items-start gap-3 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="p-1.5 rounded-md bg-red-500/10 text-red-500 shrink-0 mt-0.5">
                                  <AlertTriangle size={14} />
                                </div>
                                <div>
                                  <span className="font-bold block mb-0.5">{issue.type.replace(/_/g, ' ').toUpperCase()} on '{issue.column}'</span>
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{issue.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}


                    {/* ── Row 1: 4 quick stat cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Rows', value: results.preprocessing?.eda?.num_rows || results.preprocessing?.original_shape?.[0], sub: 'observations', icon: '📊', color: 'from-indigo-500 to-indigo-600' },
                        { label: 'Features', value: results.preprocessing?.eda?.num_cols || results.preprocessing?.original_shape?.[1], sub: 'columns', icon: '🧩', color: 'from-purple-500 to-purple-600' },
                        { label: 'Missing Values', value: totalMissing, sub: totalMissing === 0 ? 'clean dataset ✓' : 'need imputation', icon: '❓', color: totalMissing === 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600' },
                        { label: 'IQR Outliers', value: totalOutliers, sub: 'across all features', icon: '⚠️', color: totalOutliers === 0 ? 'from-emerald-500 to-emerald-600' : 'from-yellow-500 to-orange-500' },
                      ].map(card => (
                        <div key={card.label} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{card.icon}</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r ${card.color} text-white`}>{card.label}</span>
                          </div>
                          <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{card.value?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── Row 2: Correlation Heatmap + Preprocessing Pipeline ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Correlation Heatmap */}
                      <div className={`xl:col-span-2 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h3 className={`text-base font-bold mb-1 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Grid size={18} className="text-cyan-400" /> Feature Correlation Heatmap
                        </h3>
                        <p className="text-xs text-gray-500 mb-5">Green = positive, Red = negative. Strong correlations (±0.7+) signal multicollinearity.</p>
                        {corrFeatures.length > 0 ? (
                          <div className="overflow-x-auto pb-2">
                            <div style={{ display: 'grid', gridTemplateColumns: `110px repeat(${corrFeatures.length}, 1fr)` }} className="gap-1.5 text-xs min-w-[300px]">
                              <div></div>
                              {corrFeatures.map((f: any) => (
                                <div key={`h-${f}`} className="text-center font-semibold text-gray-400 truncate px-1" title={f}>{f.length > 10 ? f.slice(0,9)+'..' : f}</div>
                              ))}
                              {corrFeatures.map((y: any) => (
                                <React.Fragment key={`row-${y}`}>
                                  <div className="flex items-center justify-end pr-2 font-semibold text-gray-400 truncate text-right" title={y}>{y.length > 14 ? y.slice(0,12)+'..' : y}</div>
                                  {corrFeatures.map((x: any) => {
                                    const cell = corrMatrix.find((m: any) => m.x === x && m.y === y);
                                    const val = cell ? cell.value : 0;
                                    const abs = Math.abs(val);
                                    const bg = val >= 0 ? `rgba(16,185,129,${Math.max(0.08, abs)})` : `rgba(239,68,68,${Math.max(0.08, abs)})`;
                                    return (
                                      <div key={`${x}-${y}`} className={`h-11 rounded-lg flex items-center justify-center font-bold transition-transform hover:scale-105 cursor-default shadow-sm text-sm ${abs > 0.4 ? 'text-white' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}
                                        style={{ backgroundColor: bg }} title={`${x} ↔ ${y}: ${val}`}>
                                        {val.toFixed(2)}
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ) : <div className="h-32 flex items-center justify-center text-gray-500 text-sm">Not enough numerical features.</div>}
                      </div>

                      {/* Preprocessing Pipeline */}
                      <div className={`xl:col-span-1 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Cpu size={18} className="text-pink-400" /> Preprocessing Pipeline
                        </h3>
                        <div className="flex flex-col gap-3">
                          {results.preprocessing?.logs?.map((log: string, i: number) => (
                            <div key={i} className={`p-3 rounded-lg text-sm border-l-4 border-pink-500 flex items-start gap-3 ${isDarkMode ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                              <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{log}</span>
                            </div>
                          )) || <p className="text-sm text-gray-500">No logs available.</p>}
                        </div>
                        {results.preprocessing?.eda?.num_duplicates !== undefined && (
                          <div className={`mt-4 p-3 rounded-lg text-sm border-l-4 ${results.preprocessing.eda.num_duplicates > 0 ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300' : 'border-emerald-500 bg-emerald-500/10 text-emerald-300'} flex items-center gap-3`}>
                            <CheckCircle size={15} className="shrink-0" />
                            {results.preprocessing.eda.num_duplicates === 0 ? 'No duplicate rows found.' : `${results.preprocessing.eda.num_duplicates} duplicate rows detected.`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Row 3: Per-feature distribution cards ── */}
                    <div>
                      <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <BarChart2 size={18} className="text-blue-400" /> Feature Distributions
                        <span className="text-xs font-normal text-gray-500 ml-2">Skewness, IQR outliers, and histogram for each feature</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {edaFeatures.map((f: any, i: number) => {
                          const isNum = f.mean !== undefined;
                          const sk = isNum ? skewnessLabel(f.skewness || 0) : null;
                          const maxBin = isNum ? Math.max(...(f.histogram || []).map((h: any) => h.count), 1) : 1;
                          return (
                            <div key={i} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={f.name}>{f.name}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded font-mono ${f.type.includes('float') || f.type.includes('int') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>{f.type}</span>
                              </div>

                              {isNum ? (
                                <>
                                  {/* Mini bar histogram */}
                                  <div className="flex items-end gap-0.5 h-16 mb-3">
                                    {(f.histogram || []).map((h: any, bi: number) => (
                                      <div key={bi} className="flex-1 h-full flex flex-col items-center justify-end" title={`${h.bin}: ${h.count}`}>
                                        <div className="w-full rounded-sm bg-indigo-500/70 hover:bg-indigo-400 transition-all"
                                          style={{ height: `${(h.count / maxBin) * 100}%`, minHeight: h.count > 0 ? '2px' : '0' }}></div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex justify-between text-[10px] text-gray-600 mb-3">
                                    <span>{f.min?.toFixed(1)}</span>
                                    <span className="text-gray-500">distribution</span>
                                    <span>{f.max?.toFixed(1)}</span>
                                  </div>

                                  {/* Stats grid */}
                                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                    {[
                                      { label: 'Mean', val: f.mean?.toFixed(2) },
                                      { label: 'Median', val: f.median?.toFixed(2) },
                                      { label: 'Std', val: f.std?.toFixed(2) },
                                      { label: 'Q1', val: f.q1?.toFixed(2) },
                                      { label: 'Q3', val: f.q3?.toFixed(2) },
                                      { label: 'Kurt', val: f.kurtosis?.toFixed(2) },
                                    ].map(stat => (
                                      <div key={stat.label} className={`p-1.5 rounded-lg text-center ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
                                        <p className="text-gray-500 text-[10px] mb-0.5">{stat.label}</p>
                                        <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{stat.val}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Skewness + Outliers badges */}
                                  <div className="flex gap-2 flex-wrap">
                                    {sk && <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${sk.bg} ${sk.color}`}>⊕ {sk.label} ({f.skewness})</span>}
                                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${f.outlier_count > 0 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                      {f.outlier_count > 0 ? `⚠ ${f.outlier_count} outliers` : '✓ No outliers'}
                                    </span>
                                    {f.missing > 0 && <span className="text-xs px-2 py-1 rounded-full border bg-red-500/10 border-red-500/20 text-red-400 font-semibold">❓ {f.missing} missing</span>}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className={`mb-3 p-2 rounded-lg text-center ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
                                    <p className="text-gray-500 text-xs">Unique values</p>
                                    <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{f.unique}</p>
                                  </div>
                                  {(f.value_counts || []).slice(0, 5).map((vc: any, vi: number) => {
                                    const maxVc = f.value_counts[0]?.count || 1;
                                    return (
                                      <div key={vi} className="mb-1.5">
                                        <div className="flex justify-between text-[11px] mb-0.5">
                                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{vc.label}</span>
                                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{vc.count}</span>
                                        </div>
                                        <div className={`h-1.5 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                          <div className="h-full rounded-full bg-orange-400" style={{ width: `${(vc.count / maxVc) * 100}%` }}></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Row 4: PCA Variance Chart (if available) ── */}
                    {pcaData.length > 0 && (
                      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h3 className={`text-base font-bold mb-1 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <TrendingUp size={18} className="text-purple-400" /> PCA — Explained Variance
                        </h3>
                        <p className="text-xs text-gray-500 mb-5">How much information each Principal Component captures. Cumulative line shows elbow point.</p>
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={pcaData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} vertical={false} />
                              <XAxis dataKey="name" stroke="#6b7280" />
                              <YAxis yAxisId="left" stroke="#6b7280" tickFormatter={v => `${v}%`} domain={[0, 100]} />
                              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tickFormatter={v => `${v}%`} domain={[0, 100]} />
                              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} formatter={(v: any) => [`${v}%`]} />
                              <Legend />
                              <Bar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" yAxisId="left" dataKey="individual" name="Individual %" fill="#8b5cf6" radius={[4,4,0,0]} />
                              <Line isAnimationActive={true} animationDuration={400} animationEasing="ease-out" yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}
              </div>
              
              {/* ── MODEL RESULTS TAB CONTENT ── */}
              <div className={activeTab !== 'eda' ? 'relative z-10 opacity-100 ' : 'absolute top-0 left-0 w-full opacity-0 invisible pointer-events-none'}>

              {/* AI Insights Card */}
              {((insights?.overall || insights) || insightError || isGeneratingInsights) && (
                <div className={`mb-6 p-6 rounded-2xl border relative overflow-hidden ${isDarkMode ? 'bg-purple-900/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-600"></div>
                  <h3 className="text-lg font-black flex items-center gap-2 mb-4 bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                    <Sparkles size={20} className="text-purple-400" /> AI Data Scientist Insights
                  </h3>
                  
                  {isGeneratingInsights && (
                    <div className="flex items-center gap-3 text-purple-400 animate-pulse font-medium">
                      <Cpu size={20} className="animate-bounce" /> Groq Llama-3 is analyzing your pipeline results...
                    </div>
                  )}
                  
                  {insightError && (
                    <div className="text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-sm">
                      {insightError}
                    </div>
                  )}

                  {insights && (
                    <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-purple-300' : 'prose-p:text-gray-700 prose-strong:text-purple-700'}`}>
                      <ReactMarkdown remarkPlugins={memoizedRemarkPlugins}>{insights.overall || (typeof insights === 'string' ? insights : '')}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              


              {/* ── SUPERVISED ── */}
              {results.task_type === 'SUPERVISED' && results.supervised_results && (() => {
                const rowCount = results.preprocessing?.original_shape?.[0] || 0;
                const colCount = results.preprocessing?.original_shape?.[1] || 0;

                const handleExportCode = () => {
                  if (!results || results.task_type !== 'SUPERVISED') return;
                  
                  const target = Object.keys(results.preprocessing?.eda?.features || {}).length > 0 ? "TARGET_COLUMN" : "target";
                  const bestModelStr = bestModel || 'random_forest';
                  
                  const pyCode = `# Auto-generated by ML Studio
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier

# 1. Load Data
df = pd.read_csv('your_dataset.csv')
X = df.drop(columns=['${target}'])
y = df['${target}']

# 2. Identify Column Types
num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

# 3. Build Preprocessor
num_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])
cat_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])
preprocessor = ColumnTransformer([
    ('num', num_pipeline, num_cols),
    ('cat', cat_pipeline, cat_cols)
], remainder='drop')

# 4. Build Model Pipeline
# Note: In ML Studio, we dynamically tune models using GridSearchCV.
# Here we export the base pipeline structure for ${bestModelStr.replace('_', ' ')}.
model = RandomForestClassifier(n_estimators=50, random_state=42)

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', model)
])

# 5. Train & Evaluate
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
pipeline.fit(X_train, y_train)

accuracy = pipeline.score(X_test, y_test)
print(f"Test Accuracy: {accuracy:.4f}")
`;
                  
                  const blob = new Blob([pyCode], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ml_studio_pipeline.py';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                };

                return (
                  <>
                    {/* Stat Cards */}
                    <div className="flex justify-between items-end mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Target className="text-emerald-500" /> Pipeline Results</h2>
                      <button onClick={handleExportCode} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer z-50 relative">
                        <Download size={16} /> Export to Python
                      </button>
                    </div>
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
                              <ComposedChart data={getAccuracies()} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
                                <YAxis stroke="#6b7280" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} formatter={(v: any) => [`${v}%`]} />
                                <Legend />
                                <Bar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" dataKey="Accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" dataKey="F1" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </ComposedChart>
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
                                <Line isAnimationActive={true} animationDuration={400} animationEasing="ease-out" type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={3} dot={false} name="ROC Curve" />
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
                                  <Radar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" name="Accuracy" dataKey="Accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                                  <Radar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" name="F1" dataKey="F1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                  <Radar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" name="AUC" dataKey="AUC" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
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

                        {/* Model Detailed Insights */}
                        {cmModel && evals[cmModel] && (
                          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                            <div className="flex items-center justify-between mb-5">
                              <div>
                                <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={20} className="text-blue-400" /> {cmModel.replace(/_/g, ' ')} — Deep Dive</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Explore model parameters, feature importances, and validation scores.</p>
                              </div>
                              <select value={cmModel} onChange={e => setCmModel(e.target.value)} className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none font-semibold ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-300'}`}>
                                {modelNames.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                              </select>
                            </div>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                              
                              {/* Left Column: Confusion Matrix & CV Scores */}
                              <div className="space-y-6">
                                {/* CV Scores / Bias-Variance */}
                                {evals[cmModel]?.cv_scores && (
                                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Target size={16} className="text-pink-400" /> Cross-Validation (Bias-Variance)</h4>
                                    <div className="flex gap-4">
                                      <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-[10px] uppercase text-emerald-500 font-bold mb-1">Mean Test Score</p>
                                        <p className="text-xl font-black text-emerald-400">{(evals[cmModel].cv_scores.mean_test_score * 100).toFixed(1)}%</p>
                                      </div>
                                      <div className="flex-1 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                        <p className="text-[10px] uppercase text-orange-500 font-bold mb-1">Score Std Dev (Variance)</p>
                                        <p className="text-xl font-black text-orange-400">±{(evals[cmModel].cv_scores.std_test_score * 100).toFixed(2)}%</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Best Params */}
                                {evals[cmModel]?.best_params && Object.keys(evals[cmModel].best_params).length > 0 && (
                                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Settings size={16} className="text-cyan-400" /> Best Hyperparameters</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(evals[cmModel].best_params).map(([k, v]) => (
                                        <div key={k} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                                          <span className="text-xs text-blue-300 font-mono">{k}:</span>
                                          <span className="text-sm text-blue-100 font-bold">{String(v)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Confusion Matrix */}
                                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><FlaskConical size={16} className="text-purple-400" /> Confusion Matrix Heatmap</h4>
                                  <div className="flex justify-center">
                                    <ConfusionMatrix matrix={evals[cmModel]?.confusion_matrix || []} isDarkMode={isDarkMode} />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right Column: Feature Importances & Classification Report */}
                              <div className="space-y-6">
                                {/* Feature Importances */}
                                {evals[cmModel]?.feature_importance ? (
                                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'} h-[300px] flex flex-col`}>
                                    <h4 className="text-sm font-bold mb-1 flex items-center gap-2"><BarChart2 size={16} className="text-yellow-400" /> Feature Importances</h4>
                                    <p className="text-[10px] text-gray-500 mb-3">Which features drove the model's decisions</p>
                                    <div className="flex-1 overflow-y-auto pr-2">
                                      <ResponsiveContainer width="100%" height={Math.max(200, evals[cmModel].feature_importance.length * 35)}>
                                        <ComposedChart data={evals[cmModel].feature_importance} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} horizontal={false} />
                                          <XAxis type="number" stroke="#6b7280" />
                                          <YAxis type="category" dataKey="feature" stroke="#6b7280" tick={{fontSize: 10}} width={100} />
                                          <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '8px' }} formatter={(v: any) => v.toFixed(4)} />
                                          <Bar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" dataKey="importance" fill="#facc15" radius={[0, 4, 4, 0]} />
                                        </ComposedChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'} h-24 flex items-center justify-center text-sm text-gray-500`}>
                                    Feature importances not available for this model type.
                                  </div>
                                )}
                                
                                {/* Precision & Recall */}
                                {evals[cmModel]?.classification_report && (
                                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Network size={16} className="text-indigo-400" /> Precision & Recall per Class</h4>
                                    <div className="space-y-3">
                                      {Object.entries(evals[cmModel].classification_report).filter(([k]) => k !== 'accuracy' && k !== 'macro avg' && k !== 'weighted avg').map(([cls, metrics]: any) => (
                                        <div key={cls}>
                                          <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-gray-400">Class: {cls}</span>
                                            <span className="text-gray-500">Support: {metrics.support}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px]">
                                            <span className="w-12 text-right">Precision</span>
                                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                              <div className="h-full bg-indigo-500" style={{ width: `${metrics.precision * 100}%` }}></div>
                                            </div>
                                            <span className="w-8">{(metrics.precision * 100).toFixed(0)}%</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] mt-1">
                                            <span className="w-12 text-right">Recall</span>
                                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                              <div className="h-full bg-pink-500" style={{ width: `${metrics.recall * 100}%` }}></div>
                                            </div>
                                            <span className="w-8">{(metrics.recall * 100).toFixed(0)}%</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                              </div>
                            </div>
                          </div>
                        )}

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
                                      <Line isAnimationActive={true} animationDuration={400} animationEasing="ease-out" type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} name="Train Loss" />
                                      <Line isAnimationActive={true} animationDuration={400} animationEasing="ease-out" type="monotone" dataKey="val_loss" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Val Loss" />
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
                                      <Line isAnimationActive={true} animationDuration={400} animationEasing="ease-out" type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={false} name="Train Acc" />
                                      <Line isAnimationActive={true} animationDuration={400} animationEasing="ease-out" type="monotone" dataKey="val_accuracy" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Val Acc" />
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

                    {/* ── Inference Tab ── */}
                    {activeTab === 'inference' && results.supervised_results && (
                      <div className={`p-6 rounded-2xl border ${card}`}>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold flex items-center gap-2"><Target size={22} className="text-pink-400" /> Interactive Inference Engine</h3>
                            <p className="text-sm text-gray-500 mt-1">Test your models on new, custom data points instantly.</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Select Model:</span>
                            <select 
                              value={selectedInferenceModel} 
                              onChange={e => setSelectedInferenceModel(e.target.value)} 
                              className={`text-sm rounded-lg px-4 py-2 border focus:outline-none font-bold ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-300'}`}
                            >
                              {modelNames.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Left: Input Form */}
                          <div className={`lg:col-span-2 p-5 rounded-xl border ${isDarkMode ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-50/50 border-gray-200'}`}>
                            <h4 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Input Features</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {results.preprocessing?.eda?.features?.map((f: any) => (
                                <div key={f.name} className="flex flex-col gap-1">
                                  <label className="text-xs font-semibold text-gray-500 flex justify-between">
                                    {f.name}
                                    <span className="text-[10px] opacity-70">
                                      {f.type.includes('float') || f.type.includes('int') ? `Range: [${f.min?.toFixed(1)}, ${f.max?.toFixed(1)}]` : 'Categorical'}
                                    </span>
                                  </label>
                                  {(f.type.includes('float') || f.type.includes('int')) ? (
                                    <input 
                                      type="number"
                                      step="any"
                                      value={inferenceForm[f.name] !== undefined ? inferenceForm[f.name] : ''}
                                      onChange={(e) => setInferenceForm(prev => ({...prev, [f.name]: parseFloat(e.target.value)}))}
                                      className={`text-sm px-3 py-2 rounded-lg border focus:border-indigo-500 outline-none transition-all ${isDarkMode ? 'bg-[#12121a] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    />
                                  ) : (
                                    <select
                                      value={inferenceForm[f.name] || ''}
                                      onChange={(e) => setInferenceForm(prev => ({...prev, [f.name]: e.target.value}))}
                                      className={`text-sm px-3 py-2 rounded-lg border focus:border-indigo-500 outline-none transition-all ${isDarkMode ? 'bg-[#12121a] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                      <option value="">Select...</option>
                                      {f.value_counts?.map((vc: any) => (
                                        <option key={vc.label} value={vc.label}>{vc.label}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={handleInferenceSubmit}
                              disabled={inferenceLoading}
                              className={`mt-6 w-full py-3 rounded-lg font-bold text-white flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg ${inferenceLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400'}`}
                            >
                              {inferenceLoading ? <span className="animate-spin text-xl">⚙</span> : <Zap size={18} />}
                              {inferenceLoading ? 'Processing...' : 'Run Prediction'}
                            </button>
                          </div>

                          {/* Right: Output */}
                          <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-inner min-h-[300px]`}>
                            {inferenceResult ? (
                              <div className="w-full flex flex-col items-center animate-fade-in">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                  <CheckCircle size={40} />
                                </div>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Predicted Class</p>
                                <p className={`text-4xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{inferenceResult.prediction}</p>
                                
                                {inferenceResult.probabilities && (
                                  <div className="w-full">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 text-left">Probabilities</p>
                                    <div className="space-y-3">
                                      {inferenceResult.probabilities.map((prob: number, idx: number) => {
                                        const isMax = prob === Math.max(...inferenceResult.probabilities);
                                        return (
                                          <div key={idx} className="flex flex-col gap-1 text-left">
                                            <div className="flex justify-between text-xs font-bold">
                                              <span className={isMax ? (isDarkMode ? 'text-gray-200' : 'text-gray-800') : 'text-gray-500'}>Class {idx}</span>
                                              <span className={isMax ? 'text-indigo-400' : 'text-gray-500'}>{(prob * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className={`h-2 rounded-full w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden`}>
                                              <div className={`h-full rounded-full transition-all duration-1000 ${isMax ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-gray-500'}`} style={{ width: `${prob * 100}%` }}></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-gray-500">
                                <FlaskConical size={48} className="opacity-20 mb-4" />
                                <p className="font-semibold text-gray-400">Awaiting Input</p>
                                <p className="text-xs text-gray-500 max-w-[200px] mt-2">Fill the form and hit Run Prediction to test the model.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </>
                );
              })()}

              {/* ── UNSUPERVISED ── */}
              {results.task_type === 'UNSUPERVISED' && results.unsupervised_results && (() => {
                const pca = results.unsupervised_results.pca;
                const kmeans = results.unsupervised_results.kmeans;
                const hier = results.unsupervised_results.hierarchical;

                // Color mapping for clusters
                const clusterColors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

                // 1. Process PCA data with Cluster Labels
                const scatterData = (pca?.projections || []).map((p: any, i: number) => ({
                  ...p,
                  cluster: kmeans?.best_labels?.[i] !== undefined ? `Cluster ${kmeans.best_labels[i]}` : 'Unassigned',
                  clusterId: kmeans?.best_labels?.[i] || 0
                })).slice(0, 400); // capped at 400 for smooth SVG animation

                // Group scatter data by cluster for Recharts
                const groupedScatter = scatterData.reduce((acc: any, point: any) => {
                  if (!acc[point.clusterId]) acc[point.clusterId] = [];
                  acc[point.clusterId].push(point);
                  return acc;
                }, {});

                // 2. Cluster Distribution
                const distribution = Object.keys(groupedScatter).map(key => ({
                  cluster: `Cluster ${key}`,
                  count: groupedScatter[key].length,
                  fill: clusterColors[Number(key) % clusterColors.length]
                })).sort((a, b) => b.count - a.count);

                // 3. Hierarchical Merge Distances (take top 30)
                const hDistances = (hier?.linkage_matrix || []).slice(-30).map((row: any, i: number) => ({
                  step: `Merge ${i + 1}`,
                  distance: row.distance
                }));

                const maxSil = Math.max(...(kmeans?.elbow_silhouette_curve || []).map((m: any) => m.silhouette));
                const totalVariance = pca?.explained_variance_ratio ? (pca.explained_variance_ratio[0] + pca.explained_variance_ratio[1]) * 100 : 0;

                return (
                  <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard isDarkMode={isDarkMode} icon={<GitBranch size={20} className="text-purple-400" />} label="Optimal Clusters (k)" value={kmeans?.best_k ?? '—'} sub="via Silhouette Score" color="bg-purple-500" />
                      <StatCard isDarkMode={isDarkMode} icon={<Award size={20} className="text-yellow-400" />} label="Peak Silhouette" value={maxSil > -1 ? maxSil.toFixed(3) : '—'} sub="Cluster separation quality" color="bg-yellow-500" />
                      <StatCard isDarkMode={isDarkMode} icon={<Layers size={20} className="text-indigo-400" />} label="PCA Variance (2D)" value={totalVariance > 0 ? `${totalVariance.toFixed(1)}%` : '—'} sub="Data retained in 2D plot" color="bg-indigo-500" />
                      <StatCard isDarkMode={isDarkMode} icon={<Network size={20} className="text-cyan-400" />} label="Hierarchical Merges" value={hier?.linkage_matrix?.length?.toLocaleString() ?? '—'} sub="Agglomerative steps" color="bg-cyan-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Cluster Assignments Scatter (Takes up 2 columns) */}
                      <div className={`p-6 rounded-2xl border lg:col-span-2 ${card}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-bold flex items-center gap-2"><Target size={18} className="text-emerald-400" /> Segmented Clusters (PCA Projection)</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-5">Data points colored automatically by K-Means cluster assignment</p>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} />
                              <XAxis dataKey="x" type="number" stroke="#6b7280" name="Principal Component 1" tickFormatter={(v) => v.toFixed(1)} />
                              <YAxis dataKey="y" type="number" stroke="#6b7280" name="Principal Component 2" tickFormatter={(v) => v.toFixed(1)} />
                              <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }} 
                                contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }}
                                formatter={(val: any, name) => [val.toFixed(2), name === 'clusterId' ? 'Cluster' : name]}
                              />
                              <Legend iconType="circle" />
                              {Object.keys(groupedScatter).map((clusterId) => (
                                <Scatter isAnimationActive={true} animationDuration={400} animationEasing="ease-out" 
                                  key={clusterId}
                                  name={`Cluster ${clusterId}`}
                                  data={groupedScatter[clusterId]} 
                                  fill={clusterColors[Number(clusterId) % clusterColors.length]} 
                                  opacity={0.8}
                                />
                              ))}
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                        <AiInsightBlock sectionKey="the PCA projection" text={insights?.pca} isDarkMode={isDarkMode} />
                      </div>

                      {/* Cluster Sizes (Bar Chart) */}
                      <div className={`p-6 rounded-2xl border ${card}`}>
                        <h3 className="text-base font-bold mb-1 flex items-center gap-2"><Database size={18} className="text-purple-400" /> Cluster Distribution</h3>
                        <p className="text-xs text-gray-500 mb-5">Number of data points per segment</p>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={distribution} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} horizontal={false} />
                              <XAxis type="number" stroke="#6b7280" />
                              <YAxis dataKey="cluster" type="category" stroke="#6b7280" width={60} tick={{fontSize: 11}} />
                              <Tooltip cursor={{fill: isDarkMode ? '#1f2937' : '#f3f4f6'}} contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                              <Bar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" dataKey="count" radius={[0, 4, 4, 0]}>
                                {distribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        <AiInsightBlock sectionKey="the cluster distribution" text={insights?.distribution} isDarkMode={isDarkMode} />
                      </div>

                      {/* K-Means Elbow/Silhouette */}
                      <div className={`p-6 rounded-2xl border ${card}`}>
                        <h3 className="text-base font-bold mb-1 flex items-center gap-2"><TrendingUp size={18} className="text-yellow-400" /> K-Means Silhouette Scores</h3>
                        <p className="text-xs text-gray-500 mb-4">Peak value dictates the optimal K (clusters)</p>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={kmeans?.elbow_silhouette_curve || []} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} />
                              <XAxis dataKey="k" stroke="#6b7280" />
                              <YAxis stroke="#6b7280" domain={['auto', 'auto']} />
                              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                              <Line isAnimationActive={true} animationDuration={400} animationEasing="ease-out" type="monotone" dataKey="silhouette" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} name="Score" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <AiInsightBlock sectionKey="the silhouette score" text={insights?.silhouette} isDarkMode={isDarkMode} />
                      </div>

                      {/* Hierarchical Clustering Merge Distances */}
                      <div className={`p-6 rounded-2xl border lg:col-span-2 ${card}`}>
                        <h3 className="text-base font-bold mb-1 flex items-center gap-2"><GitBranch size={18} className="text-cyan-400" /> Hierarchical Merge Distances</h3>
                        <p className="text-xs text-gray-500 mb-4">Distance metric jumps indicate significant cluster merges (last 30 steps of dendrogram)</p>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={hDistances} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} vertical={false} />
                              <XAxis dataKey="step" stroke="#6b7280" tick={{fontSize: 10}} angle={-45} textAnchor="end" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', borderColor: '#374151', borderRadius: '10px' }} />
                              <Bar isAnimationActive={true} animationDuration={400} animationEasing="ease-out" dataKey="distance" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Merge Distance" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        <AiInsightBlock sectionKey="the cluster distribution" text={insights?.distribution} isDarkMode={isDarkMode} />
                      </div>

                    </div>
                  </div>
                );
              })()}
              </div>
              </div>
            </div>
          )}

        </div>
      </main>

<CopilotChat jobId={jobId} status={status} file={file} targetColumn={targetColumn} enableDL={enableDL} isDarkMode={isDarkMode} setJobId={setJobId} setStatus={setStatus} setActiveTab={setActiveTab} />

    </div>
  );
}

export default App;
