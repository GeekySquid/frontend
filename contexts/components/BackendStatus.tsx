'use client';

import { useState, useEffect } from 'react';
import { backendClient } from '@/lib/backend-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Server, Zap, Clock, TrendingUp } from 'lucide-react';

interface BackendStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function BackendStatus({ className = '', showDetails = false }: BackendStatusProps) {
  const [status, setStatus] = useState<{
    available: boolean;
    latency?: number;
    error?: string;
    health?: any;
    metrics?: any;
    loading: boolean;
  }>({
    available: false,
    loading: true
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const connectionCheck = await backendClient.checkConnection();
      
      if (connectionCheck.available) {
        const [health, metrics] = await Promise.all([
          backendClient.getHealth().catch(() => null),
          backendClient.getMetrics().catch(() => null)
        ]);
        
        setStatus({
          available: true,
          latency: connectionCheck.latency,
          health,
          metrics,
          loading: false
        });
      } else {
        setStatus({
          available: false,
          error: connectionCheck.error,
          loading: false
        });
      }
    } catch (error) {
      setStatus({
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      });
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge 
          variant={status.available ? 'default' : 'destructive'}
          className="flex items-center gap-1"
        >
          <Server className="w-3 h-3" />
          AI Backend {status.available ? 'Connected' : 'Offline'}
        </Badge>
        {status.latency && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {status.latency}ms
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={status.loading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`w-3 h-3 ${status.loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            AI Backend Status
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatus}
            disabled={status.loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${status.loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Connection</span>
          <Badge variant={status.available ? 'default' : 'destructive'}>
            {status.available ? 'Connected' : 'Offline'}
          </Badge>
        </div>
        
        {status.latency && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Latency</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {status.latency}ms
            </Badge>
          </div>
        )}

        {status.health && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Models</span>
            <Badge variant={status.health.models_loaded ? 'default' : 'destructive'}>
              {status.health.models_loaded ? 'Loaded' : 'Not Loaded'}
            </Badge>
          </div>
        )}

        {status.metrics && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Predictions</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {status.metrics.successful_predictions}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
              <Badge variant="outline">
                {(status.metrics.cache_hit_rate * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Response</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {status.metrics.average_response_time.toFixed(0)}ms
              </Badge>
            </div>
          </>
        )}

        {status.error && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {status.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}