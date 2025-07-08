import React from 'react';
import {
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Detail } from '../../../api/detailsApi/detailsApi';
import styles from './DeleteConfirmModal.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  detail: Detail | null;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  detail,
  isLoading = false
}) => {
  if (!isOpen || !detail) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Ошибка при удалении детали:', error);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <ExclamationTriangleIcon className={styles.warningIcon} />
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <XMarkIcon className={styles.icon} />
          </button>
        </div>

        <div className={styles.content}>
          <h2>Подтверждение удаления</h2>
          <p>
            Вы уверены, что хотите удалить деталь <strong>"{detail.partName}"</strong> 
            с артикулом <strong>{detail.partSku}</strong>?
          </p>
          <div className={styles.warning}>
            <ExclamationTriangleIcon className={styles.warningIconSmall} />
            <span>Это действие нельзя отменить. Деталь будет удалена навсегда.</span>
          </div>
          
          <div className={styles.detailInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Артикул:</span>
              <span className={styles.value}>{detail.partSku}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Наименование:</span>
              <span className={styles.value}>{detail.partName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Материал:</span>
              <span className={styles.value}>{detail.materialName}</span>
            </div>
            {detail.quantity && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Количество:</span>
                <span className={styles.value}>{detail.quantity}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={styles.deleteButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Удаление...
              </>
            ) : (
              <>
                <TrashIcon className={styles.icon} />
                Удалить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};