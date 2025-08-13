import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './PalletsSidebar.module.css';
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
          <h3>Отбраковка деталей</h3>
          <button className={styles.modalCloseButton} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalField}>
            <label>Поддон:</label>
            <span className={styles.modalFieldValue}>{palletName}</span>
          </div>

          <div className={styles.modalField}>
            <label htmlFor="quantity">Количество для отбраковки:</label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity === 0 ? '' : quantity}
              onChange={handleQuantityChange}
              className={styles.modalInput}
              disabled={isSubmitting}
              required
            />
            <span className={styles.modalFieldHint}>Максимум: {maxQuantity}</span>
          </div>

          <div className={styles.modalField}>
            <label htmlFor="description">Описание брака (необязательно):</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.modalTextarea}
              placeholder="Опишите причину отбраковки..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCancelButton}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.modalSubmitButton}
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