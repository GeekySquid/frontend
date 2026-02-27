import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, description, source } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const prompt = `
    Analyze this financial news article and provide:
    1. Sentiment score (-1 to 1, where -1 is very bearish, 0 is neutral, 1 is very bullish)
    2. Market impact level (Low, Medium, High)
    3. Key insights (2-3 bullet points)
    4. Potential stock tickers affected
    5. Risk assessment

    Article Title: ${title}
    Description: ${description || 'No description provided'}
    Source: ${source || 'Unknown'}

    Respond in JSON format with the following structure:
    {
      "sentiment": number,
      "sentimentLabel": string,
      "impact": string,
      "insights": string[],
      "affectedTickers": string[],
      "riskLevel": string,
      "confidence": number
    }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get AI analysis');
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No AI response received');
    }

    // Try to parse JSON from AI response
    let analysis;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback to basic sentiment analysis
      analysis = getBasicSentimentAnalysis(title, description || '');
    }

    return NextResponse.json({
      ...analysis,
      timestamp: new Date().toISOString(),
      source: 'gemini-ai'
    });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // Fallback to basic analysis
    const { title, description } = await request.json();
    const fallbackAnalysis = getBasicSentimentAnalysis(title, description || '');
    
    return NextResponse.json({
      ...fallbackAnalysis,
      timestamp: new Date().toISOString(),
      source: 'fallback',
      error: 'AI analysis unavailable, using fallback'
    });
  }
}

function getBasicSentimentAnalysis(title: string, description: string) {
  const text = (title + ' ' + description).toLowerCase();
  
  const bullishWords = ['surge', 'gain', 'rise', 'up', 'growth', 'profit', 'bullish', 'rally', 'soar', 'jump', 'climb', 'beat', 'exceed', 'strong', 'positive'];
  const bearishWords = ['fall', 'drop', 'down', 'loss', 'decline', 'bearish', 'crash', 'plunge', 'tumble', 'sink', 'miss', 'weak', 'negative', 'concern'];
  const highImpactWords = ['fed', 'federal reserve', 'interest rate', 'earnings', 'revenue', 'profit', 'acquisition', 'merger', 'bankruptcy'];
  
  const bullishCount = bullishWords.filter(word => text.includes(word)).length;
  const bearishCount = bearishWords.filter(word => text.includes(word)).length;
  const highImpactCount = highImpactWords.filter(word => text.includes(word)).length;
  
  let sentiment = 0;
  let sentimentLabel = 'Neutral';
  
  if (bullishCount > bearishCount) {
    sentiment = Math.min(0.8, 0.3 + (bullishCount * 0.1));
    sentimentLabel = sentiment > 0.6 ? 'Very Bullish' : 'Bullish';
  } else if (bearishCount > bullishCount) {
    sentiment = Math.max(-0.8, -0.3 - (bearishCount * 0.1));
    sentimentLabel = sentiment < -0.6 ? 'Very Bearish' : 'Bearish';
  }
  
  const impact = highImpactCount > 0 ? 'High' : (bullishCount + bearishCount > 2 ? 'Medium' : 'Low');
  
  // Extract potential tickers from text
  const tickerPattern = /\b[A-Z]{2,5}\b/g;
  const potentialTickers = text.match(tickerPattern) || [];
  const commonTickers = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META'];
  const affectedTickers = potentialTickers.filter(ticker => commonTickers.includes(ticker));
  
  return {
    sentiment,
    sentimentLabel,
    impact,
    insights: [
      `Sentiment analysis based on ${bullishCount + bearishCount} key sentiment indicators`,
      `${impact} market impact expected based on content analysis`,
      `Confidence level: ${Math.round((Math.abs(sentiment) + 0.2) * 100)}%`
    ],
    affectedTickers: affectedTickers.length > 0 ? affectedTickers : ['Market-wide'],
    riskLevel: Math.abs(sentiment) > 0.5 ? 'High' : 'Medium',
    confidence: Math.round((Math.abs(sentiment) + 0.2) * 100)
  };
}