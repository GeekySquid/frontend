import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Financial context and system prompt for the AI
const FINANCIAL_SYSTEM_PROMPT = `You are FINNEXUS AI, an expert financial advisor and market analyst. You provide intelligent, accurate, and helpful financial advice and market insights.

Your capabilities include:
- Real-time market analysis and stock insights
- Investment strategy recommendations
- Risk assessment and portfolio advice
- Financial education and explanations
- Trading tips and market trends analysis
- Economic news interpretation

Guidelines:
- Always provide accurate, well-researched financial information
- Include disclaimers about investment risks when appropriate
- Be conversational but professional
- Use data-driven insights when possible
- Explain complex financial concepts in simple terms
- Never guarantee investment returns
- Always remind users to do their own research and consider their risk tolerance

Current market context: You have access to real-time stock data and market information through the FINNEXUS platform.

Remember: You are not a licensed financial advisor. Always recommend users consult with qualified financial professionals for personalized advice.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context?: {
    currentStock?: string;
    marketData?: any;
    userPortfolio?: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [], context } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build conversation history for context
    let conversationContext = FINANCIAL_SYSTEM_PROMPT + '\n\n';
    
    // Add market context if available
    if (context?.currentStock) {
      conversationContext += `Current stock being viewed: ${context.currentStock}\n`;
    }
    
    if (context?.marketData) {
      conversationContext += `Current market data: ${JSON.stringify(context.marketData, null, 2)}\n`;
    }

    conversationContext += '\nConversation History:\n';
    
    // Add recent conversation history (last 10 messages to stay within token limits)
    const recentHistory = history.slice(-10);
    recentHistory.forEach((msg) => {
      conversationContext += `${msg.role === 'user' ? 'User' : 'FINNEXUS AI'}: ${msg.content}\n`;
    });

    conversationContext += `\nUser: ${message}\nFINNEXUS AI:`;

    console.log('🤖 Generating AI response for:', message.substring(0, 100) + '...');

    // Generate response using Gemini
    const result = await model.generateContent(conversationContext);
    const response = await result.response;
    const aiMessage = response.text();

    console.log('✅ AI response generated successfully');

    // Return the response
    return NextResponse.json({
      message: aiMessage,
      timestamp: Date.now(),
      model: 'gemini-pro',
      context: {
        finishReason: response.candidates?.[0]?.finishReason || 'STOP'
      }
    });

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    
    // Return a fallback response
    return NextResponse.json({
      message: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment. In the meantime, you can explore the live market data and charts available on the dashboard.",
      timestamp: Date.now(),
      model: 'fallback',
      error: true
    }, { status: 200 }); // Return 200 to avoid breaking the UI
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'active',
    model: 'gemini-pro',
    capabilities: [
      'Financial advice',
      'Market analysis',
      'Investment insights',
      'Risk assessment',
      'Educational content'
    ],
    timestamp: Date.now()
  });
}