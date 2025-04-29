import React, { useState, useEffect, useRef } from 'react';
import styles from './PalletsSidebar.module.css';
import useProductionPallets from '../../../hooks/productionPallets';
import { getPalletRouteSheet } from '../../../api/productionPalletsService';

interface PalletsSidebarProps {
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({ detailId, isOpen, onClose }) => {
  // Ref для боковой панели
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Используем обновленный хук для получения данных о поддонах
  const { 
    pallets,
    bufferCells,
    machines, // Теперь получаем машины из сервера
    loading, 
    error, 
    fetchPallets,
    updateMachine,
    updateBufferCell,
    loadSegmentResources
  } = useProductionPallets(null);
  
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bufferCellsLoading, setBufferCellsLoading] = useState<boolean>(false);
  const [machinesLoading, setMachinesLoading] = useState<boolean>(false);

  // Добавляем обработчик кликов вне боковой панели
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Проверяем, что sidebar открыт и что клик был не внутри него
      if (isOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Добавляем обработчик только если панель открыта
    if (isOpen) {
      // Используем setTimeout, чтобы не сработало закрытие сразу после открытия
      setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
      }, 100);
    }
    
    // Удаляем обработчик при закрытии панели или размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Загрузка данных о поддонах для выбранной детали
  useEffect(() => {
    if (detailId !== null && isOpen) {
      setShowDetails(false);
      setErrorMessage(null);
      setBufferCellsLoading(true);
      setMachinesLoading(true);
      
      // Сначала загружаем ресурсы сегмента (включая ячейки буфера и станки)
      loadSegmentResources()
        .then(() => {
          setBufferCellsLoading(false);
          setMachinesLoading(false);
          // Затем загружаем данные о поддонах
          return fetchPallets(detailId);
        })
        .then(() => {
          // Показываем детали с небольшой задержкой для анимации
          setTimeout(() => {
            setShowDetails(true);
          }, 100);
        })
        .catch((err) => {
          setBufferCellsLoading(false);
          setMachinesLoading(false);
          setErrorMessage('Не удалось загрузить данные о поддонах');
          console.error('Ошибка загрузки данных:', err);
        });
    }
  }, [detailId, isOpen, fetchPallets, loadSegmentResources]);

  // Сбрасываем состояние при закрытии панели
  useEffect(() => {
    if (!isOpen) {
      setShowDetails(false);
    }
  }, [isOpen]);

  // Обработчик изменения выбранного станка
  const handleMachineChange = async (palletId: number, newMachine: string) => {
    try {
      await updateMachine(palletId, newMachine);
      console.log(`Поддон ${palletId} назначен на станок: ${newMachine}`);
    } catch (err) {
      setErrorMessage('Не удалось обновить станок для поддона');
    }
  };

  // Обработчик изменения адреса ячейки буфера
  const handleBufferCellChange = async (palletId: number, bufferCellAddress: string) => {
    // Находим ID ячейки буфера по адресу
    const bufferCell = bufferCells.find(cell => cell.code === bufferCellAddress);
    if (!bufferCell) return;
    
    try {
      await updateBufferCell(palletId, bufferCell.id);
      console.log(`Поддон ${palletId} перемещен в ячейку буфера: ${bufferCellAddress}`);
    } catch (err) {
      setErrorMessage('Не удалось обновить ячейку буфера для поддона');
    }
  };

  // Обработчик кнопки МЛ (маршрутный лист)
  const handleOpenML = async (palletId: number) => {
    try {
      const blob = await getPalletRouteSheet(palletId);
      
      // Создаем URL для скачивания файла
      const url = window.URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = `Маршрутный_лист_поддон_${palletId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setErrorMessage('Не удалось получить маршрутный лист');
    }
  };

  // Компонент иконки для кнопки МЛ
  const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  // Обработчик повторной загрузки данных
  const handleRetry = () => {
    setErrorMessage(null);
    if (detailId !== null) {
      fetchPallets(detailId);
    }
  };

  // Обработчик повторной загрузки ячеек буфера и станков
  const handleRetryLoadResources = () => {
    setBufferCellsLoading(true);
    setMachinesLoading(true);
    loadSegmentResources()
      .then(() => {
        setBufferCellsLoading(false);
        setMachinesLoading(false);
      })
      .catch((err) => {
        setBufferCellsLoading(false);
        setMachinesLoading(false);
        console.error('Ошибка загрузки ресурсов:', err);
      });
  };

  // Получение адреса ячейки буфера по коду
  const getBufferCellAddress = (bufferCell: any): string => {
    if (!bufferCell) return '';
    
    // Используем напрямую код ячейки
    return bufferCell.code || '';
  };

  // Получаем имя станка для отображения в селекте
  const getMachineName = (machine: any): string => {
    if (!machine) return '';
    return machine.name || '';
  };

  // Компонент для отображения состояния загрузки ресурсов
  const ResourceLoading = ({ loading, type }: { loading: boolean, type: string }) => {
    if (loading) {
      return (
        <div className={styles.bufferCellLoading}>
          <div className={styles.miniSpinner}></div>
          <span>Загрузка {type}...</span>
        </div>
      );
    }
    return null;
  };

  // Компонент для отображения селектора ячеек буфера
  const BufferCellSelector = ({ pallet }: { pallet: any }) => {
    if (bufferCellsLoading) {
      return <ResourceLoading loading={bufferCellsLoading} type="ячеек" />;
    }
    
    if (!bufferCells || bufferCells.length === 0) {
      return (
        <div className={styles.bufferCellError}>
          <span>Нет доступных ячеек</span>
          <button 
            className={styles.miniRetryButton} 
            onClick={handleRetryLoadResources}
            title="Обновить ресурсы"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }
    
    return (
      <select 
        className={styles.bufferCellSelect}
        value={getBufferCellAddress(pallet.bufferCell)}
        onChange={(e) => handleBufferCellChange(pallet.id, e.target.value)}
      >
        <option value="">Выберите ячейку</option>
        {bufferCells.map((cell) => (
          <option key={cell.id} value={cell.code}>
            {cell.code}
          </option>
        ))}
      </select>
    );
  };

  // Компонент для отображения селектора станков
  const MachineSelector = ({ pallet }: { pallet: any }) => {
    if (machinesLoading) {
      return <ResourceLoading loading={machinesLoading} type="станков" />;
    }
    
    if (!machines || machines.length === 0) {
      return (
        <div className={styles.bufferCellError}>
          <span>Нет доступных станков</span>
          <button 
            className={styles.miniRetryButton} 
            onClick={handleRetryLoadResources}
            title="Обновить ресурсы"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      );
    }
    
    const currentMachineName = getMachineName(pallet.machine);
    
    return (
      <select 
        className={styles.machineSelect}
        value={currentMachineName}
        onChange={(e) => handleMachineChange(pallet.id, e.target.value)}
      >
        <option value="">Выберите станок</option>
        {/* Добавляем сначала текущий станок, если он есть */}
        {currentMachineName && (
          <option key={`current-${currentMachineName}`} value={currentMachineName}>
            {currentMachineName} (текущий)
          </option>
        )}
        {/* Добавляем все остальные станки, которые не являются текущим */}
        {machines.map((machine) => {
          // Пропускаем текущий станок, так как он уже добавлен выше
          if (machine.name === currentMachineName) {
            return null;
          }
          return (
            <option key={machine.id} value={machine.name}>
              {machine.name}
            </option>
          );
        })}
      </select>
    );
  };

  return (
    <div 
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      ref={sidebarRef}
    >
      <div className={styles.sidebarHeader}>
        <h2>Информация о поддонах</h2>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
      </div>

      <div className={styles.sidebarContent}>
        {loading && (
          <div className={styles.stateContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingMessage}>
              <h3>Загрузка данных</h3>
              <p>Пожалуйста, подождите...</p>
            </div>
          </div>
        )}

        {(error || errorMessage) && (
          <div className={styles.stateContainer}>
            <div className={styles.errorIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            </div>
            <div className={styles.errorMessage}>
              <h3>Ошибка загрузки</h3>
              <p>{errorMessage || (error instanceof Error ? error.message : 'Неизвестная ошибка')}</p>
              <button onClick={handleRetry} className={styles.retryButton}>
                Попробовать снова
              </button>
            </div>
          </div>
        )}

        {!loading && !error && !errorMessage && pallets.length === 0 && (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
                <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.emptyMessage}>
              <h3>Нет данных о поддонах</h3>
              <p>Для данной детали не найдено информации о поддонах</p>
            </div>
          </div>
        )}

        {!loading && !error && !errorMessage && pallets.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.palletsTable}>
              <thead>
                <tr>
                  <th>Номер поддона</th>
                  <th>Адрес ячейки буфера</th>
                  <th>Количество</th>
                  <th>Станок</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
                {pallets.map((pallet, index) => (
                  <tr 
                    key={pallet.id}
                    className={styles.animatedRow}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td>{pallet.name || `P${pallet.id.toString().padStart(3, '0')}`}</td>
                    <td>
                      <BufferCellSelector pallet={pallet} />
                    </td>
                    <td>{pallet.quantity}</td>
                    <td>
                      <MachineSelector pallet={pallet} />
                    </td>
                    <td className={styles.actionsCell}>
                      <button 
                        className={`${styles.actionButton} ${styles.mlButton}`}
                        onClick={() => handleOpenML(pallet.id)}
                        title="Открыть маршрутный лист"
                      >
                        <DocumentIcon /> МЛ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PalletsSidebar;