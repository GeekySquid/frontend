'use client';

import { Building2, Globe, Users, Calendar } from 'lucide-react';

export default function CompanyInfo() {
  return (
    <div className="bg-[#131824] dark:bg-[#131824] light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-lg p-4">
      <h3 className="font-bold mb-4 text-sm">Company Info</h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-400 light:text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Industry</div>
            <div className="text-sm">Semiconductors · Electronics</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="w-4 h-4 text-gray-400 dark:text-gray-400 light:text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Employees</div>
            <div className="text-sm">29,600</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-400 light:text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Founded</div>
            <div className="text-sm">April 1993</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Globe className="w-4 h-4 text-gray-400 dark:text-gray-400 light:text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">Headquarters</div>
            <div className="text-sm">Santa Clara, California, USA</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 dark:border-gray-800 light:border-gray-200">
        <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 leading-relaxed">
          NVIDIA is a global leader in GPU and AI computing, providing innovative technology across gaming, data centers, autonomous driving, and more.
        </p>
      </div>
    </div>
  );
}
