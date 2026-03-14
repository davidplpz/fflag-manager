'use client';

import React from 'react';
import FlagList from '@/components/dashboard/FlagList';

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Feature Flags
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Manage your feature flags and their rollout strategies across your environments.
        </p>
      </div>

      <FlagList />
    </div>
  );
}
