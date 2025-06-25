import React, { useState, useEffect, useRef } from 'react';
import styles from './PalletsSidebar.module.css';
import { useParts, usePallets } from '../../../hooks/ypakMasterHook';

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
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [showPalletsLoading, setShowPalletsLoading] = useState<boolean>(false);

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
      fetchPalletsByPartId(partId);
    }
  };

  // Обработчик кнопки "Переместить на упаковку"
  const handleMoveToPackaging = (palletId: number) => {
    console.log(`Перемещение поддона ${palletId} на упаковку`);
    // Здесь будет логика перемещения поддона на упаковку
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
        <h2>Детали и поддоны</h2>
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
                  <span><strong>Готовность:</strong> {packageInfo.completionPercentage}%</span>
                  <span><strong>Заказ:</strong> {packageInfo.order.orderName}</span>
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
                          {pallets.map((pallet, index) => (
                            <tr
                              key={pallet.palletId}
                              className={styles.animatedRow}
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              <td>{pallet.palletName}</td>
                              <td>{pallet.quantity}</td>
                              <td>{pallet.currentCell?.cellCode || '-'}</td>
                              <td className={styles.actionsCell}>
                                <button
                                  className={`${styles.actionButton} ${styles.moveToPackagingButton}`}
                                  onClick={() => handleMoveToPackaging(pallet.palletId)}
                                  title="Переместить на упаковку"
                                >
                                  Переместить на упаковку
                                </button>
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
    </div>
  );
};

export default PackagingDetailsSidebar;