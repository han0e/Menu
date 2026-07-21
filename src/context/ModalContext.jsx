import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomModal from '../components/CustomModal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = useCallback((title, message, onConfirm = null) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm,
      onCancel: null,
    });
  }, []);

  const showConfirm = useCallback((title, message, onConfirm = null, onCancel = null) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm,
      onCancel,
    });
  }, []);

  const close = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, close }}>
      {children}
      {modalConfig.isOpen && (
        <CustomModal 
          {...modalConfig} 
          onClose={close}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
