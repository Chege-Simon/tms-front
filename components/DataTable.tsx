import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
}

interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  renderActions: (item: T) => React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
}

const DataTable = <T extends { id: string | number },>({ columns, data, renderActions, isLoading, error }: DataTableProps<T>) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
                <tr>
                    <td colSpan={columns.length + 1} className="text-center py-10 text-gray-500">
                        Loading...
                    </td>
                </tr>
            ) : error ? (
                <tr>
                    <td colSpan={columns.length + 1} className="text-center py-10 text-red-500">
                        Error fetching data: {error.message}
                    </td>
                </tr>
            ) : data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {columns.map((col, index) => (
                    <td key={index} className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 text-sm">
                      <p className="text-gray-900 dark:text-gray-200 whitespace-no-wrap">
                        {typeof col.accessor === 'function'
                          ? col.accessor(item)
                          : String(item[col.accessor as keyof T] ?? '')}
                      </p>
                    </td>
                  ))}
                  <td className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 text-sm text-right">
                    <div className="flex justify-end space-x-2">
                        {renderActions(item)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-10 text-gray-500">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
