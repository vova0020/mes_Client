import React, { useState, useEffect, useRef } from 'react';
import styles from './OrderDetailsModal.module.css';
import { OrderDetailedStatistic, PalletStageStatus } from '../../../../api/orderManagementApi/orderStatisticsApi';
import { orderManagementApi } from '../../../../api/orderManagementApi';

interface OrderDetailsModalProps {
  orderId: string;
  orderDetails: OrderDetailedStatistic;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, orderDetails, onClose }) => {
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmClickCount, setConfirmClickCount] = useState(0);
  const [isForceClosing, setIsForceClosing] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 0.1);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true);
    setConfirmClickCount(0);
  };

  const handleConfirmClick = async () => {
    const newCount = confirmClickCount + 1;
    setConfirmClickCount(newCount);

    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }

    if (newCount >= 3) {
      // Выполняем принудительное закрытие
      setIsForceClosing(true);
      try {
        await orderManagementApi.forceCompleteOrder(Number(orderId));
        setShowConfirmModal(false);
        setConfirmClickCount(0);
        handleClose();
      } catch (error) {
        console.error('Ошибка при принудительном закрытии заказа:', error);
        alert(error instanceof Error ? error.message : 'Произошла ошибка при закрытии заказа');
        setIsForceClosing(false);
        setConfirmClickCount(0);
      }
    } else {
      // Сброс счётчика если долго не нажимают
      confirmTimerRef.current = window.setTimeout(() => {
        setConfirmClickCount(0);
      }, 5000);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmClickCount(0);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }
  };

  const getStageColor = (percentage: number) => {
    if (percentage === 0) return 'linear-gradient(135deg, #fc8181, #e53e3e)';
    if (percentage < 50) return 'linear-gradient(135deg, #f6ad55, #dd6b20)';
    if (percentage < 100) return 'linear-gradient(135deg, #63b3ed, #3182ce)';
    return 'linear-gradient(135deg, #68d391, #38a169)';
  };

  const getStatusIcon = (status: PalletStageStatus) => {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'IN_PROGRESS': return '⏳';
      case 'NOT_STARTED': return '○';
    }
  };

  const getStatusColor = (status: PalletStageStatus) => {
    switch (status) {
      case 'COMPLETED': return '#38a169';
      case 'IN_PROGRESS': return '#dd6b20';
      case 'NOT_STARTED': return '#e53e3e';
    }
  };

  const toggleDetailExpansion = (detailId: number) => {
    setExpandedDetail(expandedDetail === detailId ? null : detailId);
  };

  const handlePackageClick = (packageId: number) => {
    setSelectedPackageId(selectedPackageId === packageId ? null : packageId);
  };

  const isPartRelatedToPackage = (partId: number, packageId: number | null) => {
    if (!packageId) return false;
    const selectedPackage = orderDetails.packages.find(pkg => pkg.packageId === packageId);
    const part = orderDetails.parts.find(p => p.partId === partId);
    const isRelated = part?.packages.includes(selectedPackage?.packageName || '') || false;
    return isRelated;
  };

  const allStages = Array.from(new Set(orderDetails.parts.flatMap(part =>
    part.stages.map(stage => stage.stageName)
  )));

  // Вычисляем текст кнопки подтверждения
  const getConfirmButtonText = () => {
    if (isForceClosing) return 'Закрытие заказа...';
    if (confirmClickCount === 0) return 'Подтверждаю принудительное закрытие';
    if (confirmClickCount === 1) return `Подтверждаю (ещё ${3 - confirmClickCount} раза)`;
    if (confirmClickCount === 2) return `Подтверждаю (ещё ${3 - confirmClickCount} раз)`;
    return 'Подтверждаю принудительное закрытие';
  };

  return (
    <>
      <div className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`} onClick={handleClose}>
        <div className={`${styles.modalContent} ${isVisible ? styles.slideIn : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <h3>Детали заказа {orderDetails.batchNumber}</h3>
              {orderDetails.status !== 'COMPLETED' && (
                <button
                  className={styles.forceCloseButton}
                  onClick={handleOpenConfirmModal}
                  title="Принудительно закрыть заказ"
                >
                  ⚠️ Принудительно закрыть
                </button>
              )}
            </div>
            <button className={styles.closeButton} onClick={handleClose}>×</button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.packagesSection}>
              <h4>Упаковки</h4>
              <div className={styles.packagesTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Код упаковки</th>
                      <th>Название упаковки</th>
                      <th>Количество</th>
                      <th>Закрыто</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.packages.map((pkg) => (
                      <React.Fragment key={pkg.packageId}>
                        <tr
                          className={`${styles.packageRow} ${selectedPackageId === pkg.packageId ? styles.selectedPackage : ''}`}
                          onClick={() => handlePackageClick(pkg.packageId)}
                        >
                          <td>{pkg.packageCode}</td>
                          <td>{pkg.packageName}</td>
                          <td>{pkg.quantity}</td>
                          <td>
                            <span className={styles.closedQuantity}>
                              {pkg.completedPackagesCount || 0} / {pkg.quantity}
                            </span>
                          </td>
                          <td>
                            <span className={styles.expandIcon}>
                              {selectedPackageId === pkg.packageId ? '▼' : '▶'}
                            </span>
                          </td>
                        </tr>
                        {selectedPackageId === pkg.packageId && pkg.details && pkg.details.length > 0 && (
                          <tr>
                            <td colSpan={5}>
                              <div className={styles.packageDetailsTable}>
                                <h5>Детали упаковки:</h5>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Артикул детали</th>
                                      <th>Деталь</th>
                                      <th>Количество на упаковку</th>
                                      <th>Общее количество</th>
                                      <th title="Отбраковано / Возвращено" style={{ cursor: 'help', textAlign: 'center' }}>⚠️</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {pkg.details.map((detail) => (
                                      <tr key={detail.partId}>
                                        <td>{detail.partCode}</td>
                                        <td>{detail.partName}</td>
                                        <td>{detail.quantityPerPackage}</td>
                                        <td>{detail.totalQuantity}</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>
                                          <div style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            backgroundColor: (detail.totalDefected || 0) === 0
                                              ? 'rgba(76, 175, 80, 0.1)'
                                              : (detail.totalDefected || 0) === (detail.totalReturned || 0)
                                              ? 'rgba(33, 150, 243, 0.1)'
                                              : 'rgba(255, 152, 0, 0.1)',
                                            color: (detail.totalDefected || 0) === 0
                                              ? '#4caf50'
                                              : (detail.totalDefected || 0) === (detail.totalReturned || 0)
                                              ? '#2196f3'
                                              : '#ff9800',
                                            border: `1px solid ${(detail.totalDefected || 0) === 0
                                              ? '#4caf50'
                                              : (detail.totalDefected || 0) === (detail.totalReturned || 0)
                                              ? '#2196f3'
                                              : '#ff9800'}`
                                          }}>
                                            {detail.totalDefected || 0} / {detail.totalReturned || 0}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.detailsSection}>
              <h4>Детали</h4>
              <div className={styles.detailsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Код</th>
                      <th>Название</th>
                      <th>Количество</th>
                      <th title="Отбраковано / Возвращено" style={{ cursor: 'help', textAlign: 'center' }}>⚠️</th>
                      {allStages.map(stage => (
                        <th key={stage}>{stage}</th>
                      ))}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.parts.map((part) => (
                      <React.Fragment key={part.partId}>
                        <tr
                          className={`${styles.detailRow} ${isPartRelatedToPackage(part.partId, selectedPackageId) ? styles.highlightedDetail : ''}`}
                          onClick={() => toggleDetailExpansion(part.partId)}
                        >
                          <td>{part.partCode}</td>
                          <td>{part.partName}</td>
                          <td>{part.totalQuantity}</td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: (part.totalDefected || 0) === 0
                                ? 'rgba(76, 175, 80, 0.1)'
                                : (part.totalDefected || 0) === (part.totalReturned || 0)
                                ? 'rgba(33, 150, 243, 0.1)'
                                : 'rgba(255, 152, 0, 0.1)',
                              color: (part.totalDefected || 0) === 0
                                ? '#4caf50'
                                : (part.totalDefected || 0) === (part.totalReturned || 0)
                                ? '#2196f3'
                                : '#ff9800',
                              border: `1px solid ${(part.totalDefected || 0) === 0
                                ? '#4caf50'
                                : (part.totalDefected || 0) === (part.totalReturned || 0)
                                ? '#2196f3'
                                : '#ff9800'}`
                            }}>
                              {part.totalDefected || 0} / {part.totalReturned || 0}
                            </div>
                          </td>
                          {allStages.map(stageName => {
                            const stage = part.stages.find(s => s.stageName === stageName);
                            return (
                              <td key={stageName}>
                                {stage ? (
                                  <div className={styles.stageProgress}>
                                    <div
                                      className={styles.stageBar}
                                      style={{
                                        width: `${stage.completionPercentage}%`,
                                        background: getStageColor(stage.completionPercentage)
                                      }}
                                    />
                                    <span>{stage.completionPercentage}%</span>
                                  </div>
                                ) : (
                                  <span className={styles.notApplicable}>-</span>
                                )}
                              </td>
                            );
                          })}
                          <td>
                            <span className={styles.expandIcon}>
                              {expandedDetail === part.partId ? '▼' : '▶'}
                            </span>
                          </td>
                        </tr>

                        {expandedDetail === part.partId && (
                          <tr>
                            <td colSpan={allStages.length + 4}>
                              <div className={styles.palletsTable}>
                                <h5>Поддоны:</h5>
                                {part.pallets && part.pallets.length > 0 ? (
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Название поддона</th>
                                        <th>Количество</th>
                                        {allStages.map(stage => (
                                          <th key={stage}>{stage}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {part.pallets.map((pallet) => (
                                        <tr key={pallet.palletId}>
                                          <td>{pallet.palletName}</td>
                                          <td>{pallet.quantity}</td>
                                          {allStages.map(stageName => {
                                            const stage = pallet.stages.find(s => s.stageName === stageName);
                                            return (
                                              <td key={stageName}>
                                                {stage ? (
                                                  <span
                                                    className={styles.statusIcon}
                                                    style={{ color: getStatusColor(stage.status) }}
                                                  >
                                                    {getStatusIcon(stage.status)}
                                                  </span>
                                                ) : (
                                                  <span className={styles.notApplicable}>-</span>
                                                )}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className={styles.noPallets}>
                                    Поддоны еще не сформированы
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения принудительного закрытия */}
      {showConfirmModal && (
        <div className={styles.confirmOverlay} onClick={handleCancelConfirm}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <div className={styles.warningIcon}>⚠️</div>
              <h3>Принудительное закрытие заказа</h3>
            </div>
            <div className={styles.confirmBody}>
              <p className={styles.warningText}>
                <strong>ВНИМАНИЕ!</strong> Вы собираетесь принудительно закрыть заказ{' '}
                <strong>{orderDetails.batchNumber}</strong>.
              </p>
              <p className={styles.warningDescription}>
                Это действие повлияет на статистику в системе и установит заказ как завершенный,
                независимо от текущего состояния производства.
              </p>
              <div className={styles.warningList}>
                <p><strong>Последствия:</strong></p>
                <ul>
                  <li>Заказ будет помечен как завершенный</li>
                  <li>Изменится статистика выполнения</li>
                  <li>Действие необратимо</li>
                </ul>
              </div>

              {/* Индикатор прогресса подтверждения */}
              <div className={styles.confirmProgress}>
                <p className={styles.confirmProgressText}>
                  Для подтверждения нажмите кнопку <strong>3 раза</strong>
                </p>
                <div className={styles.confirmDots}>
                  <div className={`${styles.confirmDot} ${confirmClickCount >= 1 ? styles.confirmDotActive : ''}`} />
                  <div className={`${styles.confirmDot} ${confirmClickCount >= 2 ? styles.confirmDotActive : ''}`} />
                  <div className={`${styles.confirmDot} ${confirmClickCount >= 3 ? styles.confirmDotActive : ''}`} />
                </div>
              </div>
            </div>
            <div className={styles.confirmFooter}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelConfirm}
                disabled={isForceClosing}
              >
                Отмена
              </button>
              <button
                className={`${styles.confirmButton} ${confirmClickCount > 0 ? styles.confirmButtonActive : ''}`}
                onClick={handleConfirmClick}
                disabled={isForceClosing}
              >
                {getConfirmButtonText()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailsModal;
