import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { BaseEntity } from '../types';

export const useCrud = <T extends BaseEntity>(endpoint: string) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<T[]>(endpoint);
      setItems(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newItem = await api.post<T>(endpoint, item);
      setItems((prevItems) => [...prevItems, newItem]);
    } catch (err) {
      console.error("Failed to add item:", err);
      // Optionally re-throw or handle error state
    }
  };

  const updateItem = async (updatedItem: T) => {
    try {
      const result = await api.put<T>(`${endpoint}/${updatedItem.id}`, updatedItem);
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === updatedItem.id ? result : item))
      );
    } catch (err) {
        console.error("Failed to update item:", err);
    }
  };

  const deleteItem = async (id: number | string) => {
    try {
      await api.del(`${endpoint}/${id}`);
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  return { items, loading, error, addItem, updateItem, deleteItem, refetch: fetchItems };
};

export const useFetch = <T,>(endpoint: string) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<T>(endpoint);
            setData(response);
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