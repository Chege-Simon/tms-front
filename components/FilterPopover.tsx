
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FilterIcon } from './icons';
import Button from './Button';

interface FilterPopoverProps<T> {
  // FIX: Changed the type of onFilter to correctly infer the generic type T when a state setter is passed.
  // This resolves incorrect type inference that caused type errors in consumer components.
  onFilter: React.Dispatch<React.SetStateAction<T>>;
  initialFilters: T;
  children: (filters: T, setFilters: React.Dispatch<React.SetStateAction<T>>) => React.ReactNode;
}

const FilterPopover = <T extends Record<string, any>>({ onFilter, initialFilters, children }: FilterPopoverProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(initialFilters);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = Object.values(initialFilters).filter(v => v !== '' && v !== null && v !== undefined).length;
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Reset temp filters to current active filters when opening
    if (!isOpen) {
      setTempFilters(initialFilters);
    }
  };

  const handleApply = () => {
    onFilter(tempFilters);
    setIsOpen(false);
  };
  
  const handleClear = () => {
    const clearedFilters = Object.fromEntries(Object.keys(initialFilters).map(key => [key, ''])) as T;
    setTempFilters(clearedFilters);
    onFilter(clearedFilters);
    setIsOpen(false);
  };
  
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);
  
  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <Button variant="secondary" onClick={handleToggle}>
        <FilterIcon />
        <span className="ml-2">Filter</span>
        {activeFilterCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-indigo-100 bg-indigo-600 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-2xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="p-4 space-y-4">
            {children(tempFilters, setTempFilters)}
          </div>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-2">
            <Button variant="secondary" onClick={handleClear}>Clear</Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPopover;
