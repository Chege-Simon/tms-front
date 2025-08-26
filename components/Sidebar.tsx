
import React from 'react';
import { NavLink } from 'react-router-dom';
import { TruckIcon as AppIcon, DashboardIcon, UsersIcon, SteeringWheelIcon, RouteIcon, FileTextIcon, CreditCardIcon, FileMinusIcon, CarIcon, DollarSignIcon, BookIcon } from './icons';

const navLinks = [
  { to: "/dashboard", icon: <DashboardIcon />, label: "Dashboard" },
  { to: "/customers", icon: <UsersIcon />, label: "Customers" },
  { to: "/vehicles", icon: <AppIcon />, label: "Vehicles" },
  { to: "/drivers", icon: <SteeringWheelIcon />, label: "Drivers" },
  { to: "/route-charges", icon: <RouteIcon />, label: "Route Charges" },
  { to: "/invoices", icon: <FileTextIcon />, label: "Invoices" },
  { to: "/credit-notes", icon: <FileMinusIcon />, label: "Credit Notes" },
  { to: "/vehicle-types", icon: <CarIcon />, label: "Vehicle Types" },
  { to: "/documents", icon: <CreditCardIcon />, label: "Documents" },
  { to: "/expenses", icon: <DollarSignIcon />, label: "Expenses" },
  { to: "/payments", icon: <CreditCardIcon />, label: "Payments" },
  { to: "/journals", icon: <BookIcon />, label: "Journals" },
  { to: "/users", icon: <UsersIcon />, label: "Users" },
];

const Sidebar: React.FC = () => {
  const linkClasses = "flex items-center px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200";
  const activeLinkClasses = "bg-gray-700 text-white";

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 dark:bg-gray-900/50 p-4 flex flex-col">
      <div className="flex items-center mb-8 px-4">
        <AppIcon />
        <h1 className="text-xl font-bold text-white ml-3">FleetFlow</h1>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            {link.icon}
            <span className="ml-4">{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="text-center mt-4 text-xs text-gray-500">© 2024 FleetFlow Inc.</div>
      </div>
    </aside>
  );
};

export default Sidebar;