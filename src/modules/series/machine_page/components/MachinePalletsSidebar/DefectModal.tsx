import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './MachinePalletsSidebar.module.css';
import { DefectPalletPartsDto } from '../../../api/machineApi/machineApi';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (defectData: DefectPalletPartsDto) => Promise<void>;
  palletId: number;
  palletName: string;
  maxQuantity: number;
  machineId?: number;
  stageId: number;
  reportedById: number;
}

const DefectModal: React.FC<DefectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  palletId,
  palletName,
  maxQuantity,
  machineId,
  stageId,
  reportedById
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Сброс формы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0 || quantity > maxQuantity) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const defectData: DefectPalletPartsDto = {
        palletId,
        quantity,
        reportedById,
        stageId,
        ...(description && { description }),
        ...(machineId && { machineId })
      };

      await onSubmit(defectData);
      onClose();
    } catch (error) {
      console.error('Ошибка при отбраковке:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity(0);
    } else {
      const numValue = parseInt(value) || 0;
      setQuantity(Math.min(Math.max(numValue, 0), maxQuantity));
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Отбраковать детали</h3>
          <button 
            className={styles.modalCloseButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.palletInfo}>
              <span>Поддон: <strong>{palletName}</strong></span>
              <span>Доступно: <strong>{maxQuantity} шт.</strong></span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quantity">Количество отбракованных деталей *</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity === 0 ? '' : quantity}
                onChange={handleQuantityChange}
                className={styles.formInput}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Описание брака (опционально)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.formTextarea}
                placeholder="Опишите причину брака..."
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={isSubmitting || quantity <= 0 || quantity > maxQuantity}
            >
              {isSubmitting ? 'Отбраковка...' : 'Отбраковать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DefectModal;