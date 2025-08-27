import React, { useState, useEffect } from 'react';
import type { Document } from '../types';
import { useFetch } from '../hooks/useCrud';
import api from '../services/api';
import { notifySuccess, notifyError } from '../services/notification';
import Button from './Button';
import { DeleteIcon } from './icons';
import Input from './Input';
import { formatDateForApi } from '../services/datetime';

interface EntityDocumentManagerProps {
  entityId: string | number;
  entityTypeForUpload: Document['file_type'];
  label: string;
}

const EntityDocumentManager: React.FC<EntityDocumentManagerProps> = ({ entityId, entityTypeForUpload, label }) => {
  // Inefficient: Fetches all documents. Ideally, the API would provide a filtered endpoint.
  const { data: allDocuments, loading, error, refetch } = useFetch<Document[]>('/documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (allDocuments) {
      const filteredDocs = allDocuments.filter(doc => doc.documentable?.id === entityId);
      setDocuments(filteredDocs);
    }
  }, [allDocuments, entityId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      notifyError('Please select a file to upload.');
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', entityTypeForUpload);
    formData.append('upload_date', formatDateForApi(new Date().toISOString()));
    // Backend controller requires a `file_path` field, which is illogical for an upload.
    // Sending a dummy value to pass validation, assuming backend will ignore it and use the uploaded file.
    formData.append('file_path', 'dummy.path'); 

    try {
      await api.postForm(`/documents/${entityId}`, formData);
      notifySuccess('Document uploaded successfully.');
      setFile(null);
      // Reset the file input visually
      const fileInput = document.getElementById(`file-upload-input-${entityId}`) as HTMLInputElement;
      if(fileInput) fileInput.value = '';
      refetch(); // Refetch all documents to see the new one
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload document.';
      notifyError(message);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDelete = async (docId: string | number) => {
      if (window.confirm('Are you sure you want to delete this document?')) {
          try {
              await api.del(`/documents/${docId}`);
              notifySuccess('Document deleted.');
              refetch();
          } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete document.';
              notifyError(message);
          }
      }
  };

  return (
    <div className="space-y-4 pt-4 border-t dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{label}</h3>
      {loading && <p>Loading documents...</p>}
      {error && <p className="text-red-500">Error loading documents.</p>}
      
      {/* Document List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {documents.length > 0 ? (
          documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-gray-700/50">
              <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                {doc.code} - {new Date(doc.upload_date).toLocaleDateString()}
              </a>
              <Button variant="icon" onClick={() => handleDelete(doc.id)}><DeleteIcon /></Button>
            </div>
          ))
        ) : (
          !loading && <p className="text-sm text-gray-500">No documents found.</p>
        )}
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="flex items-end gap-4">
        <div className="flex-grow">
            <Input 
                id={`file-upload-input-${entityId}`}
                label={`Upload New ${entityTypeForUpload.replace(/_/g, ' ')}`}
                type="file" 
                onChange={handleFileChange}
            />
        </div>
        <Button type="submit" disabled={isUploading || !file}>
            {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </form>
    </div>
  );
};

export default EntityDocumentManager;
