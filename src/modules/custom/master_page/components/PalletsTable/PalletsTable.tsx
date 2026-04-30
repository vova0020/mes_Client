import React, { useState, useEffect } from 'react';
import styles from './PalletsTable.module.css';
import PalletsSidebar from '../PalletsSidebar/PalletsSidebar';

interface Pallet {
  id: number;
  palletNumber: string;
  parts: Part[];
  materials: string;
  address: string;
  status: string;
  machine: string;
}

interface Part {
  id: number;
  articleNumber: string;
  name: string;
  quantity: number;
  material: string;
  size: string;
  substage: string;
  readyForProcessing: number;
  completed: number;
  status: string;
}

interface PalletsTableProps {
  selectedOrderId: number | null;
  onShowParts: (palletId: number) => void;
}

const MOCK_PARTS_FOR_ORDER: { [key: number]: Part[] } = {
  1: [
    { id: 1, articleNumber: 'ART-001', name: 'Деталь А', quantity: 50, material: 'Сталь 45', size: '100x50x20', substage: 'Фрезеровка', readyForProcessing: 50, completed: 0, status: 'Готово к обработке' },
    { id: 2, articleNumber: 'ART-002', name: 'Деталь Б', quantity: 30, material: 'Алюминий', size: '80x40x15', substage: 'Токарная', readyForProcessing: 30, completed: 0, status: 'Готово к обработке' },
    { id: 3, articleNumber: 'ART-003', name: 'Деталь В', quantity: 20, material: 'Чугун', size: '120x60x25', substage: 'Сверление', readyForProcessing: 20, completed: 0, status: 'Готово к обработке' },
  ],
  2: [
    { id: 4, articleNumber: 'ART-004', name: 'Деталь Г', quantity: 40, material: 'Бронза', size: '90x45x18', substage: 'Шлифовка', readyForProcessing: 40, completed: 0, status: 'Готово к обработке' },
    { id: 5, articleNumber: 'ART-005', name: 'Деталь Д', quantity: 25, material: 'Медь', size: '70x35x12', substage: 'Фрезеровка', readyForProcessing: 25, completed: 0, status: 'Готово к обработке' },
  ],
  3: [
    { id: 6, articleNumber: 'ART-006', name: 'Деталь Е', quantity: 35, material: 'Сталь 40Х', size: '110x55x22', substage: 'Токарная', readyForProcessing: 35, completed: 0, status: 'Готово к обработке' },
  ],
};

