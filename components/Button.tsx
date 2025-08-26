
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';
  
  const variantClasses = {
    primary: 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-indigo-800',
    secondary: 'text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-300 dark:focus:ring-red-800',
    icon: 'bg-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 p-2 rounded-lg'
  };

  const sizeClasses = variant === 'icon' ? 'p-2' : 'px-5 py-2.5 text-sm';

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
