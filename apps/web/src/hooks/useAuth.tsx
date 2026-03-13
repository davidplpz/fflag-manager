'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthClient, LoginCredentials } from '../infrastructure/api/auth.client';

export interface User {
  id: string;
  email: string;
  roles: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const decoded = jwtDecode<User & { exp: number }>(token);
          // Check expiration
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            setUser(decoded);
          }
        }
      } catch (e) {
        console.error('Failed to parse auth token', e);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { token } = await AuthClient.login(credentials);
      localStorage.setItem('auth_token', token);
      const decodedUser = jwtDecode<User>(token);
      setUser(decodedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    AuthClient.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
