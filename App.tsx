


import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import RouteCharges from './pages/RouteCharges';
import Invoices from './pages/Invoices';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import CreditNotes from './pages/CreditNotes';
import CreditNoteDetail from './pages/credit-notes/CreditNoteDetail';
import CreditNoteCreate from './pages/credit-notes/CreditNoteCreate';
import VehicleTypes from './pages/VehicleTypes';
import Documents from './pages/Documents';
import Expenses from './pages/Expenses';
import Users from './pages/Users';
import Payments from './pages/Payments';
import Journals from './pages/Journals';
import Account from './pages/Account';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/route-charges" element={<RouteCharges />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/invoices/:id/edit" element={<InvoiceCreate />} />
                <Route path="/credit-notes" element={<CreditNotes />} />
                <Route path="/credit-notes/:id" element={<CreditNoteDetail />} />
                <Route path="/credit-notes/:id/edit" element={<CreditNoteCreate />} />
                <Route path="/vehicle-types" element={<VehicleTypes />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/users" element={<Users />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/journals" element={<Journals />} />
                <Route path="/account" element={<Account />} />
                <Route path="/settings" element={<Account />} />
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default App;