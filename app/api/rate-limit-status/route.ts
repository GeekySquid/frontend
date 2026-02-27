import { NextResponse } from 'next/server';
import { alphaVantageRateLimiter, alphaVantageCache } from '@/lib/rateLimiter';

export async function GET() {
  const rateLimitStatus = alphaVantageRateLimiter.getStatus();
  
  return NextResponse.json({
    rateLimiter: {
      ...rateLimitStatus,
      timeUntilNextRequestSeconds: Math.ceil(rateLimitStatus.timeUntilNextRequest / 1000)
    },
    cache: {
      size: alphaVantageCache.size(),
      entries: alphaVantageCache.size()
    },
    timestamp: new Date().toISOString()
  });
}