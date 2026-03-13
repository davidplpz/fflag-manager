'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (requireAdmin && !user?.roles?.includes('admin')) {
        // Redirect non-admins if they try to access admin-only pages
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname, requireAdmin]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-500 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Double check before rendering children to prevent content flash
  if (!isAuthenticated || (requireAdmin && !user?.roles?.includes('admin'))) {
    return null;
  }

  return <>{children}</>;
};
