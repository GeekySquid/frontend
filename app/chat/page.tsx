'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Trash2, Download, Copy, TrendingUp, DollarSign, BarChart3, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  id: string;
}

const FINANCIAL_TOPICS = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Market Analysis",
    description: "Get insights on current market trends and movements",
    questions: [
      "What's driving today's market movements?",
      "Which sectors are performing well this week?",
      "How is the current economic climate affecting stocks?"
    ]
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    title: "Investment Strategy",
    description: "Learn about different investment approaches and strategies",
    questions: [
      "What's the difference between value and growth investing?",
      "How should I diversify my portfolio?",
      "What are some good long-term investment strategies?"
    ]
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Stock Analysis",
    description: "Understand how to analyze and evaluate stocks",
    questions: [
      "How do I read financial statements?",
      "What are the key metrics to look at when evaluating a stock?",
      "How do I determine if a stock is overvalued or undervalued?"
    ]
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Financial Education",
    description: "Learn the basics of finance and investing",
    questions: [
      "What are the basics of the stock market?",
      "Explain different types of investment accounts",
      "What is compound interest and how does it work?"
    ]
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Welcome to FINNEXUS AI! I'm your personal financial advisor and market analyst. I can help you with investment strategies, market analysis, stock evaluation, and financial education. What would you like to explore today?",
      timestamp: Date.now(),
      id: 'welcome'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
      id: `user-${Date.now()}`
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          history: messages,
          context: {}
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
        id: `ai-${data.timestamp}`
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get response. Please try again.');
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
        id: `error-${Date.now()}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! I'm here to help with any financial questions you have.",
        timestamp: Date.now(),
        id: 'cleared'
      }
    ]);
    setError(null);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const exportChat = () => {
    const chatText = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'FINNEXUS AI'} (${new Date(msg.timestamp).toLocaleString()}): ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finnexus-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">FINNEXUS AI</h1>
              <p className="text-sm text-gray-400">Your Personal Financial Advisor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportChat}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
            title="Export chat"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors text-sm"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Welcome Topics (show only at start) */}
              {messages.length <= 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {FINANCIAL_TOPICS.map((topic, index) => (
                    <div key={index} className="bg-[#131824] border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          {topic.icon}
                        </div>
                        <div>
                          <h3 className="font-bold">{topic.title}</h3>
                          <p className="text-sm text-gray-400">{topic.description}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {topic.questions.map((question, qIndex) => (
                          <button
                            key={qIndex}
                            onClick={() => sendMessage(question)}
                            className="block w-full text-left text-sm p-2 bg-gray-800/50 hover:bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#131824] border border-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
                        <div className={`text-xs opacity-70 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </div>
                        <button
                          onClick={() => copyMessage(message.content)}
                          className={`p-1 rounded hover:bg-gray-700/50 transition-colors ${
                            message.role === 'user' ? 'text-blue-100 hover:bg-blue-600/50' : 'text-gray-400'
                          }`}
                          title="Copy message"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 order-2">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-[#131824] border border-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-400">FINNEXUS AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-4">
            <div className="max-w-4xl mx-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about finance, investments, market analysis, or trading strategies..."
                    className="w-full px-4 py-3 bg-[#131824] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <span>{inputMessage.length}/2000</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}