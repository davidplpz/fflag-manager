import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('shows authenticating loader when loading', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoading: true, isAuthenticated: false, user: null });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoading: false, isAuthenticated: false, user: null });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fdashboard');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isLoading: false, 
      isAuthenticated: true, 
      user: { id: '1', email: 'test@test.com', roles: [] } 
    });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects non-admins when requireAdmin is true', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isLoading: false, 
      isAuthenticated: true, 
      user: { id: '1', email: 'test@test.com', roles: ['user'] } 
    });
    
    render(
      <ProtectedRoute requireAdmin={true}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children for admins when requireAdmin is true', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      isLoading: false, 
      isAuthenticated: true, 
      user: { id: '1', email: 'admin@test.com', roles: ['admin'] } 
    });
    
    render(
      <ProtectedRoute requireAdmin={true}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
