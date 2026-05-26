import React, { useState, useEffect } from 'react';
import { useCustomPallets } from '../../../../hooks/custom';
import { useCustomDetails } from '../../../../hooks/custom';
import { useRedistribute } from '../../../../hooks/custom/pallets/useRedistribute';
import styles from './PalletsTable.module.css';
import PalletsSidebar from '../PalletsSidebar/PalletsSidebar';
import RedistributeModal from '../RedistributeModal/RedistributeModal';

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

const PalletsTable: React.FC<PalletsTableProps> = ({ selectedOrderId, onShowParts }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedParts, setSelectedParts] = useState<number[]>([]);
  const [partQuantities, setPartQuantities] = useState<{ [key: number]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Part | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);
  const [palletName, setPalletName] = useState('');
  const [showRedistributeModal, setShowRedistributeModal] = useState(false);

  const { pallets, loading: palletsLoading, fetchOrderPallets, fetchPalletParts, createPallet, deletePallet } = useCustomPallets();
  const { orderDetails, loading: detailsLoading, fetchOrderDetails } = useCustomDetails();
  const { redistributeParts } = useRedistribute();

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderPallets(selectedOrderId);
    }
  }, [selectedOrderId, fetchOrderPallets]);

  useEffect(() => {
    if (showCreateModal && selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [showCreateModal, selectedOrderId, fetchOrderDetails]);

  const handleSort = (field: keyof Part) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const availableParts = orderDetails?.parts || [];

  const filteredParts = availableParts.filter(part => {
    const query = searchQuery.toLowerCase();
    return (
      part.partCode.toLowerCase().includes(query) ||
      part.partName.toLowerCase().includes(query) ||
      part.materialName.toLowerCase().includes(query)
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

  const handleRowClick = (partId: number, maxQuantity: number) => {
    handleTogglePart(partId, maxQuantity);
  };

  const handleQuantityChange = (partId: number, value: string, maxQuantity: number) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.min(Math.max(1, numValue), maxQuantity);
    setPartQuantities({ ...partQuantities, [partId]: clampedValue });
  };

  const handleSelectAll = () => {
    if (selectedParts.length === sortedParts.length) {
      setSelectedParts([]);
      setPartQuantities({});
    } else {
      const allPartIds = sortedParts.map(p => p.customPartId);
      setSelectedParts(allPartIds);
      const quantities: { [key: number]: number } = {};
      sortedParts.forEach(p => {
        quantities[p.customPartId] = p.quantity;
      });
      setPartQuantities(quantities);
    }
  };

  const isAllSelected = sortedParts.length > 0 && selectedParts.length === sortedParts.length;

  const getSortIcon = (field: keyof Part) => {
    if (sortField !== field) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const handleCreatePallet = async () => {
    if (selectedParts.length === 0 || !selectedOrderId) return;

    try {
      await createPallet(selectedOrderId, {
        palletName: palletName || `ПОД-${(pallets?.pallets?.length || 0) + 1}`,
        parts: selectedParts.map(partId => ({
          customPartId: partId,
          quantity: partQuantities[partId] || 1
        }))
      });
      setShowCreateModal(false);
      setSelectedParts([]);
      setPartQuantities({});
      setPalletName('');
    } catch (error) {
      console.error('Ошибка создания поддона:', error);
    }
  };

  const handleShowPartsClick = async (palletId: number) => {
    const pallet = pallets?.pallets?.find(p => p.customPalletId === palletId);
    if (pallet) {
      try {
        // Запрашиваем детали конкретного поддона
        const palletDetails = await fetchPalletParts(palletId);
        
        // Преобразуем данные из API в формат, который ожидает PalletsSidebar
        const adaptedPallet: Pallet = {
          id: palletDetails.customPalletId,
          palletNumber: palletDetails.palletName,
          materials: [...new Set(palletDetails.parts.map(p => p.materialName))].join(', '),
          address: 'Не назначен',
          status: palletDetails.isActive ? 'Активен' : 'Неактивен',
          machine: 'Не назначен',
          parts: palletDetails.parts.map(part => ({
            id: part.customPartId,
            articleNumber: part.partCode,
            name: part.partName,
            quantity: part.quantityOnPallet, // Количество на поддоне
            material: part.materialName,
            size: `${part.finishedLength} x ${part.finishedWidth}`,
            substage: '-',
            readyForProcessing: 0,
            completed: 0,
            status: part.status
          }))
        };
        setSelectedPalletId(palletId);
        setSelectedPallet(adaptedPallet);
        setSidebarOpen(true);
      } catch (error) {
        console.error('Ошибка загрузки деталей поддона:', error);
      }
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedPalletId(null);
    setSelectedPallet(null);
  };

  const handleStartWorkPart = (partId: number) => {
    console.log('Starting work on part:', partId);
    // TODO: Реализовать логику начала работы над деталью
  };

  const handleCompleteWorkPart = (partId: number) => {
    console.log('Completing work on part:', partId);
    // TODO: Реализовать логику завершения работы над деталью
  };

  const handleRedistribute = async (
    fromPalletId: number,
    toPalletId: number,
    parts: { customPartId: number; quantity: number }[]
  ) => {
    try {
      await redistributeParts({
        fromPalletId,
        toPalletId,
        parts
      });
      
      if (selectedOrderId) {
        await fetchOrderPallets(selectedOrderId);
      }
      
      setShowRedistributeModal(false);
    } catch (error) {
      console.error('Ошибка перераспределения:', error);
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
          <button 
            className={styles.redistributeButton}
            onClick={() => setShowRedistributeModal(true)}
            disabled={!pallets?.pallets || pallets.pallets.length <= 1}
          >
            Распределить на существующий поддон
          </button>
        </div>

        {pallets?.pallets && pallets.pallets.length === 0 ? (
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
              {pallets?.pallets?.map((pallet) => {
                const materials = [...new Set(pallet.parts.map(p => p.materialName))].join(', ');
                return (
                <tr key={pallet.customPalletId}>
                  <td>{pallet.palletName}</td>
                  <td>{materials || '-'}</td>
                  <td>Не назначен</td>
                  <td>{pallet.isActive ? 'Активен' : 'Неактивен'}</td>
                  <td>{pallet.parts.length}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>
                    <button className={styles.mlButton}>МЛ поддона</button>
                  </td>
                  <td>-</td>
                  <td>Не назначен</td>
                  <td>
                    <button 
                      className={styles.arrowButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowPartsClick(pallet.customPalletId);
                      }}
                    >
                      &#10095;
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => {
          setShowCreateModal(false);
          setSelectedParts([]);
          setPartQuantities({});
          setPalletName('');
          setSearchQuery('');
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Создать поддон</h3>
              <button className={styles.closeButton} onClick={() => {
                setShowCreateModal(false);
                setSelectedParts([]);
                setPartQuantities({});
                setPalletName('');
                setSearchQuery('');
              }}>×</button>
            </div>
            
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Название поддона"
                value={palletName}
                onChange={(e) => setPalletName(e.target.value)}
              />
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Поиск по артикулу, названию, материалу"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.modalBody}>
              {detailsLoading ? (
                <div className={styles.loadingMessage}>Загрузка деталей...</div>
              ) : (
              <table className={styles.partsTable}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('partCode')} style={{ cursor: 'pointer' }}>
                      Артикул детали{getSortIcon('partCode')}
                    </th>
                    <th onClick={() => handleSort('partName')} style={{ cursor: 'pointer' }}>
                      Название детали{getSortIcon('partName')}
                    </th>
                    <th onClick={() => handleSort('materialName')} style={{ cursor: 'pointer' }}>
                      Материал{getSortIcon('materialName')}
                    </th>
                    <th onClick={() => handleSort('finishedLength')} style={{ cursor: 'pointer' }}>
                      Размер{getSortIcon('finishedLength')}
                    </th>
                    <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                      Доступно{getSortIcon('quantity')}
                    </th>
                    <th>
                      Количество на поддон
                    </th>
                    <th>
                      Подэтап
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
                      key={part.customPartId}
                      className={selectedParts.includes(part.customPartId) ? styles.selected : ''}
                      onClick={() => handleRowClick(part.customPartId, part.quantity)}
                    >
                      <td>{part.partCode}</td>
                      <td>{part.partName}</td>
                      <td>{part.materialName}</td>
                      <td>{part.finishedLength} x {part.finishedWidth}</td>
                      <td>{part.quantity}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          className={styles.quantityInput}
                          min="1"
                          max={part.quantity}
                          value={partQuantities[part.customPartId] || part.quantity}
                          onChange={(e) => handleQuantityChange(part.customPartId, e.target.value, part.quantity)}
                          disabled={!selectedParts.includes(part.customPartId)}
                          placeholder={part.quantity.toString()}
                        />
                      </td>
                      <td>-</td>
                      <td>
                        <input
                          type="checkbox"
                          className={styles.partCheckbox}
                          checked={selectedParts.includes(part.customPartId)}
                          onChange={() => handleTogglePart(part.customPartId, part.quantity)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => {
                setShowCreateModal(false);
                setSelectedParts([]);
                setPartQuantities({});
                setPalletName('');
                setSearchQuery('');
              }}>
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

      {showRedistributeModal && (
        <RedistributeModal
          isOpen={showRedistributeModal}
          onClose={() => setShowRedistributeModal(false)}
          availablePallets={pallets?.pallets || []}
          onRedistribute={handleRedistribute}
        />
      )}
    </div>
  );
};

export default PalletsTable;
