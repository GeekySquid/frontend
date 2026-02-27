'use client';

import { useState, useEffect } from 'react';
import { Clock, Database, Zap } from 'lucide-react';

interface RateLimitData {
  rateLimiter: {
    canMakeRequest: boolean;
    remainingRequests: number;
    timeUntilNextRequest: number;
    timeUntilNextRequestSeconds: number;
    requestsInWindow: number;
  };
  cache: {
    size: number;
    entries: number;
  };
  timestamp: string;
}

export default function RateLimitStatus() {
  const [status, setStatus] = useState<RateLimitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/rate-limit-status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch rate limit status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading || !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/30 rounded-lg">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400">Loading status...</span>
      </div>
    );
  }

  const { rateLimiter, cache } = status;

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-gray-800/30 rounded-lg text-xs">
      {/* API Rate Limit Status */}
      <div className="flex items-center gap-2">
        <Zap className={`w-3 h-3 ${rateLimiter.canMakeRequest ? 'text-green-400' : 'text-red-400'}`} />
        <span className="text-gray-300">
          API: {rateLimiter.remainingRequests}/5
        </span>
        {!rateLimiter.canMakeRequest && rateLimiter.timeUntilNextRequestSeconds > 0 && (
          <span className="text-red-400">
            ({rateLimiter.timeUntilNextRequestSeconds}s)
          </span>
        )}
      </div>

      {/* Cache Status */}
      <div className="flex items-center gap-2">
        <Database className="w-3 h-3 text-blue-400" />
        <span className="text-gray-300">
          Cache: {cache.size} entries
        </span>
      </div>

      {/* Last Update */}
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-gray-400" />
        <span className="text-gray-400">
          {new Date(status.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}