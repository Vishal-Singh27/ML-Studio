import re

file_path = "/Users/vishalsingh/Library/Mobile Documents/com~apple~CloudDocs/Coding Related/Ongoing-Projects/ML-Studio/client/src/App.tsx"
with open(file_path, "r") as f:
    content = f.read()

eda_insight_card = """                  <div className="space-y-6 mb-6">

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
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{insights.eda}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
"""

search_str = 'return (\n                  <div className="space-y-6 mb-6">'

if search_str in content:
    content = content.replace(search_str, eda_insight_card)
    with open(file_path, "w") as f:
        f.write(content)
    print("SUCCESS")
else:
    print("TARGET NOT FOUND")

