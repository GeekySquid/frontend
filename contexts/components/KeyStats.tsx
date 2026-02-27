'use client';

export default function KeyStats() {
  const stats = [
    { label: 'Next earnings report', value: 'In 90 days' },
    { label: 'Volume', value: '236.52M' },
    { label: 'Market Cap', value: '$4.56T' },
    { label: 'P/E Ratio', value: '45.23' },
    { label: '52W High', value: '$220.00' },
    { label: '52W Low', value: '$125.00' },
    { label: 'Avg Volume', value: '180.32M' },
    { label: 'Beta', value: '1.24' },
  ];

  return (
    <div className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-4">
      <h3 className="font-bold mb-4">Key Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx}>
            <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">{stat.label}</div>
            <div className="text-sm font-medium">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
