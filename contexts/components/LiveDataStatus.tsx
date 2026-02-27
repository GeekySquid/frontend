'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';

interface LiveDataStatusProps {
  lastUpdate?: Date;
  isLoading?: boolean;
  hasError?: boolean;
  source?: string;
}

export default function LiveDataStatus({ 
  lastUpdate, 
  isLoading = false, 
  hasError = false,
  source = 'steady-api'
}: LiveDataStatusProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      
      if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getStatusColor = () => {
    if (hasError) return 'text-red-400';
    if (isLoading) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    if (hasError) return <WifiOff className="w-3 h-3" />;
    if (isLoading) return <RefreshCw className="w-3 h-3 animate-spin" />;
    return <Wifi className="w-3 h-3" />;
  };

  const getStatusText = () => {
    if (hasError) return 'Connection Error';
    if (isLoading) return 'Updating...';
    return 'Live Data';
  };

  const getSourceBadge = () => {
    switch (source) {
      case 'steady-api':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
            <Zap className="w-3 h-3" />
            Steady API
          </div>
        );
      case 'mock-data':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
            Demo Data
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
            Live
          </div>
        );
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {lastUpdate && !isLoading && (
        <span className="text-gray-500">
          Updated {timeAgo}
        </span>
      )}
      
      {getSourceBadge()}
    </div>
  );
}