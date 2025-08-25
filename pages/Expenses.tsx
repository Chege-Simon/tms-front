import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Expense, Vehicle } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const Expenses: React.FC = () => {
  const { items: expenses, deleteItem, loading, error } = useCrud<Expense>('/expenses');
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');

  const vehicleMap = useMemo(() => {
    return vehicles?.reduce((acc, v) => {
        acc[v.id] = `${v.make} ${v.model} (${v.license_plate})`;
        return acc;
    }, {} as Record<number, string>) || {};
  }, [vehicles]);


  const columns: Column<Expense>[] = useMemo(() => [
    { header: 'Date', accessor: 'date' },
    { header: 'Vehicle', accessor: (exp) => vehicleMap[exp.vehicle_id] || 'N/A' },
    { header: 'Category', accessor: 'category' },
    { header: 'Amount', accessor: (exp) => `$${exp.amount.toFixed(2)}` },
    { header: 'Description', accessor: 'description' },
  ], [vehicleMap]);

  return (
    <>
      <Header title="Expenses">
        <Button onClick={() => alert('Add new expense functionality not implemented.')}>
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
            <Button variant="icon" onClick={() => alert('Edit not implemented.')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(expense.id)}><DeleteIcon /></Button>
          </>
        )}
      />
    </>
  );
};

export default Expenses;