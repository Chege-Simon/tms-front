
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { WarningIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <WarningIcon />
        </div>
        <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                {title}
            </h3>
            <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message}
                </p>
            </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <Button
          type="button"
          variant="danger"
          className="w-full sm:col-start-2"
          onClick={onConfirm}
        >
          Confirm
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full sm:col-start-1 sm:mt-0"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
