'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Target, TrendingUp, PieChart, Brain, Trophy } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/profile', label: 'Profile', icon: Trophy },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/quiz', label: 'Quiz', icon: Target },
  { href: '/playground', label: 'Playground', icon: TrendingUp },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/advisor', label: 'Advisor', icon: Brain },
  { href: '/news', label: 'News', icon: TrendingUp },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#131824] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            FINNEXUS
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
