import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Expense, Vehicle } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import { notifyWarning } from '../services/notification';

const Expenses: React.FC = () => {
  const { items: expenses, deleteItem, loading, error } = useCrud<Expense>('/expenses');
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');

  const vehicleMap = useMemo(() => {
    return vehicles?.reduce((acc, v) => {
        // FIX: Corrected property access from 'make' to 'brand' and 'license_plate' to 'registration_number' to match the Vehicle type.
        acc[v.id] = `${v.brand} ${v.model} (${v.registration_number})`;
        return acc;
    }, {} as Record<number, string>) || {};
  }, [vehicles]);


  const columns: Column<Expense>[] = useMemo(() => [
    { header: 'Date', accessor: 'date' },
    { header: 'Vehicle', accessor: (exp) => vehicleMap[exp.vehicle_id] || 'N/A' },
    { header: 'Category', accessor: 'category' },
    { header: 'Amount', accessor: (exp) => `KES ${exp.amount.toFixed(2)}` },
    { header: 'Description', accessor: 'description' },
  ], [vehicleMap]);
  
  const handleDelete = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
        deleteItem(id);
    }
  };

  return (
    <>
      <Header title="Expenses">
        <Button onClick={() => notifyWarning('Add new expense functionality not implemented.')}>
          <PlusIcon />
          Add Expense
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={expenses}
        isLoading={loading || vehiclesLoading}
        error={error}
        renderActions={(expense) => (
          <>
            <Button variant="icon" onClick={() => notifyWarning('Edit not implemented.')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(expense.id)}><DeleteIcon /></Button>
          </>
        )}
      />
    </>
  );
};

export default Expenses;