'use client';

export default function AnalystRatings() {
  const ratings = [
    { label: 'Buy', count: 28, color: 'bg-green-500', width: '70%' },
    { label: 'Hold', count: 10, color: 'bg-yellow-500', width: '25%' },
    { label: 'Sell', count: 2, color: 'bg-red-500', width: '5%' },
  ];

  return (
    <div className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-4">
      <h3 className="font-bold mb-4 text-sm">Analyst Opinion</h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Avg Target</span>
          <span className="text-lg font-bold text-green-400">210.00</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Low: 180.00</span>
          <span>High: 250.00</span>
        </div>
      </div>

      <div className="space-y-3">
        {ratings.map((rating, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">{rating.label}</span>
              <span className="font-medium">{rating.count}</span>
            </div>
            <div className="w-full bg-gray-800 dark:bg-gray-800 light:bg-gray-200 rounded-full h-2">
              <div
                className={`${rating.color} h-2 rounded-full transition-all`}
                style={{ width: rating.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 dark:border-gray-800 light:border-gray-200">
        <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
          40 analysts (Last 3 months)
        </div>
      </div>
    </div>
  );
}
