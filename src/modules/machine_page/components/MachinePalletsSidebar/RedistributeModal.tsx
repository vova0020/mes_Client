import React, { useState, useEffect } from 'react';
import styles from './MachinePalletsSidebar.module.css';
import { ProductionPallet } from '../../../api/machineApi/machinProductionPalletsService';
import { PartDistribution } from '../../../api/machineApi/machineApi';

interface RedistributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pallet: ProductionPallet;
  existingPallets: ProductionPallet[];
  onRedistribute: (distributions: PartDistribution[], machineId?: number) => Promise<void>;
  isProcessing: boolean;
}

interface Distribution {
  id: string;
  targetPalletId?: number;
  quantity: number | '';
  palletName?: string;
  isNewPallet: boolean;
}

const RedistributeModal: React.FC<RedistributeModalProps> = ({
  isOpen,
  onClose,
  pallet,
  existingPallets,
  onRedistribute,
  isProcessing
}) => {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Инициализация с одним распределением
  useEffect(() => {
    if (isOpen) {
      setDistributions([{
        id: '1',
        quantity: 1,
        isNewPallet: true,
        palletName: `${pallet.name}-1`
      }]);
      setErrorMessage(null);
    }
  }, [isOpen, pallet]);

  // Добавить новое распределение
  const addDistribution = () => {
    const newId = (distributions.length + 1).toString();
    setDistributions(prev => [...prev, {
      id: newId,
      quantity: 1,
      isNewPallet: true,
      palletName: `${pallet.name}-${newId}`
    }]);
  };

  // Удалить распределение
  const removeDistribution = (id: string) => {
    if (distributions.length > 1) {
      setDistributions(prev => prev.filter(d => d.id !== id));
    }
  };

  // Обновить распределение
  const updateDistribution = (id: string, updates: Partial<Distribution>) => {
    setDistributions(prev => prev.map(d => 
      d.id === id ? { ...d, ...updates } : d
    ));
  };

  // Валидация
  const validate = (): string | null => {
    const totalQuantity = distributions.reduce((sum, d) => sum + (typeof d.quantity === 'number' ? d.quantity : 0), 0);
    
    if (totalQuantity > pallet.quantity) {
      return `Общее количество не может превышать ${pallet.quantity}`;
    }

    for (const dist of distributions) {
      if (dist.quantity === '' || (typeof dist.quantity === 'number' && dist.quantity <= 0)) {
        return 'Количество должно быть больше 0';
      }
      
      if (dist.isNewPallet && !dist.palletName?.trim()) {
        return 'Укажите название для нового поддона';
      }
      
      if (!dist.isNewPallet && !dist.targetPalletId) {
        return 'Выберите существующий поддон';
      }
    }

    return null;
  };

  // Получаем machineId из localStorage
  const getMachineIdFromStorage = (): number | undefined => {
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (!assignmentsData) return undefined;
      
      const data = JSON.parse(assignmentsData);
      return data.machines?.[0]?.id;
    } catch (error) {
      console.error('Ошибка при получении machineId из localStorage:', error);
      return undefined;
    }
  };

  // Обработка отправки
  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setErrorMessage(null);
      
      const apiDistributions: PartDistribution[] = distributions.map(d => ({
        targetPalletId: d.isNewPallet ? undefined : d.targetPalletId,
        quantity: typeof d.quantity === 'number' ? d.quantity : 0,
        palletName: d.isNewPallet ? d.palletName : undefined
      }));

      await onRedistribute(apiDistributions, getMachineIdFromStorage());
      onClose();
    } catch (error) {
      setErrorMessage('Ошибка при перераспределении деталей');
    }
  };

  if (!isOpen) return null;

  const availablePallets = existingPallets.filter(p => p.id !== pallet.id);

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className={styles.redistributeModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Перераспределить детали</h3>
          <button 
            className={styles.modalCloseButton}
            onClick={onClose}
            disabled={isProcessing}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.palletInfo}>
            <span>Поддон: <strong>{pallet.name}</strong></span>
            <span>Количество: <strong>{pallet.quantity} шт.</strong></span>
          </div>

          <div className={styles.distributionsContainer}>
            {distributions.map((dist, index) => (
              <div key={dist.id} className={styles.distributionRow}>
                <div className={styles.distributionHeader}>
                  <span>Распределение {index + 1}</span>
                  {distributions.length > 1 && (
                    <button
                      className={styles.removeDistributionButton}
                      onClick={() => removeDistribution(dist.id)}
                      disabled={isProcessing}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className={styles.distributionFields}>
                  <div className={styles.formGroup}>
                    <label>Количество деталей</label>
                    <input
                      type="number"
                      min="1"
                      max={pallet.quantity}
                      value={dist.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? '' : Math.min(parseInt(value) || 0, pallet.quantity);
                        updateDistribution(dist.id, { quantity: numValue as number });
                      }}
                      disabled={isProcessing}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="radio"
                        checked={dist.isNewPallet}
                        onChange={() => updateDistribution(dist.id, { 
                          isNewPallet: true, 
                          targetPalletId: undefined 
                        })}
                        disabled={isProcessing}
                      />
                      Создать новый поддон
                    </label>
                    {dist.isNewPallet && (
                      <input
                        type="text"
                        placeholder="Название поддона"
                        value={dist.palletName || ''}
                        onChange={(e) => updateDistribution(dist.id, { 
                          palletName: e.target.value 
                        })}
                        disabled={isProcessing}
                        className={styles.formInput}
                      />
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="radio"
                        checked={!dist.isNewPallet}
                        onChange={() => updateDistribution(dist.id, { 
                          isNewPallet: false, 
                          palletName: undefined 
                        })}
                        disabled={isProcessing}
                      />
                      Добавить к существующему поддону
                    </label>
                    {!dist.isNewPallet && (
                      <select
                        value={dist.targetPalletId || ''}
                        onChange={(e) => updateDistribution(dist.id, { 
                          targetPalletId: parseInt(e.target.value) || undefined 
                        })}
                        disabled={isProcessing}
                        className={styles.formInput}
                      >
                        <option value="">Выберите поддон</option>
                        {availablePallets.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.quantity} шт.)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className={styles.addDistributionButton}
            onClick={addDistribution}
            disabled={isProcessing}
          >
            + Добавить распределение
          </button>

          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isProcessing}
          >
            Отмена
          </button>
          <button 
            className={styles.createButton}
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? 'Перераспределение...' : 'Перераспределить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedistributeModal;