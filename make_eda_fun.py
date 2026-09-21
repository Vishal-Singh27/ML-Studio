import re

file_path = "client/src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Make sure Grid icon is imported
if "Grid" not in content[:1000]:
    content = content.replace("import { ", "import { Grid, ", 1)

old_eda_block = """{activeTab === 'eda' && results.preprocessing && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                  <div className={`xl:col-span-1 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>"""

# We'll replace the entire EDA tab content
start_idx = content.find("{/* ── EDA TAB CONTENT ── */}")
end_idx = content.find("{/* ── MODEL RESULTS TAB CONTENT ── */}")

if start_idx != -1 and end_idx != -1:
    new_eda_content = """{/* ── EDA TAB CONTENT ── */}
              {activeTab === 'eda' && results.preprocessing && (() => {
                const corrMatrix = results.preprocessing.eda?.correlation_matrix || [];
                const features = Array.from(new Set(corrMatrix.map((d: any) => d.x)));
                
                return (
                  <div className="space-y-6 mb-6">
                    {/* Top Row: Overview & Correlation */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className={`xl:col-span-1 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Database size={20} className="text-indigo-400" /> Dataset Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Total Rows</p>
                            <p className="text-2xl font-black text-indigo-400">{results.preprocessing?.eda?.num_rows || results.preprocessing?.original_shape?.[0]}</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Features</p>
                            <p className="text-2xl font-black text-purple-400">{results.preprocessing?.eda?.num_cols || results.preprocessing?.original_shape?.[1]}</p>
                          </div>
                        </div>
                        
                        <h3 className={`text-md font-bold mb-3 mt-6 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Cpu size={18} className="text-pink-400" /> Preprocessing Pipeline
                        </h3>
                        <div className="flex flex-col gap-3">
                          {results.preprocessing?.logs?.map((log: string, i: number) => (
                            <div key={i} className={`p-3 rounded-lg text-sm font-medium border-l-4 border-pink-500 flex items-center gap-3 ${isDarkMode ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                              {log}
                            </div>
                          )) || <div className="text-sm text-gray-500">No preprocessing logs found.</div>}
                        </div>
                      </div>

                      {/* Correlation Heatmap */}
                      <div className={`xl:col-span-2 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Grid size={20} className="text-cyan-400" /> Feature Correlation Heatmap
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">
                          Identifies multicollinearity. Green = Positive correlation, Red = Negative correlation.
                        </p>
                        
                        {features.length > 0 ? (
                          <div className="overflow-x-auto pb-4">
                            <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${features.length}, minmax(50px, 1fr))` }} className="gap-1.5 text-xs min-w-[400px]">
                              {/* Header Row */}
                              <div></div>
                              {features.map((f: any) => (
                                <div key={`head-${f}`} className="text-center font-bold text-gray-500 truncate px-1" title={f}>
                                  {f.length > 10 ? f.substring(0,8)+'..' : f}
                                </div>
                              ))}
                              
                              {/* Matrix Rows */}
                              {features.map((y: any) => (
                                <React.Fragment key={`row-${y}`}>
                                  <div className="flex items-center justify-end pr-3 font-bold text-gray-500 truncate" title={y}>
                                    {y.length > 15 ? y.substring(0,13)+'..' : y}
                                  </div>
                                  {features.map((x: any) => {
                                      const cell = corrMatrix.find((m: any) => m.x === x && m.y === y);
                                      const val = cell ? cell.value : 0;
                                      const bgColor = val > 0 
                                          ? `rgba(16, 185, 129, ${Math.max(0.1, Math.abs(val))})` 
                                          : `rgba(239, 68, 68, ${Math.max(0.1, Math.abs(val))})`;
                                      const isWhite = Math.abs(val) > 0.4;
                                      
                                      return (
                                        <div 
                                          key={`${x}-${y}`} 
                                          className={`h-12 rounded-lg flex items-center justify-center font-bold text-sm transition-all hover:scale-110 cursor-pointer shadow-sm ${isWhite ? 'text-white' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}
                                          style={{ backgroundColor: bgColor }}
                                          title={`${x} & ${y}: ${val.toFixed(2)}`}
                                        >
                                          {val.toFixed(2)}
                                        </div>
                                      );
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-gray-500 bg-gray-800/20 rounded-xl border border-gray-700/50 border-dashed">
                            No numerical features available for correlation.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Feature Stats */}
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm overflow-hidden flex flex-col`}>
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <FileSpreadsheet size={20} className="text-blue-400" /> Feature Statistics & Distributions
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`border-b ${isDarkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                              <th className="p-3 font-semibold text-xs uppercase tracking-wider">Feature</th>
                              <th className="p-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                              <th className="p-3 font-semibold text-xs uppercase tracking-wider">Missing</th>
                              <th className="p-3 font-semibold text-xs uppercase tracking-wider">Mean / Top</th>
                              <th className="p-3 font-semibold text-xs uppercase tracking-wider">Std / Unique</th>
                              <th className="p-3 font-semibold text-xs uppercase tracking-wider w-48 text-center">Data Range (Min → Max)</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {results.preprocessing?.eda?.features?.map((f: any, i: number) => {
                              const rangeValid = f.min !== undefined && f.max !== undefined && f.max > f.min;
                              const meanPct = rangeValid ? ((f.mean - f.min) / (f.max - f.min)) * 100 : 50;
                              
                              return (
                              <tr key={i} className={`border-b last:border-0 ${isDarkMode ? 'border-gray-800/50 hover:bg-gray-800/80' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <td className="p-3 font-bold text-gray-300">{f.name}</td>
                                <td className="p-3"><span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${f.type.includes('float') || f.type.includes('int') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>{f.type}</span></td>
                                <td className="p-3">
                                  <span className={f.missing > 0 ? 'text-red-400 font-bold px-2 py-1 bg-red-500/10 rounded-md' : 'text-gray-500'}>
                                    {f.missing} <span className="text-xs opacity-50">({f.missing_pct}%)</span>
                                  </span>
                                </td>
                                <td className="p-3 text-gray-300">{f.mean !== undefined ? f.mean.toFixed(2) : f.top}</td>
                                <td className="p-3 text-gray-400">{f.std !== undefined ? f.std.toFixed(2) : f.unique}</td>
                                <td className="p-3 w-48">
                                  {rangeValid ? (
                                    <div className="flex items-center gap-3 text-[10px] font-mono">
                                      <span className="w-8 text-right text-gray-500">{f.min.toFixed(0)}</span>
                                      <div className="flex-1 h-2 bg-gray-800 rounded-full relative overflow-hidden">
                                        <div className="absolute top-0 bottom-0 bg-blue-500/30" style={{left: '0%', width: '100%'}}></div>
                                        {/* Mean indicator */}
                                        <div className="absolute top-0 bottom-0 w-1 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" style={{left: `${Math.max(0, Math.min(100, meanPct))}%`}}></div>
                                      </div>
                                      <span className="w-8 text-left text-gray-500">{f.max.toFixed(0)}</span>
                                    </div>
                                  ) : (
                                    <div className="text-center text-xs text-gray-600">-</div>
                                  )}
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              """

    content = content[:start_idx] + new_eda_content + content[end_idx:]
    with open(file_path, "w") as f:
        f.write(content)
else:
    print("Could not find replacement boundaries")

