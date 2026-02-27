'use client';

import Navigation from '@/components/Navigation';
import PortfolioAnalyzer from '@/components/PortfolioAnalyzer';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Portfolio Analyzer</h1>
          <p className="mt-2 text-gray-400">
            Optimize your investment portfolio with AI-powered analysis and predictions
          </p>
        </div>
        <PortfolioAnalyzer />
      </main>
    </div>
  );
}
