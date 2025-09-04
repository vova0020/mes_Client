import React, { useState } from 'react';
import styles from './OrderDetailsModal.module.css';
import { OrderDetailedStatistic, PalletStageStatus } from '../../../../api/orderManagementApi/orderStatisticsApi';

interface OrderDetailsModalProps {
  orderId: string;
  orderDetails: OrderDetailedStatistic;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, orderDetails, onClose }) => {
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);

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
    console.log('Package clicked:', packageId);
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Детали заказа {orderDetails.batchNumber}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
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
                    <th>Деталей</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.packages.map((pkg) => (
                    <tr 
                      key={pkg.packageId} 
                      className={`${styles.packageRow} ${selectedPackageId === pkg.packageId ? styles.selectedPackage : ''}`}
                      onClick={() => handlePackageClick(pkg.packageId)}
                    >
                      <td>{pkg.packageCode}</td>
                      <td>{pkg.packageName}</td>
                      <td>{pkg.quantity}</td>
                      <td>{pkg.partCount}</td>
                    </tr>
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
                          <td colSpan={allStages.length + 3}>
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
  );
};

export default OrderDetailsModal;