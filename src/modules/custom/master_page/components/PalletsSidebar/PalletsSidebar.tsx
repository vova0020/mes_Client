import React from 'react';
import styles from './PalletsSidebar.module.css';

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

interface Pallet {
  id: number;
  palletNumber: string;
  materials: string;
  address: string;
  status: string;
  machine: string;
  parts: Part[];
}

interface PalletsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pallet: Pallet | null;
  onStartWork: (partId: number) => void;
  onCompleteWork: (partId: number) => void;
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({ isOpen, onClose, pallet, onStartWork, onCompleteWork }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<keyof Part | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [selectedParts, setSelectedParts] = React.useState<number[]>([]);
  
  console.log('PalletsSidebar render:', { isOpen, pallet, partsCount: pallet?.parts?.length });
  
  if (!pallet) {
    console.log('No pallet provided to sidebar');
    return null;
  }

  const handleDrawingClick = (partId: number) => {
    console.log(`Открыть чертеж для детали ${partId}`);
  };

  const handleSort = (field: keyof Part) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Part) => {
    if (sortField !== field) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const filteredParts = pallet.parts.filter(part => {
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

  const handleRedistribute = () => {
    console.log('Перераспределить выбранные детали:', selectedParts);
  };

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'готово к обработке':
        return styles.statusPassedPreviousStage;
      case 'в работе':
        return styles.statusInProgress;
      case 'завершено':
        return styles.statusCompleted;
      default:
        return '';
    }
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.headerTop}>
          <h2>Номер поддона, статус, адрес</h2>
          <div className={styles.headerActions}>
            <button className={styles.redistributeButton} onClick={handleRedistribute}>
              Перераспределить группу деталей
            </button>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
        </div>
        <div className={styles.detailInfo}>
          <div className={styles.detailProperty}>
            <span className={styles.propertyLabel}>Номер поддона:</span>
            <span className={styles.propertyValue}>{pallet.palletNumber}</span>
          </div>
          <div className={styles.detailProperty}>
            <span className={styles.propertyLabel}>Адрес:</span>
            <span className={styles.propertyValue}>{pallet.address}</span>
          </div>
          <div className={styles.detailProperty}>
            <span className={styles.propertyLabel}>Статус:</span>
            <span className={styles.propertyValue}>{pallet.status}</span>
          </div>
        </div>
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

      <div className={styles.sidebarContent}>
        {!pallet.parts || pallet.parts.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyMessage}>
              <h3>Нет деталей в поддоне</h3>
              <p>Поддон пуст или детали еще не добавлены</p>
              <p style={{color: 'red'}}>Debug: parts = {JSON.stringify(pallet.parts)}</p>
            </div>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableScrollContainer}>
              <table className={styles.palletsTable}>
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
                    <th onClick={() => handleSort('substage')} style={{ cursor: 'pointer' }}>
                      Подэтап{getSortIcon('substage')}
                    </th>
                    <th>Тех инфо (чертеж)</th>
                    <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                      Количество{getSortIcon('quantity')}
                    </th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                      Статус{getSortIcon('status')}
                    </th>
                    <th>МЛ детали</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParts.map((part, index) => (
                    <tr
                      key={part.id}
                      className={`${styles.animatedRow} ${selectedParts.includes(part.id) ? styles.selected : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => handleRowClick(part.id)}
                    >
                      <td>{part.articleNumber}</td>
                      <td>{part.name}</td>
                      <td>{part.material}</td>
                      <td>{part.size}</td>
                      <td>{part.substage}</td>
                      <td>
                        <button 
                          className={`${styles.actionButton} ${styles.mlButton}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrawingClick(part.id);
                          }}
                        >
                          Чертеж
                        </button>
                      </td>
                      <td>{part.quantity} ({part.completed})</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(part.status)}`}>
                          {part.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`${styles.actionButton} ${styles.mlButton}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('МЛ детали', part.id);
                          }}
                        >
                          МЛ детали
                        </button>
                      </td>
                      <td className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PalletsSidebar;
