
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './MachinePalletsSidebar.module.css';
import useProductionPallets from '../../../hooks/machinhook/machinProductionPallets';
import { useMachine } from '../../../hooks/machinhook/useMachine';
import DefectModal from './DefectModal';
import RedistributeModal from './RedistributeModal';
import { PartDistribution, RedistributePartsRequest } from '../../../api/machineApi/machineApi';
import {
  ProductionPallet,
  BufferCellDto,
  getPalletRouteSheet,
  getOperationStatusText,
  getProcessStepText,
  CompleteProcessingResponseDto
} from '../../../api/machineApi/machinProductionPalletsService';
import { DefectPalletPartsDto } from '../../../api/machineApi/machineApi';

interface PalletsSidebarProps {
  detailInfo: any;
  detailId: number | null;
  isOpen: boolean;
  onClose: () => void;
  handleOpenML: (palletId?: number) => void;
  position?: { top: number; right: number };
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({
  detailInfo,
  detailId,
  isOpen,
  onClose,
  handleOpenML,
  position = { top: 120, right: 20 }
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [processingPalletId, setProcessingPalletId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nextStepInfo, setNextStepInfo] = useState<string | null>(null);
  const [defectModalOpen, setDefectModalOpen] = useState<boolean>(false);
  const [selectedPallet, setSelectedPallet] = useState<ProductionPallet | null>(null);
  
  // Состояния для меню действий с количеством
  const [showQuantityMenu, setShowQuantityMenu] = useState<number | null>(null);
  
  // Состояния для модального окна перераспределения
  const [showRedistributeModal, setShowRedistributeModal] = useState<boolean>(false);
  const [redistributePalletId, setRedistributePalletId] = useState<number | null>(null);
  const [isRedistributing, setIsRedistributing] = useState<boolean>(false);

  // Используем хук для получения данных о станке и пользователе
  const { machine, machineId } = useMachine();

  // Получаем ID пользователя из localStorage (предполагаем, что он там хранится)
  const getUserId = (): number => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 1; // Возвращаем ID пользователя или 1 по умолчанию
      }
    } catch (error) {
      console.error('Ошибка при получении ID пользователя:', error);
    }
    return 1; // ID по умолчанию
  };

  // Используем хук для получения данных о поддонах
  const {
    pallets,
    loading,
    error,
    fetchPallets,
    bufferCells,
    loadSegmentResources,
    refreshPalletData,
    updateBufferCell,
    startPalletProcessing,
    completePalletProcessing,
    defectPalletParts,
    redistributeParts
  } = useProductionPallets(detailId);

  // Эффект для загрузки поддонов и ресурсов сегмента
  useEffect(() => {
    if (isOpen && detailId) {
      console.log("PalletsSidebar - Загружаем данные для детали:", detailId);
      setShowDetails(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);

      // Используем Promise.all для выполнения запросов параллельно
      const loadData = async () => {
        try {
          await Promise.all([
            fetchPallets(detailId),
            loadSegmentResources()
          ]);
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
  }, [isOpen, detailId, fetchPallets, loadSegmentResources]);

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
  // Больше не закрываем сайдбар кликом вне — закрытие только через крестик
  useEffect(() => {
    // intentionally empty: closing happens only via close button
    return () => { };
  }, []);

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
      setSuccessMessage(`Поддон  перемещен в ячейку буфера ${bufferCellAddress}`);
    } catch (error) {
      console.error(`Ошибка при изменении ячейки буфера для поддона ${palletId}:`, error);
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
      return <ResourceLoading loading={loading} type="ячеек" />;
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
        disabled={isProcessing}
        title='Выберите ячейку буфера для поддона'
      >
        <option value="">Выберите ячейку</option>
        {/* Добавляем сначала текущую ячейку буфера, если она есть */}
        {currentBufferCellCode && (
          <option key={`current-${currentBufferCellCode}`} value={currentBufferCellCode}>
            {currentBufferCellCode} (текущая)
          </option>
        )}
        {/* Добавляем все остальные ячейки буфера, которые не являются текущей */}
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

  // Обработчик для кнопки "В работу"
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
      setSuccessMessage(`Поддон успешно переведен в статус "В работу"`);
    } catch (error) {
      console.error(`Ошибка при переводе поддона ${palletId} в работу:`, error);

      // Извлекаем сообщение об ошибке из ответа API
      const apiError = error as any;
      const errorMsg = apiError.response?.data?.message || apiError.message;
      
      // Проверяем, является ли это ошибкой о незавершенном предыдущем этапе
      if (errorMsg && errorMsg.includes('Нельзя взять поддон') && errorMsg.includes('в работу. Предыдущий этап')) {
        // Извлекаем название этапа из сообщения
        const stageMatch = errorMsg.match(/Предыдущий этап "([^"]+)" не завершен/);
        const stageName = stageMatch ? stageMatch[1] : 'предыдущий этап';
        
        setErrorMessage(`Поддон  не может быть взят в работу. Необходимо завершить этап "${stageName}".`);
      } else {
        // Обрабатываем другие типы ошибок
        setErrorMessage(`Не удалось перевести поддон в работу: ${errorMsg || 'Неизвестная ошибка'}`);
      }
    } finally {
      setProcessingPalletId(null);
    }
  };

  // Обработчик для кнопки "Готово"
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

      // Обрабатываем успешный ответ API
      if (response) {
        console.log('Ответ от API completePalletProcessing:', response);

        // Сохраняем информацию о следующем шаге
        setNextStepInfo(response.nextStep || 'Этап обработки завершен');

        // Формируем сообщение об успешной операции
        const pallet = response.pallet;
        console.log('Объект pallet из ответа:', pallet);

        if (pallet) {
          const isCompleted = !pallet.currentStepId;
          console.log('isCompleted:', isCompleted, 'currentStepId:', pallet.currentStepId);

          // Отображаем сообщение об успешном завершении
          if (isCompleted) {
            setSuccessMessage(`Обработка поддона ${pallet.name || `№${pallet.id}`} полностью завершена`);
          } else {
            const nextStepName = pallet.currentStep?.name || 'следующий этап';
            setSuccessMessage(`Поддон ${pallet.name || `№${pallet.id}`} готов к этапу "${nextStepName}"`);
          }
        } else {
          // Если объект pallet отсутствует в ответе
          setSuccessMessage(`Поддон №${palletId} успешно отмечен как готовый`);
        }
      } else {
        // Если ответ пустой, показываем общее сообщение об успехе
        setSuccessMessage(`Поддон №${palletId} успешно отмечен как готовый`);
      }

      // Обновляем данные поддонов после успешной операции
      if (detailId) {
        await refreshPalletData(palletId);
      }
    } catch (error) {
      console.error(`Ошибка при отметке поддона ${palletId} как готовый:`, error);

      // Обрабатываем специфические ошибки API согласно документации
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;

      // Отображаем пользовательское сообщение в зависимости от типа ошибки
      if (errorMessage.includes('Поддон не найден')) {
        setErrorMessage(`Поддон не найден в системе`);
      } else if (errorMessage.includes('Станок не найден')) {
        setErrorMessage(`Станок не найден в системе`);
      } else if (errorMessage.includes('не указан текущий этап обработки')) {
        setErrorMessage(`Невозможно завершить обработку: не указан текущий этап`);
      } else if (errorMessage.includes('Не найдена активная операция')) {
        setErrorMessage(`Не найдена активная операция для поддона на текущем этапе`);
      } else if (errorMessage.includes('требуется указать оператора')) {
        setErrorMessage(`Для завершения операции требуется указать оператора`);
      } else {
        setErrorMessage(`Не удалось отметить поддон как готовый: ${errorMessage}`);
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

  // Обработчик клика по количеству
  const handleQuantityClick = (palletId: number) => {
    setShowQuantityMenu(showQuantityMenu === palletId ? null : palletId);
  };

  // Обработчик выбора действия с количеством
  const handleQuantityAction = (action: 'defect' | 'redistribute', palletId: number) => {
    if (action === 'defect') {
      const pallet = pallets.find(p => p.id === palletId);
      if (pallet) {
        setSelectedPallet(pallet);
        setDefectModalOpen(true);
      }
    } else if (action === 'redistribute') {
      setRedistributePalletId(palletId);
      setShowRedistributeModal(true);
    }
    setShowQuantityMenu(null);
  };

  // Обработчик для открытия модального окна отбраковки
  const handleDefectClick = (pallet: ProductionPallet) => {
    setSelectedPallet(pallet);
    setDefectModalOpen(true);
  };

  // Обработчик для отбраковки деталей
  const handleDefectSubmit = async (defectData: DefectPalletPartsDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);

      const response = await defectPalletParts(defectData);

      // Показываем сообщение об успешной отбраковке
      setSuccessMessage(
        `Отбраковано ${response.reclamation.quantity} деталей с поддона ${response.pallet.name}. ` +
        `Осталось: ${response.pallet.newQuantity} деталей.`
      );

      // Обновляем данные о поддонах
      if (detailId) {
        await fetchPallets(detailId);
      }
    } catch (error) {
      console.error('Ошибка при отбраковке деталей:', error);

      // Обрабатываем ошибки согласно документации API
      const apiError = error as any;
      const errorMessage = apiError.response?.data?.message || apiError.message;

      if (errorMessage.includes('Недостаточно деталей')) {
        setErrorMessage('Недостаточно деталей на поддоне для отбраковки');
      } else if (errorMessage.includes('Поддон не найден')) {
        setErrorMessage('Поддон не найден в системе');
      } else if (errorMessage.includes('Не удалось определить этап')) {
        setErrorMessage('Не удалось определить этап для создания рекламации');
      } else {
        setErrorMessage(`Ошибка при отбраковке: ${errorMessage}`);
      }
    }
  };

  // Обработчик перераспределения деталей
  const handleRedistributeParts = async (distributions: PartDistribution[]) => {
    if (!redistributePalletId) return;

    try {
      setIsRedistributing(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNextStepInfo(null);

      const redistributeData: RedistributePartsRequest = {
        sourcePalletId: redistributePalletId,
        machineId: machineId,
        distributions
      };

      const response = await redistributeParts(redistributeData);
      
      setShowRedistributeModal(false);
      setSuccessMessage('Детали успешно перераспределены');
      
      console.log('Детали успешно перераспределены:', response);
    } catch (error) {
      console.error('Ошибка при перераспределении деталей:', error);
      setErrorMessage('Не удалось перераспределить детали');
    } finally {
      setIsRedistributing(false);
    }
  };

  // Функция для получения класса стиля в зависимости от статуса операции
  const getOperationStatusClass = (operation?: any): string => {


    if (!operation) return '';

    // Сначала проверяем completionStatus (если есть)
    // if (operation.completionStatus) {
    //   switch (operation.completionStatus) {
    //     case 'ON_MACHINE': return styles.statusOnMachine;
    //     case 'IN_PROGRESS': return styles.statusInProgress;
    //     case 'BUFFERED': return styles.statusBuffered;
    //     case 'COMPLETED': return styles.statusCompleted;
    //     case 'PARTIALLY_COMPLETED': return styles.statusPartiallyCompleted;
    //     default: return '';
    //   }
    // } else if (operation.status) {
    // Используем status, если completionStatus отсутствует
    switch (operation.status) {
      case 'PENDING': return styles.statusOnMachine;
      case 'IN_PROGRESS': return styles.statusInProgress;
      case 'BUFFERED': return styles.statusBuffered;
      case 'COMPLETED': return styles.statusCompleted;
      case 'FAILED': return styles.statusFailed;
      default: return '';
    }
    // }
    // return '';
  };

  // Компонент для отображения статуса операции
  const OperationStatus = ({ operation }: { operation?: any }) => {
    console.log('Статус');
    console.log(operation);
    if (!operation) {
      return <span className={styles.noOperation}>Не в обработке</span>;
    }

    // Получаем текст статуса (с приоритетом completionStatus)
    const statusText = getOperationStatusText(operation);

    // Получаем текст этапа обработки
    const processStepText = getProcessStepText(operation);

    return (
      <div className={styles.operationStatus}>
        <span className={`${styles.statusBadge} ${getOperationStatusClass(operation)}`}>
          {statusText}
        </span>
        {/* {operation.processStep && (
          <span className={styles.processStep}>
            {processStepText}
          </span>
        )} */}
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
        <h2>Информация о поддонах</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
        {detailInfo && (
          <div className={styles.detailInfo}>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Артикул:</span>
              <span className={styles.propertyValue}>{detailInfo.article}</span>
            </div>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Название:</span>
              <span className={styles.propertyValue}>{detailInfo.name}</span>
            </div>
            <div className={styles.detailProperty}>
              <span className={styles.propertyLabel}>Размер:</span>
              <span className={styles.propertyValue}>{detailInfo.size}</span>
            </div>

          </div>
        )}
      

      <div className={styles.sidebarContent}>
        {/* Отображение сообщения об успешной операции */}
        {successMessage && (
          <div className={styles.successNotification}>
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Отображение сообщения об ошибке */}
        {errorMessage && (
          <div className={styles.errorNotification}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>{errorMessage}</span>
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
                  loadSegmentResources();
                }
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
                <p>Выберите деталь для отображения её поддонов.</p>
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
                    <th>Адрес</th>
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
                      <td className={styles.quantityCell}>
                        <button
                          className={`${styles.quantityButton} quantityButton`}
                          onClick={() => handleQuantityClick(pallet.id)}
                          title="Редактировать количество"
                        >
                          {pallet.quantity}
                        </button>
                      </td>
                      <td>
                        <BufferCellSelector pallet={pallet} />
                      </td>
                      <td>
                        <OperationStatus operation={pallet.currentOperation} />
                        {/* {pallet.currentStepName} текущий */}
                        {/* {pallet.currentStepName && !pallet.currentOperation && ( */}
                        {/* <span className={styles.nextStep} title="Следующий этап обработки"> */}
                        {/* Следующий: {pallet.currentStepName} */}
                        {/* </span> */}
                        {/* )} */}
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          className={`${styles.actionButton} ${styles.mlButton}`}
                          onClick={() => handleOpenML(pallet.id)}
                          disabled={processingPalletId === pallet.id}
                          title="Маршрутный лист"
                        >
                          <DocumentIcon />
                          МЛ
                        </button>

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
                            pallet.currentOperation?.status === 'PENDING' ||
                            !pallet.currentOperation?.status ||
                            !getBufferCellAddress(pallet.bufferCell)}
                          title={!getBufferCellAddress(pallet.bufferCell) ? 
                            "Выберите адрес в буфере" : "Готово"}
                        >
                          Готово
                        </button>
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
  return (
    <>
      {createPortal(sidebarContent, document.body)}
      {selectedPallet && (
        <DefectModal
          isOpen={defectModalOpen}
          onClose={() => {
            setDefectModalOpen(false);
            setSelectedPallet(null);
          }}
          onSubmit={handleDefectSubmit}
          palletId={selectedPallet.id}
          palletName={selectedPallet.name || `Поддон №${selectedPallet.id}`}
          maxQuantity={selectedPallet.quantity}
          machineId={machineId}
          stageId={selectedPallet.currentStepId || 1} // Используем текущий этап или 1 по умолчанию
          reportedById={getUserId()}
        />
      )}
      
      {/* Меню действий с количеством */}
      {showQuantityMenu !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.quantityMenuContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.quantityMenuHeader}>
              <h3>Действия с количеством</h3>
              <button 
                className={styles.quantityMenuCloseButton}
                onClick={() => setShowQuantityMenu(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.quantityMenuBody}>
              <button
                className={styles.quantityMenuButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityAction('defect', showQuantityMenu);
                }}
              >
                Отбраковать детали
              </button>
              <button
                className={styles.quantityMenuButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityAction('redistribute', showQuantityMenu);
                }}
              >
                Перераспределить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно перераспределения */}
      {showRedistributeModal && redistributePalletId && (
        <RedistributeModal
          isOpen={showRedistributeModal}
          onClose={() => {
            setShowRedistributeModal(false);
            setRedistributePalletId(null);
          }}
          pallet={pallets.find(p => p.id === redistributePalletId)!}
          existingPallets={pallets}
          onRedistribute={handleRedistributeParts}
          isProcessing={isRedistributing}
        />
      )}
    </>
  );
};

export default PalletsSidebar;
