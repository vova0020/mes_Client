import React from 'react';
import styles from './MachinePalletsSidebar.module.css';

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

interface PalletsSidebarProps {
  detailInfo: any;
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
  handleOpenML: (palletId?: number) => void;
  position?: { top: number; right: number };
}

// Моковые данные для деталей в поддоне
const mockParts: Part[] = [
  {
    id: 1,
    articleNumber: 'ABCD-ABCD-38',
    name: 'Боковина шкафа правая/левая',
    quantity: 150,
    material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
    size: '2050x650',
    substage: 'Раскрой',
    readyForProcessing: 50,
    completed: 25,
    status: 'PASSED_PREVIOUS_STAGE'
  },
  {
    id: 2,
    articleNumber: 'ABCD-ABCD-38',
    name: 'Боковина шкафа правая/левая',
    quantity: 150,
    material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
    size: '2050x650',
    substage: 'Кромление',
    readyForProcessing: 50,
    completed: 25,
    status: 'IN_PROGRESS'
  },
  {
    id: 3,
    articleNumber: 'ABCD-ABCD-38',
    name: 'Боковина шкафа правая/левая',
    quantity: 150,
    material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
    size: '2050x650',
    substage: 'Присадка',
    readyForProcessing: 50,
    completed: 25,
    status: 'COMPLETED'
  }
];

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({ 
  detailInfo, 
  detailId, 
  isOpen, 
  onClose, 
  handleOpenML 
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<keyof Part | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [selectedParts, setSelectedParts] = React.useState<number[]>([]);
  
  // Используем моковые данные
  const parts = mockParts;

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

  const filteredParts = parts.filter(part => {
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

  const getStatusClass = (status: string): string => {
    const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');
    switch (normalizedStatus) {
      case 'NOT_PROCESSED':
      case 'ГОТОВО_К_ОБРАБОТКЕ':
      case 'PASSED_PREVIOUS_STAGE':
        return styles.statusPassedPreviousStage;
      case 'IN_PROGRESS':
      case 'В_РАБОТЕ':
        return styles.statusInProgress;
      case 'COMPLETED':
      case 'ЗАВЕРШЕНО':
        return styles.statusCompleted;
      case 'PENDING':
      case 'ОЖИДАНИЕ':
        return styles.statusOnMachine;
      case 'PARTIALLY_COMPLETED':
      case 'ЧАСТИЧНО_ВЫПОЛНЕНО':
        return styles.statusPartiallyCompleted;
      default:
        return styles.statusOnMachine;
    }
  };

  const getStatusText = (status: string): string => {
    const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');
    switch (normalizedStatus) {
      case 'NOT_PROCESSED':
        return 'Не обработано';
      case 'PENDING':
        return 'Ожидание';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'COMPLETED':
        return 'Завершено';
      case 'PARTIALLY_COMPLETED':
        return 'Частично выполнено';
      case 'PASSED_PREVIOUS_STAGE':
        return 'Готово к обработке';
      case 'ACTIVE':
        return 'Активен';
      case 'INACTIVE':
        return 'Неактивен';
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.headerTop}>
          <h2>Номер поддона, статус, адрес</h2>
          <div className={styles.headerActions}>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
        </div>
        {detailInfo && (
          <div className={styles.detailInfo}>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Номер поддона:</span>
              <span className={styles.propertyValue}>{detailInfo.pallet || 'ABCD-ABCD-38'}</span>
            </div>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Адрес:</span>
              <span className={styles.propertyValue}>{detailInfo.address || 'ABCD-ABCD-38'}</span>
            </div>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Статус:</span>
              <span className={styles.propertyValue}>{detailInfo.status || 'В работе'}</span>
            </div>
          </div>
        )}
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
        {parts.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyMessage}>
              <h3>Нет деталей в поддоне</h3>
              <p>Поддон пуст или детали еще не добавлены</p>
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
                    <th>Действия</th>
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
                          {getStatusText(part.status)}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          className={`${styles.actionButton} ${styles.mlButton}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenML(part.id);
                          }}
                        >
                          МЛ детали
                        </button>
                        {part.status === 'IN_PROGRESS' ? (
                          <button
                            className={`${styles.actionButton} ${styles.completedButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Завершить', part.id);
                            }}
                          >
                            Завершить
                          </button>
                        ) : (
                          <button
                            className={`${styles.actionButton} ${styles.inProgressButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Взять в работу', part.id);
                            }}
                          >
                            Взять в работу
                          </button>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
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
