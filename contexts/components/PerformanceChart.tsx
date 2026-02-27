'use client';

export default function PerformanceChart() {
  const periods = [
    { label: '1 Month', value: '+5.2%', positive: true },
    { label: '3 Months', value: '+12.8%', positive: true },
    { label: '6 Months', value: '+28.4%', positive: true },
    { label: '1 Year', value: '+48.3%', positive: true },
    { label: 'YTD', value: '+15.7%', positive: true },
  ];

  return (
    <div className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-4">
      <h3 className="font-bold mb-4 text-sm">Returns</h3>
      
      <div className="space-y-3">
        {periods.map((period, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">{period.label}</span>
            <span className={`text-sm font-medium ${period.positive ? 'text-green-400' : 'text-red-400'}`}>
              {period.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 dark:border-gray-800 light:border-gray-200">
        <div className="h-32 flex items-end justify-between gap-2">
          {[65, 78, 85, 92, 88, 95, 100].map((height, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>1M</span>
          <span>3M</span>
          <span>6M</span>
          <span>1Y</span>
        </div>
      </div>
    </div>
  );
}
