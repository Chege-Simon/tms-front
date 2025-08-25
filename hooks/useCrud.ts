import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { BaseEntity } from '../types';

interface PaginationLinks {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
}

interface PaginationMeta {
    current_page?: number;
    from?: number;
    last_page?: number;
    path?: string;
    per_page?: number;
    to?: number;
    total?: number;
}

interface PaginatedResponse<T> {
    data: T[];
    links: PaginationLinks;
    meta: PaginationMeta;
}

export const useCrud = <T extends BaseEntity>(endpoint: string) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{ links: PaginationLinks, meta: Partial<PaginationMeta> }>({ links: {}, meta: {} });
  const [lastUrl, setLastUrl] = useState(endpoint);

  const fetchItems = useCallback(async (url: string = endpoint) => {
    setLoading(true);
    setError(null);
    setLastUrl(url);
    try {
      // api.get() now returns the unwrapped payload directly.
      const payload = await api.get<PaginatedResponse<T> | T[]>(url);
      
      if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as PaginatedResponse<T>).data)) {
        // It's a paginated response
        const paginatedPayload = payload as PaginatedResponse<T>;
        setItems(paginatedPayload.data);
        setPagination({ links: paginatedPayload.links, meta: paginatedPayload.meta });
      } else if (Array.isArray(payload)) {
        // It's a simple array response
        setItems(payload);
        setPagination({ links: {}, meta: {} });
      } else {
        setItems([]);
        setPagination({ links: {}, meta: {} });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems(endpoint);
  }, [fetchItems, endpoint]);

  const addItem = async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await api.post<T>(endpoint, item);
      await fetchItems(endpoint); // Refetch first page to get latest data
    } catch (err) {
      console.error("Failed to add item:", err);
      // Optionally re-throw or handle error state
    }
  };

  const updateItem = async (updatedItem: T) => {
    try {
      await api.put<T>(`${endpoint}/${updatedItem.id}`, updatedItem);
      await fetchItems(lastUrl); // Refetch current page
    } catch (err) {
        console.error("Failed to update item:", err);
    }
  };

  const deleteItem = async (id: number | string) => {
    try {
      await api.del(`${endpoint}/${id}`);
      await fetchItems(lastUrl); // Refetch current page
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  return { items, loading, error, pagination, addItem, updateItem, deleteItem, refetch: fetchItems };
};

export const useFetch = <T,>(endpoint: string) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // api.get() now returns the unwrapped data directly.
            const responseData = await api.get<T>(endpoint);
            setData(responseData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};