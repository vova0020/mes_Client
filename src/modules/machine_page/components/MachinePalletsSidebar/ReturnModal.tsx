import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './MachinePalletsSidebar.module.css';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quantity: number) => Promise<void>;
  palletId: number;
  palletName: string;
  maxQuantity: number;
}

const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  palletId,
  palletName,
  maxQuantity
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(quantity);
    
    if (isNaN(qty) || qty <= 0) {
      setError('Введите корректное количество деталей');
      return;
    }

    if (qty > maxQuantity) {
      setError(`Количество не может превышать ${maxQuantity}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(qty);
      onClose();
    } catch (error) {
      console.error('Ошибка при возврате деталей:', error);
      setError((error as Error).message || 'Не удалось вернуть детали');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantity(value);
    setError(null);
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
          <h3>Вернуть детали в производство</h3>
          <button 
            className={styles.modalCloseButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalField}>
            <label>Поддон:</label>
            <span className={styles.modalFieldValue}>{palletName}</span>
          </div>

          <div className={styles.modalField}>
            <label htmlFor="returnQuantity">Количество деталей для возврата:</label>
            <input
              id="returnQuantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              className={styles.modalInput}
              disabled={isSubmitting}
              required
            />
            <span className={styles.modalFieldHint}>Максимум: {maxQuantity}</span>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

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
              className={styles.createButton}
              disabled={isSubmitting || !quantity}
            >
              {isSubmitting ? 'Возврат...' : 'Вернуть'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReturnModal;
