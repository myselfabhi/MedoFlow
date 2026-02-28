'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { clearAccessToken, setAccessToken } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const { data } = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      if (data.success && data.data.user) {
        setUser(data.data.user);
        return data.data.user;
      }
      return null;
    } catch {
      clearAccessToken();
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ success: boolean; data: { accessToken: string; user: User } }>(
      '/auth/login',
      { email, password }
    );
    if (data.success && data.data.accessToken) {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const restoredUser = await getCurrentUser();
        if (!restoredUser) {
          clearAccessToken();
        }
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [getCurrentUser]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
