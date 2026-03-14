'use client';

import React from 'react';

export default function ConfigPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Import / Export
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Manage your configuration and synchronize flags between environments.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Configuration Hub</h3>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
          The Import/Export management tools will be available here shortly.
        </p>
      </div>
    </div>
  );
}
