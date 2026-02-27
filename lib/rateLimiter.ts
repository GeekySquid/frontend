// Rate limiter for Alpha Vantage API (5 requests per minute)
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 5, timeWindowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000; // Convert to milliseconds
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove requests older than the time window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    
    // Check if we can make a new request
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    const now = Date.now();
    this.requests.push(now);
    
    // Keep only requests within the time window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
  }

  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) {
      return 0;
    }

    const now = Date.now();
    const oldestRequest = Math.min(...this.requests);
    const timeUntilOldestExpires = this.timeWindow - (now - oldestRequest);
    
    return Math.max(0, timeUntilOldestExpires);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getStatus() {
    return {
      canMakeRequest: this.canMakeRequest(),
      remainingRequests: this.getRemainingRequests(),
      timeUntilNextRequest: this.getTimeUntilNextRequest(),
      requestsInWindow: this.requests.length
    };
  }
}

// Global rate limiter instance for Alpha Vantage
export const alphaVantageRateLimiter = new RateLimiter(5, 1); // 5 requests per minute

// Cache for API responses to reduce API calls
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: any, ttlMinutes: number = 1): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

// Global cache instance
export const alphaVantageCache = new ApiCache();

// Utility function to create cache keys
export function createCacheKey(symbol: string, endpoint: string = 'quote'): string {
  return `${endpoint}:${symbol.toUpperCase()}`;
}

// Smart request scheduler that respects rate limits
export async function scheduleAlphaVantageRequest<T>(
  requestFn: () => Promise<T>,
  symbol: string,
  cacheTtlMinutes: number = 1
): Promise<T | null> {
  const cacheKey = createCacheKey(symbol);
  
  // Check cache first
  const cachedData = alphaVantageCache.get(cacheKey);
  if (cachedData) {
    console.log(`📦 Cache hit for ${symbol}`);
    return cachedData;
  }

  // Check rate limit
  if (!alphaVantageRateLimiter.canMakeRequest()) {
    const timeUntil = alphaVantageRateLimiter.getTimeUntilNextRequest();
    console.log(`⏳ Rate limit reached. Next request available in ${Math.ceil(timeUntil / 1000)}s`);
    return null;
  }

  try {
    // Record the request
    alphaVantageRateLimiter.recordRequest();
    
    // Make the API call
    const data = await requestFn();
    
    // Cache the result
    alphaVantageCache.set(cacheKey, data, cacheTtlMinutes);
    
    console.log(`✅ API request successful for ${symbol}. Remaining: ${alphaVantageRateLimiter.getRemainingRequests()}`);
    
    return data;
  } catch (error) {
    console.error(`❌ API request failed for ${symbol}:`, error);
    return null;
  }
}