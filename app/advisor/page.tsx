'use client';

import { useState } from 'react';
import { Brain, Send, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdvisorPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Financial Strategy Advisor. I can analyze your portfolio, market sentiment, and provide personalized recommendations. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', content: input }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Based on your portfolio analysis, you have 80% exposure to Technology sector. Current market sentiment for tech is Bearish due to rate hikes. I recommend diversifying into defensive stocks like Consumer Staples or Healthcare.'
      }]);
    }, 1000);
    
    setInput('');
  };

  return (
    <div className="h-full bg-[#0a0e1a] text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          AI Strategy Advisor
        </h1>

        <div className="bg-[#131824] border border-gray-800 rounded-lg p-6 mb-6" style={{ height: '60vh' }}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-[#0a0e1a] border border-gray-700'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-400">Coach Alpha</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your portfolio, market trends, or strategies..."
                className="flex-1 px-4 py-3 bg-[#0a0e1a] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
