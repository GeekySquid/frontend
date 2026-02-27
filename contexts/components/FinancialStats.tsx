'use client';

export default function FinancialStats() {
  const stats = [
    { label: 'Market Cap', value: '$4.56T', subValue: '(₩6,156T)' },
    { label: '52W High', value: '220.00', change: '+18.7%' },
    { label: '52W Low', value: '125.00', change: '+48.3%' },
    { label: 'Volume', value: '236.52M' },
    { label: 'Avg Volume', value: '180.32M' },
    { label: 'P/E Ratio', value: '45.23' },
    { label: 'EPS', value: '4.10' },
    { label: 'Dividend Yield', value: '0.03%' },
    { label: 'Beta', value: '1.24' },
    { label: 'Target Price', value: '210.00', change: '+13.3%' },
  ];

  return (
    <div className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-4">
      <h3 className="font-bold mb-4 text-sm">Key Statistics</h3>
      <div className="space-y-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">{stat.label}</span>
            <div className="text-right">
              <span className="font-medium">{stat.value}</span>
              {stat.subValue && (
                <span className="text-xs text-gray-500 ml-1">{stat.subValue}</span>
              )}
              {stat.change && (
                <span className={`text-xs ml-1 ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
