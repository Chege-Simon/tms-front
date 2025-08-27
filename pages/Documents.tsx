
import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Document, Driver, Vehicle } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const Documents: React.FC = () => {
  const { items: documents, deleteItem, loading, error } = useCrud<Document>('/documents');
  const { data: drivers, loading: driversLoading } = useFetch<Driver[]>('/drivers');
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Document['id'] | null>(null);
  
  const ownerMap = useMemo(() => {
    const map: Record<string, string> = {};
    drivers?.forEach(d => map[`driver-${d.id}`] = `Driver: ${d.name}`);
    // FIX: Corrected property access from 'make' to 'brand' to match the Vehicle type.
    vehicles?.forEach(v => map[`vehicle-${v.id}`] = `Vehicle: ${v.brand} ${v.model}`);
    return map;
  }, [drivers, vehicles]);
  
  // This is a guess. The API needs to tell us the owner type.
  // Assuming a convention here, but this is brittle.
  const getOwnerName = (doc: Document) => {
    const driver = drivers?.find(d => d.id === doc.owner_id);
    if(driver) return `Driver: ${driver.name}`;

    const vehicle = vehicles?.find(v => v.id === doc.owner_id);
    // FIX: Corrected property access from 'make' to 'brand' to match the Vehicle type.
    if(vehicle) return `Vehicle: ${vehicle.brand} ${vehicle.model}`;

    return 'N/A';
  }
  
  const handleDelete = (id: string | number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
        await deleteItem(itemToDelete);
        setItemToDelete(null);
        setIsConfirmModalOpen(false);
    }
  };

  const columns: Column<Document>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    { header: 'Owner', accessor: (doc) => getOwnerName(doc) },
    { header: 'Expiry Date', accessor: 'expiry_date' },
    { header: 'File', accessor: (doc) => <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View</a> },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [drivers, vehicles]);
  
  return (
    <>
      <Header title="Documents">
        <Button onClick={() => alert('Add new document functionality not implemented.')}>
          <PlusIcon />
          Add Document
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={documents}
        isLoading={loading || driversLoading || vehiclesLoading}
        error={error}
        renderActions={(document) => (
          <>
            <Button variant="icon" onClick={() => alert('Edit not implemented')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(document.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this document? This action cannot be undone."
      />
    </>
  );
};

export default Documents;
