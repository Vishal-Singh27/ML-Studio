import re

file_path = "client/src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Update activeTab definition
content = content.replace("const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'deep_learning'>('overview');", 
                          "const [activeTab, setActiveTab] = useState<'eda' | 'overview' | 'models' | 'deep_learning'>('eda');")
content = content.replace("const [activeTab, setActiveTab] = useState<'eda' | 'overview' | 'models' | 'deep_learning'>('overview');", 
                          "const [activeTab, setActiveTab] = useState<'eda' | 'overview' | 'models' | 'deep_learning'>('eda');")

# 2. Inject Global Tabs right before SUPERVISED block
eda_ui = """
              {/* ── GLOBAL TABS ── */}
              <div className={`flex gap-2 border-b mt-6 mb-6 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <button onClick={() => setActiveTab('eda')} className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab === 'eda' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                  EDA & Preprocessing
                </button>
                <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab !== 'eda' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                  Model Results
                </button>
              </div>

              {/* ── EDA TAB CONTENT ── */}
              {activeTab === 'eda' && results.preprocessing && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                  <div className={`xl:col-span-1 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Database size={20} className="text-indigo-400" /> Dataset Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Total Rows</p>
                        <p className="text-2xl font-black">{results.preprocessing?.eda?.num_rows || results.preprocessing?.original_shape?.[0]}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Features</p>
                        <p className="text-2xl font-black">{results.preprocessing?.eda?.num_cols || results.preprocessing?.original_shape?.[1]}</p>
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

                  <div className={`xl:col-span-2 p-6 rounded-2xl border ${isDarkMode ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'} shadow-sm overflow-hidden flex flex-col`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <FileSpreadsheet size={20} className="text-blue-400" /> Feature Statistics
                    </h3>
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`border-b ${isDarkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                            <th className="p-3 font-semibold text-xs uppercase tracking-wider">Feature</th>
                            <th className="p-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                            <th className="p-3 font-semibold text-xs uppercase tracking-wider">Missing</th>
                            <th className="p-3 font-semibold text-xs uppercase tracking-wider">Mean / Top</th>
                            <th className="p-3 font-semibold text-xs uppercase tracking-wider">Std / Unique</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {results.preprocessing?.eda?.features?.map((f: any, i: number) => (
                            <tr key={i} className={`border-b last:border-0 ${isDarkMode ? 'border-gray-800/50 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <td className="p-3 font-medium">{f.name}</td>
                              <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${f.type.includes('float') || f.type.includes('int') ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{f.type}</span></td>
                              <td className="p-3">
                                <span className={f.missing > 0 ? 'text-red-400 font-bold' : ''}>{f.missing} ({f.missing_pct}%)</span>
                              </td>
                              <td className="p-3">{f.mean !== undefined ? f.mean.toFixed(2) : f.top}</td>
                              <td className="p-3">{f.std !== undefined ? f.std.toFixed(2) : f.unique}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODEL RESULTS TAB CONTENT ── */}
              {activeTab !== 'eda' && (
                <>
"""

if "EDA TAB CONTENT" not in content:
    # We replace `{/* ── SUPERVISED ── */}` with the EDA UI and wrap the rest in a fragment
    content = content.replace("{/* ── SUPERVISED ── */}", eda_ui + "\n              {/* ── SUPERVISED ── */}")
    # Close the fragment before the final closing divs of the dashboard
    # Let's find the end of the success dashboard block. It ends with:
    #             )}
    #
    #           </div>
    #         )}
    
    closing_fragment = """
                </>
              )}
"""
    # Replace the exact block
    target_close = "              {/* ── UNSUPERVISED ── */}"
    # Wait, if we wrap the whole thing, we should put the closing fragment right before the `</div>` of the success block.
    # It's safer to just replace `</div>\n          )}` at the end of the success block.
    # Let's use regex to find the end of the success block.
    
    # Actually, simpler: I can just wrap SUPERVISED and UNSUPERVISED manually without breaking syntax.
    pass

with open(file_path, "w") as f:
    f.write(content)
