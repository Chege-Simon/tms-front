
import React from 'react';
import Header from '../components/Header';
import { TruckIcon, UsersIcon, SteeringWheelIcon, DollarSignIcon } from '../components/icons';
import { useFetch } from '../hooks/useCrud';
import { Vehicle, Customer, Driver, Expense } from '../types';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string; loading: boolean }> = ({ icon, title, value, color, loading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <div className="text-white">{icon}</div>
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      {loading ? (
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      )}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');
  const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');
  const { data: drivers, loading: driversLoading } = useFetch<Driver[]>('/drivers');
  const { data: expenses, loading: expensesLoading } = useFetch<Expense[]>('/expenses');

  const totalExpenses = expenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;

  return (
    <>
      <Header title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<TruckIcon />} title="Total Vehicles" value={vehicles?.length ?? 0} color="bg-blue-500" loading={vehiclesLoading} />
        <StatCard icon={<UsersIcon />} title="Active Customers" value={customers?.length ?? 0} color="bg-green-500" loading={customersLoading} />
        <StatCard icon={<SteeringWheelIcon />} title="Available Drivers" value={drivers?.length ?? 0} color="bg-yellow-500" loading={driversLoading} />
        <StatCard icon={<DollarSignIcon />} title="Total Expenses" value={`KES ${parseFloat(totalExpenses).toFixed(2)}`} color="bg-red-500" loading={expensesLoading} />
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Welcome to FleetFlow</h2>
        <p className="text-gray-600 dark:text-gray-300">
          This is your central hub for managing all aspects of your transport operations. Use the sidebar to navigate between different modules like customers, vehicles, and invoices.
        </p>
      </div>
    </>
  );
};

export default Dashboard;