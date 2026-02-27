'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Minimize2, Maximize2, X, Loader, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  id: string;
}

interface ChatbotProps {
  currentStock?: string;
  marketData?: any;
  className?: string;
}

const SUGGESTED_QUESTIONS = [
  "What's the current market sentiment?",
  "Should I invest in tech stocks right now?",
  "Explain the basics of portfolio diversification",
  "What are the key indicators to watch?",
  "How do I assess stock valuation?",
  "What's driving today's market movements?"
];

export default function FinancialChatbot({ currentStock, marketData, className = '' }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm FINNEXUS AI, your personal financial advisor. I can help you with market analysis, investment strategies, and financial education. What would you like to know?",
      timestamp: Date.now(),
      id: 'welcome'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

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
          context: {
            currentStock,
            marketData
          }
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
      
      // Add error message to chat
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

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${className}`}
        title="Open Financial AI Assistant"
      >
        <Bot className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className={`bg-[#131824] border border-gray-800 rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">FINNEXUS AI</h3>
              <p className="text-xs text-gray-400">Financial Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 transition-colors"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 transition-colors"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 opacity-70 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-400 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_QUESTIONS.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
              {error && (
                <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about stocks, investments, market trends..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Market Analysis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>Investment Advice</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>Portfolio Tips</span>
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}