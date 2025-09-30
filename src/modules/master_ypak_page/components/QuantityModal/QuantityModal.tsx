import React, { useState, useEffect } from 'react';
import styles from './QuantityModal.module.css';

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  packageName: string;
  machineName: string;
  maxQuantity: number;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  packageName,
  machineName,
  maxQuantity
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setError('');
    }
  }, [isOpen]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantity(value);
    
    const numValue = parseInt(value);
    if (value && (isNaN(numValue) || numValue <= 0)) {
      setError('Количество должно быть положительным числом');
    } else if (numValue > maxQuantity) {
      setError(`Количество не может превышать ${maxQuantity}`);
    } else {
      setError('');
    }
  };

  const handleConfirm = () => {
    const numQuantity = parseInt(quantity);
    if (!quantity || isNaN(numQuantity) || numQuantity <= 0 || numQuantity > maxQuantity) {
      setError('Введите корректное количество');
      return;
    }
    
    onConfirm(numQuantity);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Назначение на станок</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.info}>
            <p><strong>Упаковка:</strong> {packageName}</p>
            <p><strong>Станок:</strong> {machineName}</p>
            <p><strong>Доступно:</strong> {maxQuantity} шт.</p>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="quantity">Количество для назначения:</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              onKeyDown={handleKeyPress}
              placeholder="Введите количество"
              min="1"
              max={maxQuantity}
              autoFocus
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.confirmButton} 
              onClick={handleConfirm}
              disabled={!!error || !quantity}
            >
              Назначить
            </button>
            <button className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantityModal;