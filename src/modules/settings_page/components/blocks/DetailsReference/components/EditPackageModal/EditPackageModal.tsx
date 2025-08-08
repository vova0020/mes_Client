import React, { useState, useEffect } from 'react';
import styles from './EditPackageModal.module.css';

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (packageCode: string, packageName: string) => void;
  initialData?: {
    code: string;
    name: string;
  };
}

export const EditPackageModal: React.FC<EditPackageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [packageCode, setPackageCode] = useState('');
  const [packageName, setPackageName] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setPackageCode(initialData.code);
      setPackageName(initialData.name);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(packageCode, packageName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Редактирование упаковки</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="packageCode">Артикул:</label>
            <input
              id="packageCode"
              type="text"
              value={packageCode}
              onChange={(e) => setPackageCode(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="packageName">Название:</label>
            <input
              id="packageName"
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.saveButton}>
              Сохранить
            </button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
