


import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  refetchUser: () => Promise<void>;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUser = useCallback(async () => {
    const currentToken = localStorage.getItem('authToken');
    if (currentToken) {
      setLoading(true);
      try {
        const response = await api.get<User | { data: User }>('/auth/me');
        let userData: User;
        if ('data' in response && response.data) {
          userData = response.data;
        } else {
          userData = response as User;
        }
        setUser(userData);
      } catch (e) {
        console.error("Failed to fetch user, token might be invalid. Logging out.", e);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
        localStorage.setItem('authToken', token);
        fetchUser();
    } else {
        localStorage.removeItem('authToken');
        setUser(null);
    }
  }, [token, fetchUser]);

  const refetchUser = async () => {
    await fetchUser();
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<LoginResponse | { data: LoginResponse }>('/auth/access-token', { email, password });
      
      let loginData: LoginResponse;
      if ('data' in response) {
        loginData = response.data;
      } else {
        loginData = response;
      }

      if (loginData && loginData.access_token) {
        setToken(loginData.access_token);
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        throw new Error('Login response did not contain an access token.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    navigate('/login');
  };

  const value = { token, user, login, logout, loading, error, refetchUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};