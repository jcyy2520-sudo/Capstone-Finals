import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        <div className="relative z-10 w-full sm:my-8 sm:max-w-lg" onClick={(event) => event.stopPropagation()}>
          <div className="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
            <div className="bg-white px-4 pt-4 pb-3 sm:p-5 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-2 w-full text-center sm:mt-0 sm:text-left">
                  <h3 id="modal-title" className="text-sm font-semibold leading-5 text-gray-900">
                    {title}
                  </h3>
                  <div className="mt-3">{children}</div>
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-0 hidden pt-3 pr-3 sm:block">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
