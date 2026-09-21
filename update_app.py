import re

file_path = "client/src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Add 'eda' to activeTab state
content = content.replace("const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'deep_learning'>('overview');", 
                          "const [activeTab, setActiveTab] = useState<'eda' | 'overview' | 'models' | 'deep_learning'>('eda');")

# 2. Add Tab trigger
old_tabs_trigger = """<div className={`flex flex-wrap gap-2 p-1.5 rounded-xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-200'}`}>"""
new_tabs_trigger = """<div className={`flex flex-wrap gap-2 p-1.5 rounded-xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-200'}`}>
                <button
                  onClick={() => setActiveTab('eda')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'eda' ? (isDarkMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-indigo-600 shadow') : (isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}`}
                >
                  <Database size={16} /> EDA & Preprocessing
                </button>"""
content = content.replace(old_tabs_trigger, new_tabs_trigger)

# 3. Add Tab content
eda_tab_content = """
                  {/* ─── EDA & PREPROCESSING TAB ─── */}
                  <TabsContent value="eda" activeTab={activeTab}>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                      <div className={`xl:col-span-1 p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Database size={20} className="text-indigo-400" /> Dataset Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <MetricCard label="Total Rows" value={results.preprocessing?.eda?.num_rows || results.preprocessing?.original_shape?.[0]} icon={<Database />} isDarkMode={isDarkMode} />
                          <MetricCard label="Features" value={results.preprocessing?.eda?.num_cols || results.preprocessing?.original_shape?.[1]} icon={<Layers />} isDarkMode={isDarkMode} />
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

                      <div className={`xl:col-span-2 p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'} shadow-sm overflow-hidden flex flex-col`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <FileSpreadsheet size={20} className="text-blue-400" /> Feature Statistics
                        </h3>
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className={`border-b ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Feature</th>
                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Missing</th>
                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Mean / Top</th>
                                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Std / Unique</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {results.preprocessing?.eda?.features?.map((f: any, i: number) => (
                                <tr key={i} className={`border-b last:border-0 ${isDarkMode ? 'border-gray-700/50 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50'}`}>
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
                  </TabsContent>
"""

if "value=\"eda\"" not in content:
    content = content.replace("{/* ─── OVERVIEW TAB ─── */}", eda_tab_content + "\n                  {/* ─── OVERVIEW TAB ─── */}")

with open(file_path, "w") as f:
    f.write(content)

