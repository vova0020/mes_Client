import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './PalletsSidebar.module.css';
import useProductionPallets from '../../../hooks/machinNoSmenHook/productionPallets';
import { 
  ProductionPallet, 
  BufferCellDto, 
  CurrentOperationDto,
  TaskStatus,
  getPalletRouteSheet,
  getOperationStatusText,
  getProcessStepText,
  CompleteProcessingResponseDto,
  TakeToWorkResponseDto
} from '../../../api/machinNoSmenApi/productionPalletsService';

interface PalletsSidebarProps {
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; right: number };
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({ 
  detailId, 
  isOpen, 
  onClose,
  position = { top: 120, right: 20 }
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [processingPalletId, setProcessingPalletId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nextStepInfo, setNextStepInfo] = useState<string | null>(null);
  
  // Используем хук для получения данных о поддонах
  const { 
    pallets, 
    loading, 
    error, 
    fetchPallets,
    fetchAvailablePallets,
    bufferCells,
    loadSegmentResources,
    refreshPalletData,
    updateBufferCell,
    startPalletProcessing,
    completePalletProcessing,
    takeToWork,
    completeProcessing,
    moveToBuffer
  } = useProductionPallets(detailId);

  // Эффект для загрузки поддонов и ресурсов сегмента
  useEffect(() => {
    if (isOpen) {
      console.log("PalletsSidebar - Загружаем данные, detailId:", detailId);
      setShowDetails(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      
      // Используем Promise.all для выполнения запросов параллельно
      const loadData = async () => {
        try {
          if (detailId) {
            // Если есть detailId, загружаем поддоны для конкретной детали
            await Promise.all([
              fetchPallets(detailId),
              loadSegmentResources()
            ]);
          } else {
            // Если detailId нет, загружаем ресурсы сегмента
            // Примечание: fetchAvailablePallets требует detailId и stageId, 
            // поэтому для режима "доступные поддоны" используем пустой массив
            await loadSegmentResources();
            // Можно добавить логику для получения доступных поддонов, если будет известен detailId и stageId
          }
          console.log("PalletsSidebar - Данные успешно загружены");
          
          // Показываем детали с небольшой задержкой для анимации
          setTimeout(() => {
            setShowDetails(true);
          }, 100);
        } catch (err) {
          console.error("PalletsSidebar - Ошибка при загрузке данных:", err);
          setErrorMessage((err as Error).message || 'Произошла ошибка при загрузке данных');
        }
      };
      
      loadData();
    }
  }, [isOpen, detailId, fetchPallets, fetchAvailablePallets, loadSegmentResources]);

  // Сбрасываем состояние при закрытии панели
  useEffect(() => {
    if (!isOpen) {
      setShowDetails(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
    }
  }, [isOpen]);

  // Очистка сообщения об успехе через 5 секунд
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [successMessage]);

  // Обработчик закрытия при клике вне сайдбара
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Получение адреса ячейки буфера по коду - аналогично функции из компонента мастера
  const getBufferCellAddress = (bufferCell: any): string => {
    if (!bufferCell) return '';

    // Проверяем разные варианты структуры bufferCell
    if (bufferCell.code) {
      return bufferCell.code;
    }

    if (bufferCell.buffer && bufferCell.buffer.code) {
      return bufferCell.buffer.code;
    }

    return '';
  };

  // Обработчик изменения выбранной ячейки буфера для поддона
  const handleBufferChange = async (palletId: number, bufferCellAddress: string) => {
    if (!bufferCellAddress) return;
    
    // Находим ID ячейки буфера по адресу/коду
    const bufferCell = bufferCells.find(cell => cell.code === bufferCellAddress);
    if (!bufferCell) return;
    
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Выбрана ячейка буфера ${bufferCell.id} (${bufferCellAddress}) для поддона ${palletId}`);
      
      // Вызываем API-метод для обновления ячейки буфера
      await updateBufferCell(palletId, bufferCell.id);
      await refreshPalletData(palletId);
      
      // Показываем сообщение об успешном обновлении
      setSuccessMessage(`Поддон ${palletId} перемещен в ячейку буфера ${bufferCellAddress}`);
    } catch (error) {
      console.error(`��шибка при изменении ячейки буфера для поддона ${palletId}:`, error);
      setErrorMessage(`Не удалось обновить ячейку буфера: ${(error as Error).message}`);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Компонент для отображения загрузки ресурсов
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

  // Компонент для отображения селектора ячеек буфера - аналогично компоненту мастера
  const BufferCellSelector = ({ pallet }: { pallet: any }) => {
    // Проверяем, находится ли поддон в процессе обновления
    const isProcessing = processingPalletId === pallet.id;

    if (isProcessing) {
      return <ResourceLoading loading={true} type="обновления" />;
    }

    if (loading) {
      return <ResourceLoading loading={loading} type="ячее��" />;
    }

    if (!bufferCells || bufferCells.length === 0) {
      return (
        <div className={styles.bufferCellError}>
          <span>Нет доступных ячеек</span>
        </div>
      );
    }

    // Получаем код текущей ячейки буфера
    const currentBufferCellCode = getBufferCellAddress(pallet.bufferCell);

    return (
      <select
        className={styles.bufferCellSelect}
        value={currentBufferCellCode}
        onChange={(e) => handleBufferChange(pallet.id, e.target.value)}
        disabled={isProcessing || pallet.currentOperation?.status === 'IN_PROGRESS'}
        title={pallet.currentOperation?.status === 'IN_PROGRESS' ? 
              'Нельзя изменить буфер во время обработки' : 'Выберите ячейку буфера для поддона'}
      >
        <option value="">Выберите ячейку</option>
        {/* Добавляем сначала текущую ячейку буфера, если она есть */}
        {currentBufferCellCode && (
          <option key={`current-${currentBufferCellCode}`} value={currentBufferCellCode}>
            {currentBufferCellCode} (текущая)
          </option>
        )}
        {/* До��авляем все остальные ячейки буфера, которые не являются текущей */}
        {bufferCells.map((cell) => {
          // Пропускаем текущую ячейку буфера, так как она уже добавлена выше
          if (cell.code === currentBufferCellCode) {
            return null;
          }
          return (
            <option key={cell.id} value={cell.code}>
              {cell.code}
            </option>
          );
        })}
      </select>
    );
  };

  // Обработчик для кнопки "Взять в работу" (новый API для станков без сменного задания)
  const handleTakeToWork = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Поддон ${palletId} берется в работу...`);
      
      // Вызываем новый API-метод для взятия поддона в работу
      const response = await takeToWork(palletId);
      console.log(`Поддон ${palletId} успешно взят в работу:`, response);
      
      // Обрабатываем успешный ответ API
      if (response && response.assignment) {
        const assignment = response.assignment;
        const palletName = assignment.pallet?.palletName || `№${assignment.pallet?.palletId || palletId}`;
        setSuccessMessage(`Поддон ${palletName} успешно взят в работу`);
        
        // Показываем информацию об операции
        if (response.operation && response.operation.processStep) {
          setNextStepInfo(`Начата обработка: ${response.operation.processStep.name}`);
        }
      } else {
        setSuccessMessage(`Поддон №${palletId} успешно взят в работу`);
      }
    } catch (error) {
      console.error(`Ошибка при взятии поддона ${palletId} в работу:`, error);
      
      // Обрабатываем специфические ошибки API согласно документации
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;
      
      if (errorMessage && errorMessage.includes('Поддон не найден')) {
        setErrorMessage(`Поддон не найден в системе`);
      } else if (errorMessage && errorMessage.includes('Станок не найден')) {
        setErrorMessage(`Станок не найден в системе`);
      } else if (errorMessage && errorMessage.includes('Поддон уже занят')) {
        setErrorMessage(`Поддон уже занят другим станком`);
      } else if (errorMessage && errorMessage.includes('станок не готов к работе')) {
        setErrorMessage(`Станок не готов к работе`);
      } else if (errorMessage && errorMessage.includes('не может выполнять данный этап')) {
        setErrorMessage(`Станок не может выполнять данный этап обработки`);
      } else {
        setErrorMessage(`Не удалось взять поддон в работу: ${errorMessage || 'Неизвестная ошибка'}`);
      }
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для кнопки "Завершить обработку" (новый API для станков без сменного задания)
  const handleCompleteProcessing = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Поддон ${palletId} завершается...`);
      
      // Вызываем новый API-метод для завершения обработки поддона
      const response = await completeProcessing(palletId);
      console.log(`Поддон ${palletId} успешно завершен:`, response);
      
      // Обрабатываем успешный ответ API согласно новой документации
      if (response) {
        // Сохраняем информацию о следующе�� этапе
        setNextStepInfo(response.nextStage || 'Этап обработки завершен');
        
        // Формируем сообщение об успешной операции на основе данных из assignment
        const assignment = response.assignment;
        if (assignment && assignment.pallet) {
          const palletName = assignment.pallet.palletName || `№${assignment.pallet.palletId}`;
          setSuccessMessage(`Поддон ${palletName} успешно завершен`);
        } else {
          setSuccessMessage(`Поддон №${palletId} успешно завершен`);
        }
      } else {
        setSuccessMessage(`Поддон №${palletId} успешно завершен`);
      }
    } catch (error) {
      console.error(`Ошибка при завершении обработки поддона ${palletId}:`, error);
      
      // Обрабатываем специфические ошибки API согласно документации
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;
      
      if (errorMessage && errorMessage.includes('Активное назначение не найдено')) {
        setErrorMessage(`Активное назначение не найдено`);
      } else if (errorMessage && errorMessage.includes('Не найден активный прогресс этапа')) {
        setErrorMessage(`Не найден активный прогресс этапа`);
      } else {
        setErrorMessage(`Не удалось завершить обработку поддона: ${errorMessage || 'Неизвестная ошибка'}`);
      }
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для перемещения поддона в буфер (новый API)
  const handleMoveToBuffer = async (palletId: number, bufferCellId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Поддон ${palletId} перемещается в буфер...`);
      
      // Вызываем новый API-метод для перемещения поддона в буфер
      await moveToBuffer(palletId, bufferCellId);
      console.log(`Поддон ${palletId} успешно перемещен в буфер`);
      
      // Показываем сообщение об успехе
      setSuccessMessage(`Поддон №${palletId} успешно перемещен в буфер`);
    } catch (error) {
      console.error(`Ошибка при перемещении поддона ${palletId} �� буфер:`, error);
      
      // Обрабатываем специфические ошибки API согласно документации
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;
      
      if (errorMessage && errorMessage.includes('Поддон не найден')) {
        setErrorMessage(`Поддон не найден в системе`);
      } else if (errorMessage && errorMessage.includes('ячейка буфера не найдена')) {
        setErrorMessage(`Ячейка буфера не найдена`);
      } else if (errorMessage && errorMessage.includes('Ячейка буфера недоступна')) {
        setErrorMessage(`Ячейка буфера недоступна`);
      } else if (errorMessage && errorMessage.includes('заполнена до максимальной вместимости')) {
        setErrorMessage(`Ячейка буфера заполнена до максимальной вместимости`);
      } else {
        setErrorMessage(`Не удалось переместить поддон в буфер: ${errorMessage || 'Неизвестная ошибка'}`);
      }
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для кнопки "В работу" (старый API для обратной совместимости)
  const handleStartWork = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Поддон ${palletId} переводится в работу...`);
      
      // Вызываем API-метод для изменения статуса поддона
      await startPalletProcessing(palletId);
      console.log(`Поддон ${palletId} успешно переведен в работу`);
      
      // Показываем сообщение об успехе
      setSuccessMessage(`Поддон ��${palletId} успешно переведен в статус "В работу"`);
    } catch (error) {
      console.error(`Ошибка при переводе поддона ${palletId} в работу:`, error);
      
      // Извлекаем сообщение об ошибке из ответа API, если возможно
      const apiError = error as any;
      const errorMsg = apiError.response?.data?.message || apiError.message || 
                      'Неизвестная ошибка при переводе поддона в работу';
      setErrorMessage(`Не удалось перевести поддон в работу: ${errorMsg}`);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для кнопки "Готово" (старый API для обратной совместимости)
  const handleComplete = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      console.log(`Поддон ${palletId} отмечается как готовый...`);
      
      // Вызываем API-метод для изменения статуса поддона на "Готово"
      const response = await completePalletProcessing(palletId);
      console.log(`Поддон ${palletId} успешно отмечен как готовый:`, response);
      
      // Обрабатываем успешный ответ API согласно новой документации
      if (response) {
        // Сохраняем информацию о следующем этапе
        setNextStepInfo(response.nextStage || 'Этап обработки завершен');
        
        // Формируем сообщение об успешной операции на основе данных из assignment
        const assignment = response.assignment;
        if (assignment && assignment.pallet) {
          const palletName = assignment.pallet.palletName || `№${assignment.pallet.palletId}`;
          setSuccessMessage(`Поддон ${palletName} успешно завершен`);
        } else {
          setSuccessMessage(`Поддон №${palletId} успешно отмечен как готовый`);
        }
      } else {
        // Если ответ пустой, показываем общее сообщение об успехе
        setSuccessMessage(`Поддон №${palletId} успешно отмечен как готовый`);
      }
    } catch (error) {
      console.error(`Ошибка при отметке поддона ${palletId} как готовый:`, error);
      
      // Обрабатываем специфические ошибки API согласно документации
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;
      
      // Отображаем пользовательское сообщение в зависимости от типа ошибки
      if (errorMessage && errorMessage.includes('Поддон не найден')) {
        setErrorMessage(`Поддон не найден в системе`);
      } else if (errorMessage && errorMessage.includes('Станок не найден')) {
        setErrorMessage(`Станок не найден в системе`);
      } else if (errorMessage && errorMessage.includes('не указан текущий этап обработки')) {
        setErrorMessage(`Невозможно завершить обработку: не указан текущий этап`);
      } else if (errorMessage && errorMessage.includes('Не найдена активная операция')) {
        setErrorMessage(`Не найдена актив��ая операция для поддона на текущем этапе`);
      } else if (errorMessage && errorMessage.includes('требуется указать оператора')) {
        setErrorMessage(`Для завершения операции требуется указать оператора`);
      } else {
        setErrorMessage(`Не удалось отметить поддон как готовый: ${errorMessage || 'Неизвестная ошибка'}`);
      }
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для кнопки "Маршрутный лист"
  const handleRouteSheet = async (palletId: number) => {
    try {
      setProcessingPalletId(palletId);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);
      
      // Получаем маршрутный лист в виде Blob
      const routeSheetBlob = await getPalletRouteSheet(palletId);
      
      // Создаем URL для скачивания
      const url = window.URL.createObjectURL(routeSheetBlob);
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Маршрутный_лист_поддон_${palletId}.pdf`);
      
      // Добавляем ссылку в DOM, имитируем клик и удаляем
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем URL
      window.URL.revokeObjectURL(url);
      
      // Показываем сообщение об успехе
      setSuccessMessage(`Маршрутный лист для поддона №${palletId} скачивается...`);
    } catch (error) {
      console.error(`Ошибка при получении маршрутного листа для поддона ${palletId}:`, error);
      setErrorMessage(`Не удалось получить маршрутный лист: ${(error as Error).message}`);
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Функция для получения класса стиля в зависимости от статуса операции
  const getOperationStatusClass = (operation?: any): string => {
    if (!operation) return '';

    // Сначала проверяем completionStatus (если есть)
    if (operation.completionStatus) {
      switch (operation.completionStatus) {
        case 'ON_MACHINE': return styles.statusOnMachine;
        case 'IN_PROGRESS': return styles.statusInProgress;
        case 'BUFFERED': return styles.statusBuffered;
        case 'COMPLETED': return styles.statusCompleted;
        case 'PARTIALLY_COMPLETED': return styles.statusPartiallyCompleted;
        default: return '';
      }
    } else if (operation.status) {
      // Используем status, если completionStatus отсутствует
      switch (operation.status) {
        case 'ON_MACHINE': return styles.statusOnMachine;
        case 'IN_PROGRESS': return styles.statusInProgress;
        case 'BUFFERED': return styles.statusBuffered;
        case 'COMPLETED': return styles.statusCompleted;
        case 'FAILED': return styles.statusFailed;
        default: return '';
      }
    }
    return '';
  };

  // Компонент для отображения статуса операции
  const OperationStatus = ({ operation }: { operation?: any }) => {
    if (!operation) {
      return <span className={styles.noOperation}>Не в обработке</span>;
    }

    // Получаем текст ��татуса (с приоритетом completionStatus)
    const statusText = getOperationStatusText(operation);

    // Получаем текст этапа обработки
    const processStepText = getProcessStepText(operation);

    return (
      <div className={styles.operationStatus}>
        <span className={`${styles.statusBadge} ${getOperationStatusClass(operation)}`}>
          {statusText}
        </span>
        {operation.processStep && (
          <span className={styles.processStep}>
            {processStepText}
          </span>
        )}
        {operation.isCompletedForDetail && (
          <span className={styles.completedForDetail} title="Обработка детали завершена">
            ✓
          </span>
        )}
      </div>
    );
  };

  // Компонент для отображения иконки документа
  const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  // Иконка проверки для сообщений успеха
  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );

  // Если компонент закрыт, не рендерим его содержимое
  if (!isOpen) return null;

  // Содержимое сайдбара
  const sidebarContent = (
    <div 
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} 
      ref={sidebarRef}
    >
      <div className={styles.sidebarHeader}>
        <h2>{detailId ? 'Поддоны детали' : 'Доступные поддоны'}</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.sidebarContent}>
        {/* Отображение сообщения об успешной операции */}
        {successMessage && (
          <div className={styles.successNotification}>
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Отображение информации о следующем шаге */}
        {nextStepInfo && (
          <div className={styles.nextStepInfo}>
            <span>{nextStepInfo}</span>
          </div>
        )}

        {loading ? (
          <div className={styles.stateContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingMessage}>
              <h3>Загрузка данных</h3>
              <p>Пожалуйста, подождите...</p>
            </div>
          </div>
        ) : error || errorMessage ? (
          <div className={styles.stateContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage}>
              <h3>Ошибка</h3>
              <p>{errorMessage || error?.message || 'Произошла ошибка при получении информации о поддонах.'}</p>
              <button onClick={() => {
                setErrorMessage(null);
                setNextStepInfo(null);
                if (detailId) {
                  fetchPallets(detailId);
                }
                loadSegmentResources();
              }} className={styles.retryButton}>
                Повторить загрузку
              </button>
            </div>
          </div>
        ) : !pallets || pallets.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyMessage}>
              <h3>Нет доступных поддонов</h3>
              {detailId ? (
                <p>Для выбранной детали не найдено ни одного поддона.</p>
              ) : (
                <p>Нет доступных поддонов для обработки на данном станке.</p>
              )}
            </div>
          </div>
        ) : (
          <div className={`${styles.tableContainer} ${showDetails ? styles.showDetails : styles.hideDetails}`}>
            <div className={styles.tableScrollContainer}>
              <table className={styles.palletsTable}>
                <thead>
                  <tr>
                    <th>Поддон</th>
                    <th>Количество</th>
                    <th>Буфер</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pallets.map((pallet, index) => (
                    <tr
                      key={pallet.id}
                      className={`${styles.animatedRow} ${processingPalletId === pallet.id ? styles.processingRow : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      data-status={pallet.currentOperation?.status || pallet.currentOperation?.completionStatus || 'NO_OPERATION'}
                    >
                      <td>{pallet.name || `Поддон №${pallet.id}`}</td>
                      <td>{pallet.quantity}</td>
                      <td>
                        <BufferCellSelector pallet={pallet} />
                      </td>
                      <td>
                        <OperationStatus operation={pallet.currentOperation} />
                        {pallet.currentStepName && !pallet.currentOperation && (
                          <span className={styles.nextStep} title="Следующ��й этап обработки">
                            Следующий: {pallet.currentStepName}
                          </span>
                        )}
                      </td>
                      <td className={styles.actionsCell}>
                        <button 
                          className={`${styles.actionButton} ${styles.mlButton}`}
                          onClick={() => handleRouteSheet(pallet.id)}
                          disabled={processingPalletId === pallet.id}
                          title="Маршрутный лист"
                        >
                          <DocumentIcon />
                          МЛ
                        </button>
                        
                        {/* Используем новые API функции для станков без сменного задания */}
                        {!detailId ? (
                          // Для режима "доступные поддоны" используем новые API
                          <>
                            <button 
                              className={`${styles.actionButton} ${styles.inProgressButton}`}
                              onClick={() => handleTakeToWork(pallet.id)}
                              disabled={processingPalletId === pallet.id || 
                                     pallet.currentOperation?.status === TaskStatus.IN_PROGRESS}
                              title="Взять в работу"
                            >
                              Взять в работу
                            </button>
                            <button 
                              className={`${styles.actionButton} ${styles.completedButton}`}
                              onClick={() => handleCompleteProcessing(pallet.id)}
                              disabled={processingPalletId === pallet.id || 
                                     pallet.currentOperation?.status === TaskStatus.COMPLETED ||
                                     pallet.currentOperation?.status === TaskStatus.NOT_PROCESSED ||
                                     !pallet.currentOperation?.status}
                              title="Завершить обработку"
                            >
                              Завершить
                            </button>
                          </>
                        ) : (
                          // Для режима "поддоны детали" используем старые API для обратной совместимости
                          <>
                            <button 
                              className={`${styles.actionButton} ${styles.inProgressButton}`}
                              onClick={() => handleStartWork(pallet.id)}
                              disabled={processingPalletId === pallet.id || 
                                     pallet.currentOperation?.status === 'IN_PROGRESS'}
                              title="В работу"
                            >
                              В работу
                            </button>
                            <button 
                              className={`${styles.actionButton} ${styles.completedButton}`}
                              onClick={() => handleComplete(pallet.id)}
                              disabled={processingPalletId === pallet.id || 
                                     pallet.currentOperation?.status === 'COMPLETED' ||
                                     !pallet.currentOperation?.status}
                              title="Готово"
                            >
                              Готово
                            </button>
                          </>
                        )}
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

  // Используем портал для рендеринга сайдбара в конце body
  return createPortal(sidebarContent, document.body);
};

export default PalletsSidebar;