'use client';

import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-[#0a0e1a] dark:bg-[#0a0e1a] light:bg-gray-50 text-white dark:text-white light:text-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
