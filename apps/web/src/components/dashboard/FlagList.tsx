'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFlags, useToggleFlag, useDeleteFlag } from '@/hooks/useFlags';
import { FeatureFlag } from '@/infrastructure/api/flags.service';
import { useAuth } from '@/hooks/useAuth';

export default function FlagList() {
  const { data: flags, isLoading, isError } = useFlags();
  const toggleFlag = useToggleFlag();
  const deleteFlag = useDeleteFlag();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const isAdmin = user?.roles?.includes('admin');

  const filteredFlags = flags?.filter(flag => 
    flag.key.toLowerCase().includes(search.toLowerCase()) || 
    flag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (key: string, currentStatus: boolean) => {
    if (!isAdmin) return;
    toggleFlag.mutate({ key, enabled: !currentStatus });
  };

  const handleDelete = (key: string) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete flag "${key}"?`)) {
      deleteFlag.mutate(key);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full max-w-sm bg-slate-200 animate-pulse rounded-xl"></div>
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 border-b border-slate-100 flex items-center space-x-4">
              <div className="h-6 w-1/4 bg-slate-100 animate-pulse rounded"></div>
              <div className="h-6 w-1/2 bg-slate-50 animate-pulse rounded"></div>
              <div className="h-6 w-12 bg-slate-100 animate-pulse rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-900 mb-2">Error loading flags</h3>
        <p className="text-red-700">Please try again later or contact support if the issue persists.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search flags by key or name..."
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {isAdmin && (
          <Link
            href="/flags/new"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 hover:shadow-primary-300 transform active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Create Flag
          </Link>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Key & Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Strategy</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFlags?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">No feature flags found matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredFlags?.map((flag) => (
                  <tr key={flag.key} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <Link href={`/flags/${flag.key}`} className="text-slate-900 font-bold hover:text-primary-600 transition-colors break-all">
                          {flag.key}
                        </Link>
                        <span className="text-sm text-slate-500 mt-0.5">{flag.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`
                        inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize
                        ${flag.strategy?.type ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/50' : 'bg-slate-100 text-slate-600'}
                      `}>
                        {flag.strategy?.type || 'Static'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggle(flag.key, flag.enabled)}
                          disabled={!isAdmin || toggleFlag.isPending}
                          className={`
                            relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10
                            ${flag.enabled ? 'bg-primary-600' : 'bg-slate-200'}
                            ${!isAdmin && 'opacity-60 cursor-not-allowed'}
                            ${toggleFlag.isPending && (toggleFlag.variables as any)?.key === flag.key ? 'opacity-50' : ''}
                          `}
                        >
                          <span className={`
                            inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out
                            ${flag.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}
                          `} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          href={`/analytics/${flag.key}`}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="View Analytics"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </Link>
                        {isAdmin && (
                          <>
                            <Link 
                              href={`/flags/${flag.key}`}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                              title="Edit Flag"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button 
                              onClick={() => handleDelete(flag.key)}
                              disabled={deleteFlag.isPending}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Flag"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
