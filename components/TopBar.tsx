
import React, { useState, useEffect } from 'react';
import { SearchIcon, BellIcon, GridIcon, SunIcon, MoonIcon } from './icons';
import UserProfileDropdown from './UserProfileDropdown';

const TopBar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.theme) {
      return localStorage.theme === 'dark';
    }
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className="flex-shrink-0 bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        <div className="relative w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700/50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          <button type="button" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
            <span className="sr-only">View notifications</span>
            <BellIcon />
          </button>

          <button type="button" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
            <span className="sr-only">View apps</span>
            <GridIcon />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
          >
            <span className="sr-only">Toggle theme</span>
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
