
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { BaseEntity } from '../types';
import { notifySuccess, notifyError } from '../services/notification';

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

interface OldPaginatedResponse<T> {
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
      let relativeUrl = url;
      // Handle absolute URLs from pagination links by converting them to relative paths
      if (url.startsWith('http')) {
        try {
          const urlObject = new URL(url);
          relativeUrl = urlObject.pathname + urlObject.search;
        } catch (e) {
          console.error('Invalid pagination URL:', url);
          // Fallback or error handling
        }
      }
      
      const payload: any = await api.get(relativeUrl);
      
      // New paginated structure: { status, data: { data: [], ... }, message }
      if (payload && payload.data && payload.data.data && Array.isArray(payload.data.data)) {
        const paginatedData = payload.data;
        setItems(paginatedData.data);
        setPagination({
            links: {
                first: paginatedData.first_page_url,
                last: paginatedData.last_page_url,
                prev: paginatedData.prev_page_url,
                next: paginatedData.next_page_url,
            },
            meta: {
                current_page: paginatedData.current_page,
                from: paginatedData.from,
                last_page: paginatedData.last_page,
                path: paginatedData.path,
                per_page: paginatedData.per_page,
                to: paginatedData.to,
                total: paginatedData.total,
            }
        });
      } else if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as OldPaginatedResponse<T>).data)) {
        // It's an old-style paginated response
        const paginatedPayload = payload as OldPaginatedResponse<T>;
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
      notifySuccess('Item added successfully.');
      await fetchItems(endpoint); // Refetch first page to get latest data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item.';
      notifyError(message);
      console.error("Failed to add item:", err);
    }
  };

  const updateItem = async (updatedItem: T) => {
    try {
      await api.put<T>(`${endpoint}/${updatedItem.id}`, updatedItem);
      notifySuccess('Item updated successfully.');
      await fetchItems(lastUrl); // Refetch current page
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update item.';
        notifyError(message);
        console.error("Failed to update item:", err);
    }
  };

  const deleteItem = async (id: number | string) => {
    try {
      await api.del(`${endpoint}/${id}`);
      notifySuccess('Item deleted successfully.');
      await fetchItems(lastUrl); // Refetch current page
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item.';
      notifyError(message);
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
        setError(null);
        try {
            const responseData: any = await api.get(endpoint);
            
            // New paginated structure: { data: { data: [...] } }
            if (responseData && responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
                setData(responseData.data.data as T);
            }
            // Old paginated structure: { data: [...] }
            else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
                setData(responseData.data as T);
            } 
            // Simple response (array or object)
            else {
                setData(responseData as T);
            }
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