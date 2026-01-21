import React, { useState, useEffect, useRef } from 'react';
import styles from './PalletsSidebar.module.css';
import { useParts, usePallets } from '../../../hooks/ypakMasterHook';
import { assignPalletToPackage, defectParts, returnParts, DefectPartsRequestDto, ReturnPartsRequestDto } from '../../../api/ypakMachine/ypakMachineApi';

interface PackagingDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackageId?: number | null;
}

const PackagingDetailsSidebar: React.FC<PackagingDetailsSidebarProps> = ({ 
  isOpen, 
  onClose, 
  selectedPackageId 
}) => {
  // Ref для боковой панели
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Состояния для управления отображением
  const [showTables, setShowTables] = useState<boolean>(false);
  const [showPalletsLoading, setShowPalletsLoading] = useState<boolean>(false);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [movingPalletId, setMovingPalletId] = useState<number | null>(null);
  
  // Состояния для меню действий с количеством
  const [showQuantityMenu, setShowQuantityMenu] = useState<number | null>(null);
  
  // Состояния для модального окна отбраковки
  const [showDefectModal, setShowDefectModal] = useState<boolean>(false);
  const [defectPalletId, setDefectPalletId] = useState<number | null>(null);
  const [defectQuantity, setDefectQuantity] = useState<string>('');
  const [defectDescription, setDefectDescription] = useState<string>('');
  const [isDefecting, setIsDefecting] = useState<boolean>(false);
  
  // Состояния для модального окна возврата деталей
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnPalletId, setReturnPalletId] = useState<number | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<string>('');
  const [isReturning, setIsReturning] = useState<boolean>(false);
  
  // Состояние для сообщения об ошибке и успехе
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // Хуки для работы с данными
  const {
    parts,
    packageInfo,
    loading: partsLoading,
    error: partsError,
    fetchPartsByPackageId,
    clearParts
  } = useParts();

  const {
    pallets,
    partInfo,
    loading: palletsLoading,
    error: palletsError,
    fetchPalletsByPartId,
    clearPallets
  } = usePallets();

  // API функция для назначения поддона на упаковку импортирована напрямую

  // Общие состояния загрузки и ошибок
  const loading = partsLoading || palletsLoading;
  const error = partsError || palletsError;

  // Эффект для управления индикатором загрузки поддонов
  useEffect(() => {
    if (palletsLoading && selectedDetailId) {
      // Показываем загрузку только если она длится больше 300ms
      const timer = setTimeout(() => {
        setShowPalletsLoading(true);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      // Скрываем загрузку когда данные получены
      setShowPalletsLoading(false);
    }
  }, [palletsLoading, selectedDetailId]);

  // Загрузка деталей при изменении выбранной упаковки
  useEffect(() => {
    if (isOpen && selectedPackageId) {
      fetchPartsByPackageId(selectedPackageId);
    } else {
      clearParts();
      clearPallets();
      setSelectedDetailId(null);
    }
  }, [isOpen, selectedPackageId, fetchPartsByPackageId, clearParts, clearPallets]);

  // Обработчик клика по детали
  const handleDetailClick = (partId: number) => {
    if (selectedDetailId === partId) {
      // Если кликнули на уже выбранную деталь, скрываем поддоны
      setSelectedDetailId(null);
      clearPallets();
    } else {
      // Выбираем новую деталь и загружаем её поддоны
      setSelectedDetailId(partId);
      fetchPalletsByPartId(partId, { packageId: selectedPackageId || undefined });
    }
  };


  const handleMoveToPackaging = async (palletId: number) => {
    if (!selectedPackageId || !partInfo) {
      console.error('Не выбрана упаковка или деталь');
      return;
    }

    // Находим поддон для получения количества
    const pallet = pallets.find(p => p.palletId === palletId);
    if (!pallet) {
      console.error('Поддон не найден');
      return;
    }

    setMovingPalletId(palletId);
    
    try {
      const result = await assignPalletToPackage(
        palletId,
        selectedPackageId,
        pallet.quantity
      );
      
      console.log('Поддон успешно перемещен на упаковку:', result.message);
      
      // Обновляем данные поддонов для текущей детали
      if (selectedDetailId) {
        await fetchPalletsByPartId(selectedDetailId, { packageId: selectedPackageId || undefined });
      }
    } catch (error: any) {
      console.error('Ошибка при перемещении поддона на упаковку:', error);
      
      // Показываем пользователю сообщение об ошибке
      let errorMessage = 'Произошла ошибка при перемещении поддона';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setMovingPalletId(null);
    }
  };

  // Обработчик клика по количеству
  const handleQuantityClick = (palletId: number) => {
    setShowQuantityMenu(showQuantityMenu === palletId ? null : palletId);
  };

  // Обработчик выбора действия с количеством
  const handleQuantityAction = (action: 'defect' | 'return', palletId: number) => {
    if (action === 'defect') {
      setReturnPalletId(null);
      setDefectPalletId(palletId);
      setDefectQuantity('');
      setDefectDescription('');
      setErrorMessage(null);
      setShowDefectModal(true);
    } else if (action === 'return') {
      setDefectPalletId(null);
      setReturnPalletId(palletId);
      setReturnQuantity('');
      setErrorMessage(null);
      setShowReturnModal(true);
    }
    setShowQuantityMenu(null);
  };

  // Обработчик отбраковки деталей
  const handleDefectParts = async () => {
    if (!defectPalletId) return;

    const quantity = parseInt(defectQuantity);
    const pallet = pallets.find(p => p.palletId === defectPalletId);
    
    if (!pallet) {
      setErrorMessage('Поддон не найден');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage('Введите корректное количество деталей');
      return;
    }

    if (quantity > pallet.quantity) {
      setErrorMessage(`Количество не может превышать ${pallet.quantity}`);
      return;
    }

    // Получаем userId из localStorage
    let userId: number | null = null;
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userId = userData.id;
      }
    } catch (error) {
      console.error('Ошибка при получении userId:', error);
    }

    if (!userId) {
      setErrorMessage('Не удалось определить ID пользователя');
      return;
    }

    // Получаем stageId из localStorage
    let stageId: number | null = null;
    try {
      const selectedStageData = localStorage.getItem('selectedStage');
      if (selectedStageData) {
        const selectedStage = JSON.parse(selectedStageData);
        stageId = selectedStage.id;
      }
    } catch (error) {
      console.error('Ошибка при получении stageId:', error);
    }

    if (!stageId) {
      setErrorMessage('Не удалось определить ID этапа');
      return;
    }

    // Получаем machineId из localStorage (опционально)
    let machineId: number | undefined = undefined;
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (assignmentsData) {
        const data = JSON.parse(assignmentsData);
        machineId = data.machines?.[0]?.id;
      }
    } catch (error) {
      console.error('Ошибка при получении machineId:', error);
    }

    try {
      setIsDefecting(true);
      setErrorMessage(null);

      const requestData: DefectPartsRequestDto = {
        palletId: defectPalletId,
        quantity: quantity,
        reportedById: userId,
        description: defectDescription.trim() || undefined,
        machineId: machineId,
        stageId: stageId
      };

      await defectParts(requestData);

      setShowDefectModal(false);
      setSuccessMessage('Детали успешно отбракованы');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Обновляем данные поддонов
      if (selectedDetailId) {
        await fetchPalletsByPartId(selectedDetailId, { packageId: selectedPackageId || undefined });
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Не удалось отбраковать детали';
      setErrorMessage(errorMsg);
      console.error('Ошибка при отбраковке деталей:', err);
    } finally {
      setIsDefecting(false);
    }
  };

  // Обработчик возврата деталей
  const handleReturnParts = async () => {
    if (!returnPalletId || !selectedDetailId) return;

    const quantity = parseInt(returnQuantity);

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage('Введите корректное количество деталей');
      return;
    }

    // Получаем userId из localStorage
    let userId: number | null = null;
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userId = userData.id;
      }
    } catch (error) {
      console.error('Ошибка при получении userId:', error);
    }

    if (!userId) {
      setErrorMessage('Не удалось определить ID пользователя');
      return;
    }

    // Получаем returnToStageId из localStorage
    let returnToStageId: number | null = null;
    try {
      const selectedStageData = localStorage.getItem('selectedStage');
      if (selectedStageData) {
        const selectedStage = JSON.parse(selectedStageData);
        returnToStageId = selectedStage.id;
      }
    } catch (error) {
      console.error('Ошибка при получении returnToStageId:', error);
    }

    if (!returnToStageId) {
      setErrorMessage('Не удалось определить ID этапа');
      return;
    }

    try {
      setIsReturning(true);
      setErrorMessage(null);

      const requestData: ReturnPartsRequestDto = {
        partId: selectedDetailId,
        palletId: returnPalletId,
        quantity: quantity,
        returnToStageId: returnToStageId,
        userId: userId
      };

      await returnParts(requestData);

      setShowReturnModal(false);
      setReturnQuantity('');
      setSuccessMessage('Детали успешно возвращены в производство');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Обновляем данные поддонов
      if (selectedDetailId) {
        await fetchPalletsByPartId(selectedDetailId, { packageId: selectedPackageId || undefined });
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Не удалось вернуть детали';
      setErrorMessage(errorMsg);
      console.error('Ошибка при возврате деталей:', err);
    } finally {
      setIsReturning(false);
    }
  };

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

  // Показываем таблицы с анимацией при открытии панели
  useEffect(() => {
    if (isOpen) {
      setShowTables(false);
      setSelectedDetailId(null);
      clearPallets();
      // Показываем таблицы с небольшой задержкой для анимации
      setTimeout(() => {
        setShowTables(true);
      }, 100);
    } else {
      setShowTables(false);
      setSelectedDetailId(null);
      clearPallets();
    }
  }, [isOpen, clearPallets]);

  // Рендеринг основного компонента
  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
    >
      <div className={styles.sidebarHeader}>
        <h2>Информация о деталях и поддонах</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.sidebarContent}>
        {loading ? (
          <div className={styles.stateContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingMessage}>
              <h3>Загрузка данных</h3>
              <p>Пожалуйста, подождите...</p>
            </div>
          </div>
        ) : error ? (
          <div className={styles.stateContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage}>
              <h3>Ошибка загрузки данных</h3>
              <p>{error.message}</p>
              <button 
                className={styles.retryButton} 
                onClick={() => selectedPackageId && fetchPartsByPackageId(selectedPackageId)}
              >
                Повторить загрузку
              </button>
            </div>
          </div>
        ) : (
          <div className={`${showTables ? styles.showDetails : styles.hideDetails}`}>
            {/* Информация об упаковке */}
            {packageInfo && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.95))',
                borderRadius: '10px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(224, 224, 224, 0.8)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>
                  Упаковка: {packageInfo.packageName}
                </h3>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
                  <span><strong>Код:</strong> {packageInfo.packageCode}</span>
                  {/* <span><strong>Готовность:</strong> {packageInfo.readiness}%</span> */}
                  <span><strong>Заказ:</strong> {packageInfo.order.batchNumber} - {packageInfo.order.orderName}</span>
                </div>
              </div>
            )}
            
            <div className={styles.tablesContainer}>
              {/* Таблица деталей */}
              <div className={styles.detailsTableContainer}>
                <h3 className={styles.tableTitle}>
                  Детали
                </h3>
                <div className={styles.tableContainer}>
                  <div className={styles.tableScrollContainer}>
                    <table className={styles.palletsTable}>
                      <thead>
                        <tr>
                          <th>Артикул</th>
                          <th>Название</th>
                          <th>Материал</th>
                          <th>Размер</th>
                          <th>Общее кол-во</th>
                          <th>Подстопное место</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parts.length > 0 ? (
                          parts.map((part, index) => (
                            <tr
                              key={part.partId}
                              className={`${styles.animatedRow} ${selectedDetailId === part.partId ? styles.processingRow : ''}`}
                              style={{ 
                                animationDelay: `${index * 0.05}s`,
                                cursor: 'pointer'
                              }}
                              onClick={() => handleDetailClick(part.partId)}
                            >
                              <td>{part.partCode}</td>
                              <td>{part.partName}</td>
                              <td>{part.material.materialName}</td>
                              <td>{part.size}</td>
                              <td>{part.totalQuantity}</td>
                              <td>-</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                              {selectedPackageId ? 'Нет деталей в данной упаковке' : 'Выберите упаковку для просмотра деталей'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Таблица поддонов для выбранной детали */}
              <div className={styles.palletsTableContainer}>
                <h3 className={`${styles.tableTitle} ${styles.palletsTableTitle}`}>
                  {selectedDetailId && partInfo
                    ? `Поддоны для ${partInfo.partCode}`
                    : 'Поддоны'
                  }
                </h3>
                {selectedDetailId && showPalletsLoading ? (
                  <div className={styles.emptyPalletsContainer}>
                    <div className={styles.emptyMessage}>
                      <div className={styles.loadingSpinner}></div>
                      <h3>Загрузка поддонов...</h3>
                      <p>Получаем данные о поддонах для выбранной детали</p>
                    </div>
                  </div>
                ) : selectedDetailId && pallets.length > 0 ? (
                  <div className={styles.tableContainer}>
                    <div className={styles.tableScrollContainer}>
                      <table className={styles.palletsTable}>
                        <thead>
                          <tr>
                            <th>Поддон</th>
                            <th>Кол-во</th>
                            <th>Адрес</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pallets.sort((a, b) => a.palletId - b.palletId).map((pallet, index) => (
                            <tr
                              key={pallet.palletId}
                              className={styles.animatedRow}
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              <td>{pallet.palletName || `Поддон №${pallet.palletId}`}</td>
                              <td className={styles.quantityCell}>
                                <button
                                  className={styles.quantityButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityClick(pallet.palletId);
                                  }}
                                  title="Действия с количеством"
                                >
                                  {pallet.quantity}
                                </button>
                              </td>
                              <td>{pallet.currentCell?.cellCode || '-'}</td>
                              <td className={styles.actionsCell}>
                                {pallet.assignedToPackage && pallet.status === 'AWAITING_PACKAGING' ? (
                                  <span className={styles.statusBadge}>
                                    Ожидает упаковки
                                  </span>
                                ) : (
                                  <button
                                    className={`${styles.actionButton} ${styles.moveToPackagingButton}`}
                                    onClick={() => handleMoveToPackaging(pallet.palletId)}
                                    disabled={movingPalletId === pallet.palletId}
                                    title="Переместить на упаковку"
                                  >
                                    {movingPalletId === pallet.palletId ? 'Перемещение...' : 'Переместить на упаковку'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyPalletsContainer}>
                    <div className={styles.emptyMessage}>
                      <div className={styles.emptyIcon}>📦</div>
                      <h3>
                        {selectedDetailId ? 'Нет поддонов' : 'Выберите деталь'}
                      </h3>
                      <p>
                        {selectedDetailId 
                          ? 'Для выбранной детали отсутствуют поддоны'
                          : 'Кликните на деталь в левой таблице, чтобы увидеть связанные с ней поддоны'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
                  handleQuantityAction('return', showQuantityMenu);
                }}
              >
                Вернуть детали
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно отбраковки деталей */}
      {showDefectModal && defectPalletId && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowDefectModal(false);
          }
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Отбраковать детали</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setShowDefectModal(false)}
                disabled={isDefecting}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.palletInfo}>
                <span>Поддон: <strong>{pallets.find(p => p.palletId === defectPalletId)?.palletName}</strong></span>
                <span>Доступно: <strong>{pallets.find(p => p.palletId === defectPalletId)?.quantity} шт.</strong></span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="defectQuantity">Количество отбракованных деталей *</label>
                <input
                  id="defectQuantity"
                  type="number"
                  min="1"
                  max={pallets.find(p => p.palletId === defectPalletId)?.quantity || 1}
                  value={defectQuantity}
                  onChange={(e) => setDefectQuantity(e.target.value)}
                  disabled={isDefecting}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="defectDescription">Описание брака (опционально)</label>
                <textarea
                  id="defectDescription"
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  placeholder="Опишите причину брака..."
                  disabled={isDefecting}
                  className={styles.formTextarea}
                  rows={3}
                />
              </div>

              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDefectModal(false)}
                disabled={isDefecting}
              >
                Отмена
              </button>
              <button 
                className={styles.createButton}
                onClick={handleDefectParts}
                disabled={isDefecting || !defectQuantity}
              >
                {isDefecting ? 'Отбраковка...' : 'Отбраковать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно возврата деталей */}
      {showReturnModal && returnPalletId && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowReturnModal(false);
          }
        }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Вернуть детали в производство</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setShowReturnModal(false)}
                disabled={isReturning}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.palletInfo}>
                <span>Поддон: <strong>{pallets.find(p => p.palletId === returnPalletId)?.palletName}</strong></span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="returnQuantity">Количество деталей *</label>
                <input
                  id="returnQuantity"
                  type="number"
                  min="1"
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  disabled={isReturning}
                  className={styles.formInput}
                />
              </div>

              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowReturnModal(false)}
                disabled={isReturning}
              >
                Отмена
              </button>
              <button 
                className={styles.createButton}
                onClick={handleReturnParts}
                disabled={isReturning || !returnQuantity}
              >
                {isReturning ? 'Возврат...' : 'Вернуть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className={styles.successNotification}>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default PackagingDetailsSidebar;