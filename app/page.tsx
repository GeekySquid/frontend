'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="h-full bg-[#0a0e1a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white font-bold text-2xl">F</span>
        </div>
        <p className="text-gray-400">Loading FINNEXUS...</p>
      </div>
    </div>
  );
}
