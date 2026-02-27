import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords') || 'finance OR stock OR market OR economy OR trading';
  const limit = searchParams.get('limit') || '10';

  try {
    // Using GNEWS API
    const response = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(keywords)}&lang=en&country=us&max=${limit}&apikey=${process.env.NEXT_PUBLIC_GNEWS_API_KEY}`,
      {
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch news from GNEWS');
    }

    const data = await response.json();
    
    // Transform GNEWS data to match our interface
    if (data && data.articles && data.articles.length > 0) {
      const transformedData = {
        data: data.articles.map((article: any) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          published_at: article.publishedAt,
          source: article.source.name,
          image: article.image,
          category: 'finance'
        })),
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(transformedData);
    } else {
      throw new Error('No news data available');
    }
  } catch (error) {
    console.error('News API Error:', error);
    
    // Fallback to mock financial news data
    const mockNews = [
      {
        title: "NVIDIA's Q4 Revenue Hits Record $68.1 Billion, Up 20% YoY",
        description: "NVIDIA Corporation reported record quarterly revenue driven by strong demand for AI chips and data center solutions, beating analyst expectations.",
        url: "https://finance.yahoo.com/news/nvidia-earnings",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "Reuters",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
        category: "earnings"
      },
      {
        title: "Federal Reserve Signals Potential Rate Cuts in Q2 2026",
        description: "Fed officials hint at interest rate reductions citing cooling inflation data and stable employment metrics.",
        url: "https://finance.yahoo.com/news/fed-rates",
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: "Bloomberg",
        image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
        category: "monetary-policy"
      },
      {
        title: "Apple Faces EU Antitrust Investigation Over App Store Policies",
        description: "European Commission launches formal investigation into Apple's App Store practices and developer fee structure.",
        url: "https://finance.yahoo.com/news/apple-eu",
        published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: "Financial Times",
        image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=200&fit=crop",
        category: "regulation"
      },
      {
        title: "Tesla Announces New Gigafactory in Southeast Asia",
        description: "Electric vehicle maker Tesla confirms plans for a new manufacturing facility to meet growing Asian demand.",
        url: "https://finance.yahoo.com/news/tesla-gigafactory",
        published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: "CNBC",
        image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=200&fit=crop",
        category: "automotive"
      },
      {
        title: "Oil Prices Surge 4% on Middle East Supply Concerns",
        description: "Crude oil futures jump as geopolitical tensions raise concerns about potential supply disruptions.",
        url: "https://finance.yahoo.com/news/oil-prices",
        published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        source: "Wall Street Journal",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
        category: "commodities"
      },
      {
        title: "Microsoft Azure Revenue Grows 30% in Cloud Computing Push",
        description: "Microsoft reports strong cloud revenue growth, competing aggressively with Amazon Web Services.",
        url: "https://finance.yahoo.com/news/microsoft-azure",
        published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        source: "TechCrunch",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop",
        category: "technology"
      },
      {
        title: "S&P 500 Reaches New All-Time High Amid Tech Rally",
        description: "Major stock indices surge as technology stocks lead broad market gains in early trading.",
        url: "https://finance.yahoo.com/news/sp500-high",
        published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        source: "MarketWatch",
        image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
        category: "markets"
      },
      {
        title: "Cryptocurrency Market Cap Surpasses $3 Trillion",
        description: "Bitcoin and Ethereum lead digital asset rally as institutional adoption continues to grow.",
        url: "https://finance.yahoo.com/news/crypto-3trillion",
        published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        source: "CoinDesk",
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop",
        category: "cryptocurrency"
      }
    ];

    return NextResponse.json({
      data: mockNews,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
}