const PalletsTable: React.FC<PalletsTableProps> = ({ selectedOrderId, onShowParts }) => {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);

  useEffect(() => {
    if (selectedOrderId) {
      setAvailableParts(MOCK_PARTS_FOR_ORDER[selectedOrderId] || []);
      setPallets([]);
    }
  }, [selectedOrderId]);

  const handleCreatePallet = () => {
    if (selectedParts.length === 0) return;

    const selectedPartsList = availableParts.filter(p => selectedParts.includes(p.id));
    const materials = [...new Set(selectedPartsList.map(p => p.material))].join(', ');

    console.log('Selected parts IDs:', selectedParts);
    console.log('Available parts:', availableParts);
    console.log('Filtered parts list:', selectedPartsList);

    const newPallet: Pallet = {
      id: Date.now(),
      palletNumber: `ПОД-${pallets.length + 1}`,
      parts: [...selectedPartsList],
      materials: materials,
      address: 'Не назначен',
      status: 'Создан',
      machine: 'Не назначен',
    };

    console.log('New pallet parts:', newPallet.parts);
    console.log('New pallet parts length:', newPallet.parts.length);
    console.log('New pallet created:', newPallet);

    setPallets([...pallets, newPallet]);
    setShowCreateModal(false);
    setSelectedParts([]);
  };

  const handleStartWork = (palletId: number) => {
    console.log('Starting work on pallet:', palletId);
    setPallets(pallets.map(p => 
      p.id === palletId ? { ...p, status: 'В работе' } : p
    ));
  };

  const handleCompleteWork = (palletId: number) => {
    console.log('Completing work on pallet:', palletId);
    setPallets(pallets.map(p => 
      p.id === palletId ? { ...p, status: 'Завершен' } : p
    ));
  };

  const handleShowPartsClick = (palletId: number) => {
    const pallet = pallets.find(p => p.id === palletId);
    console.log('Opening sidebar for pallet:', palletId);
    console.log('Found pallet:', pallet);
    console.log('Pallet parts:', pallet?.parts);
    setSelectedPalletId(palletId);
    setSelectedPallet(pallet || null);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedPalletId(null);
    setSelectedPallet(null);
  };

  const handleStartWorkPart = (partId: number) => {
    console.log('Starting work on part:', partId);
    if (selectedPallet) {
      const updatedPallet = {
        ...selectedPallet,
        parts: selectedPallet.parts.map(p => 
          p.id === partId ? { ...p, status: 'В работе' } : p
        )
      };
      setPallets(pallets.map(p => p.id === selectedPallet.id ? updatedPallet : p));
      setSelectedPallet(updatedPallet);
    }
  };

  const handleCompleteWorkPart = (partId: number) => {
    console.log('Completing work on part:', partId);
    if (selectedPallet) {
      const updatedPallet = {
        ...selectedPallet,
        parts: selectedPallet.parts.map(p => 
          p.id === partId ? { ...p, status: 'Завершено' } : p
        )
      };
      setPallets(pallets.map(p => p.id === selectedPallet.id ? updatedPallet : p));
      setSelectedPallet(updatedPallet);
    }
  };

  if (!selectedOrderId) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о поддонах</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Выберите заказ</h3>
            <p>Для просмотра поддонов необходимо выбрать заказ из списка</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailsContainer}>
      <h2 className={styles.title}>Информация о поддонах</h2>

      <div className={styles.tableContainer}>
        <div className={styles.createButtonContainer}>
          <button 
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            + Создать поддон
          </button>
        </div>

        {pallets.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Поддоны не созданы. Нажмите "Создать поддон" для добавления.</p>
          </div>
        ) : (
          <table className={styles.palletsTable}>
            <thead>
              <tr>
                <th>Номер поддона</th>
                <th>Детали</th>
                <th>Материалы</th>
                <th>Адрес поддона</th>
                <th>Статус поддона</th>
                <th>Назначить станок</th>
                <th>МЛ поддона</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pallets.map((pallet) => (
                <tr key={pallet.id}>
                  <td>{pallet.palletNumber}</td>
                  <td>
                    <div className={styles.partsContainer}>
                      {pallet.parts.map((part, idx) => (
                        <div key={idx} className={styles.partItem}>
                          <span className={styles.partCode}>{part.articleNumber}</span>
                          <span className={styles.partQuantity}>({part.quantity})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>{pallet.materials}</td>
                  <td>{pallet.address}</td>
                  <td>{pallet.status}</td>
                  <td>{pallet.machine}</td>
                  <td>
                    <button className={styles.mlButton}>МЛ</button>
                  </td>
                  <td className={styles.actionsCell}>
                    {pallet.status === 'Создан' && (
                      <button 
                        className={`${styles.actionButton} ${styles.inProgressButton}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartWork(pallet.id);
                        }}
                      >
                        Взять
                      </button>
                    )}
                    {pallet.status === 'В работе' && (
                      <button 
                        className={`${styles.actionButton} ${styles.completedButton}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteWork(pallet.id);
                        }}
                      >
                        Завершить
                      </button>
                    )}
                    <button 
                      className={styles.arrowButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowPartsClick(pallet.id);
                      }}
                    >
                      &#10095;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Создать поддон</h3>
              <button className={styles.closeButton} onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p>Выберите детали для поддона:</p>
              {availableParts.map(part => (
                <label key={part.id} className={styles.partCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedParts.includes(part.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParts([...selectedParts, part.id]);
                      } else {
                        setSelectedParts(selectedParts.filter(id => id !== part.id));
                      }
                    }}
                  />
                  <span>{part.articleNumber} - {part.name} ({part.quantity} шт.)</span>
                </label>
              ))}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowCreateModal(false)}>
                Отмена
              </button>
              <button 
                className={styles.createButtonModal}
                onClick={handleCreatePallet}
                disabled={selectedParts.length === 0}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      <PalletsSidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        pallet={selectedPallet}
        onStartWork={handleStartWorkPart}
        onCompleteWork={handleCompleteWorkPart}
      />
    </div>
  );
};

export default PalletsTable;
