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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Part | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);

  useEffect(() => {
    if (selectedOrderId) {
      setAvailableParts(MOCK_PARTS_FOR_ORDER[selectedOrderId] || []);
      setPallets([]);
    }
  }, [selectedOrderId]);

  const handleSort = (field: keyof Part) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredParts = availableParts.filter(part => {
    const query = searchQuery.toLowerCase();
    return (
      part.articleNumber.toLowerCase().includes(query) ||
      part.name.toLowerCase().includes(query) ||
      part.material.toLowerCase().includes(query) ||
      part.size.toLowerCase().includes(query) ||
      part.substage.toLowerCase().includes(query)
    );
  });

  const sortedParts = [...filteredParts].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const handleTogglePart = (partId: number) => {
    if (selectedParts.includes(partId)) {
      setSelectedParts(selectedParts.filter(id => id !== partId));
    } else {
      setSelectedParts([...selectedParts, partId]);
    }
  };

  const handleRowClick = (partId: number) => {
    handleTogglePart(partId);
  };

  const handleSelectAll = () => {
    if (selectedParts.length === sortedParts.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(sortedParts.map(p => p.id));
    }
  };

  const isAllSelected = sortedParts.length > 0 && selectedParts.length === sortedParts.length;

  const getSortIcon = (field: keyof Part) => {
    if (sortField !== field) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

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
            Добавить поддон
          </button>
          <button className={styles.redistributeButton}>
            Распределить на существующий поддон
          </button>
        </div>

        {pallets.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Поддоны не созданы. Нажмите "Добавить поддон" для добавления.</p>
          </div>
        ) : (
          <table className={styles.palletsTable}>
            <thead>
              <tr>
                <th>Поддон</th>
                <th>Материалы</th>
                <th>Адрес</th>
                <th>Статус</th>
                <th>Деталей на поддоне</th>
                <th>Готово к обработке</th>
                <th>Выполнено</th>
                <th>МЛ поддона</th>
                <th>Подэтап</th>
                <th>Назначить станок</th>
                <th></th>
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
                  <td>{pallet.address}</td>
                  <td>{pallet.status}</td>
                  <td>111</td>
                  <td>50</td>
                  <td>61</td>
                  <td>
                    <button className={styles.mlButton}>МЛ поддона</button>
                  </td>
                  <td>Правильный (15)<br/>Не очень (30)</td>
                  <td>{pallet.machine}</td>
                  <td>
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
            
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Поиск по артикулу, названию, материалу, размеру, подэтапу"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.modalBody}>
              <table className={styles.partsTable}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('articleNumber')} style={{ cursor: 'pointer' }}>
                      Артикул детали{getSortIcon('articleNumber')}
                    </th>
                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                      Название детали{getSortIcon('name')}
                    </th>
                    <th onClick={() => handleSort('material')} style={{ cursor: 'pointer' }}>
                      Материал{getSortIcon('material')}
                    </th>
                    <th onClick={() => handleSort('size')} style={{ cursor: 'pointer' }}>
                      Размер{getSortIcon('size')}
                    </th>
                    <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                      Общее количество{getSortIcon('quantity')}
                    </th>
                    <th onClick={() => handleSort('substage')} style={{ cursor: 'pointer' }}>
                      Подэтап{getSortIcon('substage')}
                    </th>
                    <th>
                      <input
                        type="checkbox"
                        className={styles.partCheckbox}
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParts.map(part => (
                    <tr 
                      key={part.id}
                      className={selectedParts.includes(part.id) ? styles.selected : ''}
                      onClick={() => handleRowClick(part.id)}
                    >
                      <td>{part.articleNumber}</td>
                      <td>{part.name}</td>
                      <td>{part.material}</td>
                      <td>{part.size}</td>
                      <td>{part.quantity}</td>
                      <td>{part.substage}</td>
                      <td>
                        <input
                          type="checkbox"
                          className={styles.partCheckbox}
                          checked={selectedParts.includes(part.id)}
                          onChange={() => handleTogglePart(part.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
