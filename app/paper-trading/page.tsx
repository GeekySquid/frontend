'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QualificationGate from '@/components/learning/QualificationGate';
import PaperTradingInterface from '@/components/paper-trading/PaperTradingInterface';

export default function PaperTradingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('demo-user'); // In real app, get from auth

  const handleNavigateToModule = (moduleId: string) => {
    // Navigate to the specific learning module
    router.push(`/learning/modules/${moduleId}`);
  };

  const handleNavigateToSimulation = () => {
    // Navigate to trading simulation
    router.push('/learning/simulations');
  };

  return (
    <div className="h-screen">
      <QualificationGate
        userId={userId}
        onNavigateToModule={handleNavigateToModule}
        onNavigateToSimulation={handleNavigateToSimulation}
      >
        <PaperTradingInterface userId={userId} />
      </QualificationGate>
    </div>
  );
}