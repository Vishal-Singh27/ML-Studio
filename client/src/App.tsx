import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Activity, 
  Settings, 
  Database, 
  Play, 
  CheckCircle, 
  Sun, 
  Moon, 
  Cpu, 
  FileSpreadsheet, 
  X 
} from 'lucide-react';
import axios from 'axios';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ScatterChart, Scatter, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [enableDL, setEnableDL] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'queued' | 'success' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [results, setResults] = useState<any>(null); // Store ML results
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Polling logic when job is queued
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (status === 'queued' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`http://localhost:5001/api/jobs/${jobId}`);
          
          if (res.data.status === 'completed' || res.data.status === 'success') {
            setResults(res.data.data);
            
            // Set initial selected model for Supervised tasks
            if (res.data.data.task_type === 'SUPERVISED' && res.data.data.supervised_results) {
               const models = Object.keys(res.data.data.supervised_results.evaluations || {});
               if (models.length > 0) setSelectedModel(models[0]);
            }
            
            setStatus('success');
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setStatus('error');
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, jobId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setStatus('uploading');
    const formData = new FormData();
    formData.append('dataset', file);
    formData.append('target', targetColumn);
    formData.append('enable_dl', enableDL.toString());

    try {
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setJobId(response.data.jobId);
      setStatus('queued');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  // Helper function to extract supervised accuracies
  const getAccuracies = () => {
    if (!results?.supervised_results?.evaluations) return [];
    return Object.entries(results.supervised_results.evaluations).map(([name, ev]: [string, any]) => ({
      name,
      Accuracy: Math.round(ev.accuracy * 100) / 100
    }));
  };

  // Helper function to extract ROC curve
  const getRocCurve = () => {
    if (!results?.supervised_results?.evaluations || !selectedModel) return [];
    const ev = results.supervised_results.evaluations[selectedModel];
    if (!ev || !ev.roc_curve) return [];
    return ev.roc_curve.map((p: any) => ({
      fpr: Math.round(p.fpr * 100) / 100,
      tpr: Math.round(p.tpr * 100) / 100
    }));
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0a0f] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Sidebar */}
      <aside className={`w-72 flex flex-col border-r transition-colors duration-300 ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b flex items-center justify-between transition-colors duration-300 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="font-bold text-2xl flex items-center gap-3 text-indigo-500">
            <Activity className="animate-pulse" size={28} /> 
            <span className="tracking-tight">ML Studio</span>
          </div>
        </div>
        
        <div className="p-6">
          <p className={`text-xs font-semibold tracking-wider uppercase mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Workspace
          </p>
          <nav className="space-y-2">
            <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'bg-indigo-50 text-indigo-700 font-medium'}`}>
              <Database size={20} /> Datasets
            </button>
            <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isDarkMode ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Cpu size={20} /> Models
            </button>
            <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isDarkMode ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Settings size={20} /> Settings
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-colors border ${
              isDarkMode 
                ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300' 
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
            }`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Header */}
        <header className={`px-10 py-8 border-b transition-colors duration-300 ${isDarkMode ? 'border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-10' : 'border-gray-200 bg-gray-50/80 backdrop-blur-md sticky top-0 z-10'}`}>
          <h1 className="text-3xl font-bold tracking-tight">Data Pipeline Engine</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Upload a dataset to automatically run EDA, feature engineering, and train 10+ models.
          </p>
        </header>

        <div className="p-10 max-w-5xl mx-auto w-full space-y-8">
          
          {/* Only show upload zone if no active job/results */}
          {status === 'idle' && (
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center transition-all duration-300 mb-8 
                ${file 
                  ? isDarkMode ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-emerald-400 bg-emerald-50' 
                  : isDarkMode ? 'border-indigo-500/30 bg-[#12121a] hover:border-indigo-500/60 hover:bg-indigo-500/5' : 'border-indigo-300 bg-white hover:border-indigo-400'
                }`}
            >
              {/* Background decorative blob */}
              <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors ${file ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
              <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors ${file ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>

              <div className={`p-4 rounded-full mb-6 ${file ? 'bg-emerald-500/10' : 'bg-indigo-500/10'}`}>
                {file ? (
                  <FileSpreadsheet size={48} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                ) : (
                  <UploadCloud size={48} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} />
                )}
              </div>

              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {file ? 'Dataset Ready' : 'Drop your dataset here'}
              </h3>
              
              <p className={`text-sm mb-8 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {file 
                  ? <span className="flex items-center justify-center gap-2 font-mono bg-black/20 px-3 py-1 rounded-md">{file.name}</span>
                  : 'Supported formats: CSV. The file will be processed locally and never stored permanently.'
                }
              </p>
              
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`relative z-10 px-8 py-3 font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5 ${
                  file 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/25' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                }`}
              >
                {file ? 'Replace File' : 'Browse Files'}
              </button>
            </div>
          )}

          {/* Configuration Card */}
          {file && (status === 'idle' || status === 'uploading') && (
            <div className={`p-8 rounded-2xl border shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 ${
              isDarkMode ? 'bg-[#12121a] border-gray-800 shadow-black/50' : 'bg-white border-gray-200 shadow-gray-200/50'
            }`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pipeline Configuration</h3>
                <button onClick={() => setFile(null)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Target Column
                  </label>
                  <input 
                    type="text" 
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    placeholder="e.g. 'price' or 'species'"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                      isDarkMode 
                        ? 'bg-[#0a0a0f] border-gray-700 text-white placeholder-gray-600 focus:border-indigo-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-500'
                    }`}
                  />
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Leave blank to run unsupervised algorithms only.
                  </p>
                </div>
                
                <div className={`flex items-start gap-4 p-4 rounded-xl border ${isDarkMode ? 'bg-[#0a0a0f] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center h-5 mt-1">
                    <input 
                      id="enable-dl" 
                      type="checkbox" 
                      checked={enableDL}
                      onChange={(e) => setEnableDL(e.target.checked)}
                      className="w-5 h-5 text-indigo-500 bg-gray-900 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="enable-dl" className={`font-semibold cursor-pointer ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Deep Learning Module
                    </label>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Automatically builds and trains a Keras Sequential model based on data shape.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                <button 
                  onClick={handleUpload}
                  disabled={status === 'uploading'}
                  className="group flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'uploading' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Uploading...
                    </span>
                  ) : (
                    <>
                      Run Full Pipeline
                      <Play size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Queued State */}
          {status === 'queued' && (
            <div className={`p-10 rounded-2xl border text-center animate-in zoom-in-95 ${
              isDarkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-indigo-500/20 mb-6 animate-pulse">
                <Cpu size={48} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} />
              </div>
              <h3 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-indigo-50' : 'text-indigo-900'}`}>
                Training Models...
              </h3>
              <p className={`text-lg mb-8 max-w-xl mx-auto ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-700'}`}>
                Your dataset is being processed by the FastAPI backend. You will see the results automatically when finished.
              </p>
            </div>
          )}

          {/* Success State - Phase 5 Dashboard */}
          {status === 'success' && results && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8">
              <div className={`p-8 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-xl'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <CheckCircle className="text-emerald-500" size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Analysis Complete</h2>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Mode: <span className="font-mono text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded">{results.task_type}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setFile(null);
                      setTargetColumn('');
                      setStatus('idle');
                      setJobId(null);
                      setResults(null);
                    }}
                    className={`px-6 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                      isDarkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Start New Analysis
                  </button>
                </div>
              </div>

              {/* Supervised Learning Results */}
              {results.task_type === 'SUPERVISED' && results.supervised_results && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Accuracy Bar Chart */}
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6">Model Accuracies</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getAccuracies()} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke={isDarkMode ? '#9ca3af' : '#6b7280'} 
                            tick={{fontSize: 12}} 
                            angle={-45} 
                            textAnchor="end" 
                          />
                          <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} domain={[0, 1]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
                            itemStyle={{ color: '#818cf8' }}
                          />
                          <Bar dataKey="Accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* ROC Curve */}
                  <div className={`p-6 rounded-2xl border flex flex-col ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold">ROC Curves</h3>
                      <select 
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none ${
                          isDarkMode ? 'bg-[#0a0a0f] border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        {Object.keys(results.supervised_results.evaluations || {}).map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="h-72 w-full flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getRocCurve()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                          <XAxis 
                            dataKey="fpr" 
                            type="number" 
                            domain={[0, 1]} 
                            stroke={isDarkMode ? '#9ca3af' : '#6b7280'} 
                            label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }} 
                          />
                          <YAxis 
                            dataKey="tpr" 
                            type="number" 
                            domain={[0, 1]} 
                            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
                          />
                          <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="ROC Curve" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Unsupervised Learning Results */}
              {results.task_type === 'UNSUPERVISED' && results.unsupervised_results && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* PCA Scatter Plot */}
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6">PCA 2D Projection</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="x" type="number" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} name="PC 1" />
                          <YAxis dataKey="y" type="number" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} name="PC 2" />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }} 
                            contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
                          />
                          <Scatter name="Data Points" data={results.unsupervised_results.pca?.projections || []} fill="#8b5cf6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* K-Means Elbow Curve */}
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6">K-Means Silhouette Scores</h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.unsupervised_results.kmeans?.elbow_silhouette_curve || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="k" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} name="Clusters (k)" />
                          <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} name="Score" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="silhouette" name="Silhouette Score" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
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
