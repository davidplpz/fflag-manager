'use client';

import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Analytics
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Visualize usage patterns and performance metrics for your feature flags.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
          <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Analytics coming soon</h3>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
          We're currently building advanced analytics features to help you understand the impact of your features.
        </p>
      </div>
    </div>
  );
}
