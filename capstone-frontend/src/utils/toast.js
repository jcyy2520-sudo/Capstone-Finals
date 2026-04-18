import toast from 'react-hot-toast';

export const showSuccess = (message) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ecfdf5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  });
};

export const showError = (message) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  });
};

export const showLoading = (message) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export default {
  success: showSuccess,
  error: showError,
  loading: showLoading,
  dismiss: dismissToast,
};
