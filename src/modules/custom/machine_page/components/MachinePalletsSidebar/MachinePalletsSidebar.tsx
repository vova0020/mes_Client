import React from 'react';
import styles from './MachinePalletsSidebar.module.css';
import { PartDetail, machineTasksApi } from '../../../../api/custom/machine-tasks/machineTasksApi';

interface PalletsSidebarProps {
  detailInfo: any;
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
  handleOpenML: (palletId?: number) => void;
  parts: PartDetail[];
  loading: 'loading' | 'success' | 'error';
  position?: { top: number; right: number };
  onRefresh?: () => void;
}


const PalletsSidebar: React.FC<PalletsSidebarProps> = ({
  detailInfo,
  detailId,
  isOpen,
  onClose,
  handleOpenML,
  parts,
  loading,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<keyof PartDetail | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [selectedParts, setSelectedParts] = React.useState<string[]>([]);
  const [actionLoading, setActionLoading] = React.useState<boolean>(false);
  
  // Определяем, какую кнопку показывать для поддона
  const getPalletButtonType = (): 'start' | 'complete' | 'disabled' => {
    if (!parts || parts.length === 0) return 'disabled';
    
    const hasInProgress = parts.some(part => part.status === 'IN_PROGRESS');
    const allCompleted = parts.every(part => part.status === 'COMPLETED');
    
    if (allCompleted) return 'disabled';
    if (hasInProgress) return 'complete';
    return 'start';
  };

  // Обработчик для взятия поддона в работу
  const handleStartPallet = async () => {
    if (!detailInfo?.assignmentId || actionLoading) return;
    
    try {
      setActionLoading(true);
      await machineTasksApi.startPallet(detailInfo.assignmentId);
      console.log('Поддон взят в работу');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Ошибка при взятии поддона в работу:', error);
      alert('Ошибка при взятии поддона в работу');
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик для завершения поддона
  const handleCompletePallet = async () => {
    if (!detailInfo?.assignmentId || actionLoading) return;
    
    try {
      setActionLoading(true);
      await machineTasksApi.completePallet(detailInfo.assignmentId);
      console.log('Работа над поддоном завершена');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Ошибка при завершении работы над поддоном:', error);
      alert('Ошибка при завершении работы над поддоном');
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик для взятия детали в работу
  const handleStartPart = async (assignmentPartId: number) => {
    if (actionLoading) return;
    
    if (!assignmentPartId) {
      console.error('assignmentPartId отсутствует');
      alert('Ошибка: ID детали не найден. Проверьте данные от API.');
      return;
    }
    
    try {
      setActionLoading(true);
      await machineTasksApi.startPart(assignmentPartId);
      console.log('Деталь взята в работу');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Ошибка при взятии детали в работу:', error);
      alert('Ошибка при взятии детали в работу');
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик для завершения детали
  const handleCompletePart = async (assignmentPartId: number, quantity: string) => {
    if (actionLoading) return;
    
    const processedQuantity = parseInt(quantity, 10);
    if (isNaN(processedQuantity) || processedQuantity <= 0) {
      alert('Некорректное количество деталей');
      return;
    }
    
    try {
      setActionLoading(true);
      await machineTasksApi.completePart(assignmentPartId, processedQuantity);
      console.log('Работа над деталью завершена');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Ошибка при завершении работы над деталью:', error);
      alert('Ошибка при завершении работы над деталью');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrawingClick = (partCode: string) => {
    console.log(`Открыть чертеж для детали ${partCode}`);
  };

  const handleSort = (field: keyof PartDetail) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof PartDetail) => {
    if (sortField !== field) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const filteredParts = parts.filter(part => {
    const query = searchQuery.toLowerCase();
    return (
      part.partCode.toLowerCase().includes(query) ||
      part.partName.toLowerCase().includes(query) ||
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
    
    return 0;
  });

  const handleTogglePart = (partCode: string) => {
    if (selectedParts.includes(partCode)) {
      setSelectedParts(selectedParts.filter(code => code !== partCode));
    } else {
      setSelectedParts([...selectedParts, partCode]);
    }
  };

  const handleRowClick = (partCode: string) => {
    handleTogglePart(partCode);
  };

  const getStatusClass = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'NOT_PROCESSED':
      case 'PENDING':
        return styles.statusPassedPreviousStage;
      case 'IN_PROGRESS':
        return styles.statusInProgress;
      case 'COMPLETED':
        return styles.statusCompleted;
      default:
        return styles.statusOnMachine;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'NOT_PROCESSED':
        return 'Не обработано';
      case 'PENDING':
        return 'Готово к обработке';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'COMPLETED':
        return 'Завершено';
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
              <span className={styles.propertyValue}>{detailInfo.status ? getStatusText(detailInfo.status) : 'В работе'}</span>
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
        {loading === 'loading' ? (
          <div className={styles.stateContainer}>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
            <div className={styles.loadingMessage}>
              <h3>Загрузка деталей...</h3>
            </div>
          </div>
        ) : parts.length === 0 ? (
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
                    <th onClick={() => handleSort('partCode')} style={{ cursor: 'pointer' }}>
                      Артикул детали{getSortIcon('partCode')}
                    </th>
                    <th onClick={() => handleSort('partName')} style={{ cursor: 'pointer' }}>
                      Название детали{getSortIcon('partName')}
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
                  {sortedParts.map((part, index) => {
                    // Логирование для отладки
                    if (index === 0) {
                      console.log('Пример данных детали:', part);
                      console.log('assignmentPartId:', part.assignmentPartId);
                    }
                    
                    return (
                      <tr
                        key={part.partCode}
                        className={`${styles.animatedRow} ${selectedParts.includes(part.partCode) ? styles.selected : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => handleRowClick(part.partCode)}
                      >
                      <td>{part.partCode}</td>
                      <td>{part.partName}</td>
                      <td>{part.material}</td>
                      <td>{part.size}</td>
                      <td>{part.substage}</td>
                      <td>
                        <button 
                          className={`${styles.actionButton} ${styles.mlButton}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrawingClick(part.partCode);
                          }}
                        >
                          Чертеж
                        </button>
                      </td>
                      <td>{part.quantity}</td>
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
                            handleOpenML();
                          }}
                        >
                          МЛ детали
                        </button>
                        {part.status === 'IN_PROGRESS' ? (
                          <button
                            className={`${styles.actionButton} ${styles.completedButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompletePart(part.assignmentPartId, part.quantity);
                            }}
                            disabled={actionLoading}
                          >
                            Завершить
                          </button>
                        ) : part.status === 'COMPLETED' ? (
                          <button
                            className={`${styles.actionButton} ${styles.completedButton}`}
                            disabled
                          >
                            Завершено
                          </button>
                        ) : (
                          <button
                            className={`${styles.actionButton} ${styles.inProgressButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartPart(part.assignmentPartId);
                            }}
                            disabled={actionLoading}
                          >
                            Взять в работу
                          </button>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className={styles.partCheckbox}
                          checked={selectedParts.includes(part.partCode)}
                          onChange={() => handleTogglePart(part.partCode)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    </tr>
                  );
                  })}
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
