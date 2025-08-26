
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { TruckIcon } from '../components/icons';
import { notifyError } from '../services/notification';

const Login: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // FIX: Completed the handleSubmit function. It now correctly handles the form submission event.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        notifyError('Email and password are required.');
        return;
    }
    try {
      await login(email, password);
    } catch (err) {
      // The useAuth hook will set an error message that is displayed in the UI.
      console.error('Login failed:', err);
    }
  };

  // FIX: Added the JSX return value for the component, which was missing.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 text-indigo-600 bg-indigo-100 rounded-full dark:text-indigo-400 dark:bg-gray-700">
                <TruckIcon />
            </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to FleetFlow</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Please enter your details.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-300" role="alert">
              Login failed: {error}
            </div>
          )}

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// FIX: Added the missing default export for the Login component.
export default Login;
