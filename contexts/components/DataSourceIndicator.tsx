'use client';

import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface DataSourceIndicatorProps {
  source?: string;
  note?: string;
  lastUpdated?: Date | null;
  loading?: boolean;
}

export default function DataSourceIndicator({ 
  source = 'unknown', 
  note, 
  lastUpdated, 
  loading = false 
}: DataSourceIndicatorProps) {
  const getSourceInfo = () => {
    switch (source) {
      case 'alpha-vantage':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          label: 'Live Data',
          description: 'Real-time data from Alpha Vantage',
          color: 'text-green-400'
        };
      case 'apify-yahoo-finance':
        return {
          icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
          label: 'Live Data',
          description: 'Real-time data from Yahoo Finance via Apify',
          color: 'text-blue-400'
        };
      case 'enhanced-mock':
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
          label: 'Demo Data',
          description: 'Enhanced simulation (API limit reached)',
          color: 'text-yellow-400'
        };
      case 'steady-api':
        return {
          icon: <CheckCircle className="w-4 h-4 text-purple-500" />,
          label: 'Live Data',
          description: 'Real-time data from Steady API',
          color: 'text-purple-400'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          label: 'Loading',
          description: 'Fetching data...',
          color: 'text-gray-400'
        };
    }
  };

  const sourceInfo = getSourceInfo();

  return (
    <div className="flex items-center gap-3 p-3 bg-[#131824]/50 dark:bg-[#131824]/50 light:bg-gray-50 border border-gray-800/30 dark:border-gray-800/30 light:border-gray-200 rounded-lg">
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          sourceInfo.icon
        )}
        <div>
          <div className={`text-sm font-medium ${sourceInfo.color}`}>
            {loading ? 'Updating...' : sourceInfo.label}
          </div>
          <div className="text-xs text-gray-500">
            {loading ? 'Please wait...' : sourceInfo.description}
          </div>
        </div>
      </div>

      {lastUpdated && !loading && (
        <div className="text-xs text-gray-500 ml-auto">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {note && (
        <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 ml-auto max-w-xs">
          {note}
        </div>
      )}
    </div>
  );
}