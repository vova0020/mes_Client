import React, { useState } from 'react';
import styles from './OrderDetailsModal.module.css';

interface Package {
  id: string;
  name: string;
  quantity: number;
  details: Detail[];
}

interface Detail {
  id: string;
  name: string;
  totalQuantity: number;
  route: string[];
  stages: { [key: string]: number };
  pallets: Pallet[];
  packageId: string;
}

interface Pallet {
  id: string;
  stages: { [key: string]: 'completed' | 'in-progress' | 'not-started' };
}

interface OrderDetailsModalProps {
  orderId: string;
  packages: Package[];
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, packages, onClose }) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null);

  const getStageColor = (percentage: number) => {
    if (percentage === 0) return 'linear-gradient(135deg, #fc8181, #e53e3e)';
    if (percentage < 50) return 'linear-gradient(135deg, #f6ad55, #dd6b20)';
    if (percentage < 100) return 'linear-gradient(135deg, #63b3ed, #3182ce)';
    return 'linear-gradient(135deg, #68d391, #38a169)';
  };

  const getStatusIcon = (status: 'completed' | 'in-progress' | 'not-started') => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⏳';
      case 'not-started': return '○';
    }
  };

  const getStatusColor = (status: 'completed' | 'in-progress' | 'not-started') => {
    switch (status) {
      case 'completed': return '#38a169';
      case 'in-progress': return '#dd6b20';
      case 'not-started': return '#e53e3e';
    }
  };

  const toggleDetailExpansion = (detailId: string) => {
    setExpandedDetail(expandedDetail === detailId ? null : detailId);
  };

  const handlePackageClick = (packageId: string) => {
    setSelectedPackageId(selectedPackageId === packageId ? null : packageId);
  };

  const allDetails = packages.flatMap(pkg => pkg.details);
  const allStages = Array.from(new Set(allDetails.flatMap(detail => detail.route)));

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Детали заказа {orderId}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.packagesSection}>
            <h4>Упаковки</h4>
            <div className={styles.packagesTable}>
              <table>
                <thead>
                  <tr>
                    <th>Название упаковки</th>
                    <th>Количество</th>
                    <th>Деталей</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr 
                      key={pkg.id} 
                      className={`${styles.packageRow} ${selectedPackageId === pkg.id ? styles.selectedPackage : ''}`}
                      onClick={() => handlePackageClick(pkg.id)}
                    >
                      <td>{pkg.name}</td>
                      <td>{pkg.quantity}</td>
                      <td>{pkg.details.length}</td>
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
                    <th>Название</th>
                    <th>Количество</th>
                    {allStages.map(stage => (
                      <th key={stage}>{stage}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allDetails.map((detail) => (
                    <React.Fragment key={detail.id}>
                      <tr 
                        className={`${styles.detailRow} ${
                          selectedPackageId && detail.packageId === selectedPackageId ? styles.highlightedDetail : ''
                        }`}
                        onClick={() => toggleDetailExpansion(detail.id)}
                      >
                        <td>{detail.name}</td>
                        <td>{detail.totalQuantity}</td>
                        {allStages.map(stage => (
                          <td key={stage}>
                            {detail.route.includes(stage) ? (
                              <div className={styles.stageProgress}>
                                <div 
                                  className={styles.stageBar}
                                  style={{ 
                                    width: `${detail.stages[stage] || 0}%`,
                                    background: getStageColor(detail.stages[stage] || 0)
                                  }}
                                />
                                <span>{detail.stages[stage] || 0}%</span>
                              </div>
                            ) : (
                              <span className={styles.notApplicable}>-</span>
                            )}
                          </td>
                        ))}
                        <td>
                          <span className={styles.expandIcon}>
                            {expandedDetail === detail.id ? '▼' : '▶'}
                          </span>
                        </td>
                      </tr>
                      
                      {expandedDetail === detail.id && (
                        <tr>
                          <td colSpan={allStages.length + 3}>
                            <div className={styles.palletsTable}>
                              <h5>Поддоны:</h5>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Поддон</th>
                                    {detail.route.map(stage => (
                                      <th key={stage}>{stage}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail.pallets.map((pallet) => (
                                    <tr key={pallet.id}>
                                      <td>{pallet.id}</td>
                                      {detail.route.map(stage => (
                                        <td key={stage}>
                                          <span 
                                            className={styles.statusIcon}
                                            style={{ color: getStatusColor(pallet.stages[stage]) }}
                                          >
                                            {getStatusIcon(pallet.stages[stage])}
                                          </span>
                                        </td>
                                      ))}
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
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;