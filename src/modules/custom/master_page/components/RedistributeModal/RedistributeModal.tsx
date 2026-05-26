import React, { useState, useEffect } from 'react';
import { useCustomPallets } from '../../../../hooks/custom';
import styles from './RedistributeModal.module.css';

interface Part {
  customPartId: number;
  partCode: string;
  partName: string;
  materialName: string;
  quantityOnPallet: number;
  finishedLength: number;
  finishedWidth: number;
}

interface Pallet {
  customPalletId: number;
  palletName: string;
  parts: any[];
}

interface RedistributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePallets: Pallet[];
  onRedistribute: (fromPalletId: number, toPalletId: number, parts: { customPartId: number; quantity: number }[]) => void;
}

const RedistributeModal: React.FC<RedistributeModalProps> = ({
  isOpen,
  onClose,
  availablePallets,
  onRedistribute
}) => {
  const [step, setStep] = useState<'selectFrom' | 'selectParts' | 'selectTo'>('selectFrom');
  const [fromPalletId, setFromPalletId] = useState<number | null>(null);
  const [toPalletId, setToPalletId] = useState<number | null>(null);
  const [palletParts, setPalletParts] = useState<Part[]>([]);
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  const [partQuantities, setPartQuantities] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);
  
  const { fetchPalletParts } = useCustomPallets();

  useEffect(() => {
    if (isOpen) {
      setStep('selectFrom');
      setFromPalletId(null);
      setToPalletId(null);
      setPalletParts([]);
      setSelectedParts([]);
      setPartQuantities({});
    }
  }, [isOpen]);

  const handleSelectFromPallet = async (palletId: number) => {
    setFromPalletId(palletId);
    setLoading(true);
    try {
      const details = await fetchPalletParts(palletId);
      setPalletParts(details.parts);
      
      // Выбираем все детали по умолчанию
      const allPartIds = details.parts.map((p: Part) => p.customPartId);
      setSelectedParts(allPartIds);
      
      // Устанавливаем количество по умолчанию
      const quantities: { [key: number]: number } = {};
      details.parts.forEach((p: Part) => {
        quantities[p.customPartId] = p.quantityOnPallet;
      });
      setPartQuantities(quantities);
      
      setStep('selectParts');
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePart = (partId: number, maxQuantity: number) => {
    if (selectedParts.includes(partId)) {
      setSelectedParts(selectedParts.filter(id => id !== partId));
      const newQuantities = { ...partQuantities };
      delete newQuantities[partId];
      setPartQuantities(newQuantities);
    } else {
      setSelectedParts([...selectedParts, partId]);
      setPartQuantities({ ...partQuantities, [partId]: maxQuantity });
    }
  };

  const handleQuantityChange = (partId: number, value: string, maxQuantity: number) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.min(Math.max(1, numValue), maxQuantity);
    setPartQuantities({ ...partQuantities, [partId]: clampedValue });
  };

  const handleNextToSelectTarget = () => {
    if (selectedParts.length === 0) return;
    setStep('selectTo');
  };

  const handleSelectToPallet = (palletId: number) => {
    setToPalletId(palletId);
  };

  const handleRedistribute = () => {
    if (!fromPalletId || !toPalletId || selectedParts.length === 0) return;
    
    const parts = selectedParts.map(partId => ({
      customPartId: partId,
      quantity: partQuantities[partId]
    }));

    onRedistribute(fromPalletId, toPalletId, parts);
  };

  const handleBack = () => {
    if (step === 'selectParts') {
      setStep('selectFrom');
      setFromPalletId(null);
      setPalletParts([]);
      setSelectedParts([]);
      setPartQuantities({});
    } else if (step === 'selectTo') {
      setStep('selectParts');
      setToPalletId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Перераспределить детали</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {step === 'selectFrom' && (
            <div className={styles.palletSelection}>
              <h4>Шаг 1: Выберите поддон, с которого будем забирать детали:</h4>
              <div className={styles.palletList}>
                {availablePallets.map(pallet => (
                  <div
                    key={pallet.customPalletId}
                    className={`${styles.palletItem} ${fromPalletId === pallet.customPalletId ? styles.selected : ''}`}
                    onClick={() => handleSelectFromPallet(pallet.customPalletId)}
                  >
                    <div className={styles.palletName}>{pallet.palletName}</div>
                    <div className={styles.palletInfo}>Деталей: {pallet.parts.length}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'selectParts' && (
            <>
              <div className={styles.backButton} onClick={handleBack}>
                ← Назад к выбору поддона
              </div>
              <div className={styles.partsSection}>
                <h4>Шаг 2: Выберите детали для перемещения:</h4>
                {loading ? (
                  <div className={styles.loadingMessage}>Загрузка деталей...</div>
                ) : (
                  <table className={styles.partsTable}>
                    <thead>
                      <tr>
                        <th>Артикул</th>
                        <th>Название</th>
                        <th>Материал</th>
                        <th>Размер</th>
                        <th>На поддоне</th>
                        <th>Переместить</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {palletParts.map(part => (
                        <tr 
                          key={part.customPartId}
                          className={selectedParts.includes(part.customPartId) ? styles.selected : ''}
                          onClick={() => handleTogglePart(part.customPartId, part.quantityOnPallet)}
                        >
                          <td>{part.partCode}</td>
                          <td>{part.partName}</td>
                          <td>{part.materialName}</td>
                          <td>{part.finishedLength} x {part.finishedWidth}</td>
                          <td>{part.quantityOnPallet}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              className={styles.quantityInput}
                              min="1"
                              max={part.quantityOnPallet}
                              value={partQuantities[part.customPartId] || part.quantityOnPallet}
                              onChange={(e) => handleQuantityChange(part.customPartId, e.target.value, part.quantityOnPallet)}
                              disabled={!selectedParts.includes(part.customPartId)}
                            />
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className={styles.partCheckbox}
                              checked={selectedParts.includes(part.customPartId)}
                              onChange={() => handleTogglePart(part.customPartId, part.quantityOnPallet)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {step === 'selectTo' && (
            <>
              <div className={styles.backButton} onClick={handleBack}>
                ← Назад к выбору деталей
              </div>
              <div className={styles.palletSelection}>
                <h4>Шаг 3: Выберите целевой поддон:</h4>
                <div className={styles.palletList}>
                  {availablePallets
                    .filter(p => p.customPalletId !== fromPalletId)
                    .map(pallet => (
                      <div
                        key={pallet.customPalletId}
                        className={`${styles.palletItem} ${toPalletId === pallet.customPalletId ? styles.selected : ''}`}
                        onClick={() => handleSelectToPallet(pallet.customPalletId)}
                      >
                        <div className={styles.palletName}>{pallet.palletName}</div>
                        <div className={styles.palletInfo}>Деталей: {pallet.parts.length}</div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          {step === 'selectParts' && (
            <button
              className={styles.redistributeButton}
              onClick={handleNextToSelectTarget}
              disabled={selectedParts.length === 0}
            >
              Далее
            </button>
          )}
          {step === 'selectTo' && (
            <button
              className={styles.redistributeButton}
              onClick={handleRedistribute}
              disabled={!toPalletId}
            >
              Переместить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedistributeModal;
