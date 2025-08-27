import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatBreadcrumb = (str: string) => {
    // Replace hyphens with spaces and capitalize
    return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // A simple check to see if a string looks like a UUID or a long ID
  const isId = (s: string) => /^[a-f0-9-]{10,}$/i.test(s) || /^\d{5,}$/.test(s);

  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <li>
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Don't make breadcrumbs for IDs, but show the previous segment
          if (isId(value)) {
            return null;
          }
          
          // Special case for 'edit' to improve readability
          const breadcrumbText = value.toLowerCase() === 'edit' ? 'Edit ' + formatBreadcrumb(pathnames[index-1] || '').slice(0, -1) : formatBreadcrumb(value);


          return (
            <li key={to} className="flex items-center">
              <span className="mx-2">/</span>
              {last ? (
                <span className="text-gray-700 dark:text-gray-200 font-medium">{breadcrumbText}</span>
              ) : (
                <Link to={to} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {breadcrumbText}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
