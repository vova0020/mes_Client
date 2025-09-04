import React, { useState, useMemo } from 'react';
import OrderDetailsModal from './OrderDetailsModal';
import styles from './OrderDisplay.module.css';
import { useOrderStatistics, useOrderDetailedStatistics } from '../../../../hooks/orderManagementHook/useOrderStatistics';
import { OrderStatus } from '../../../../api/orderManagementApi/orderStatisticsApi';

const OrderDisplay: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [productionMin, setProductionMin] = useState(0);
  const [productionMax, setProductionMax] = useState(100);
  const [packingMin, setPackingMin] = useState(0);
  const [packingMax, setPackingMax] = useState(100);
  
  const { orders, loading, error } = useOrderStatistics();
  const { orderDetails } = useOrderDetailedStatistics(selectedOrderId);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesProduction = order.productionProgress >= productionMin && order.productionProgress <= productionMax;
      const matchesPacking = order.packingProgress >= packingMin && order.packingProgress <= packingMax;
      
      return matchesSearch && matchesStatus && matchesProduction && matchesPacking;
    });
  }, [orders, searchTerm, statusFilter, productionMin, productionMax, packingMin, packingMax]);

  const handleShowDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#ff4444';
    if (progress < 70) return '#ffaa00';
    return '#44ff44';
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'PRELIMINARY': return 'Предварительный';
      case 'APPROVED': return 'Утверждено';
      case 'LAUNCH_PERMITTED': return 'Разрешено к запуску';
      case 'IN_PROGRESS': return 'В работе';
      case 'COMPLETED': return 'Завершен';
      case 'POSTPONED': return 'Отложен';
      default: return status;
    }
  };

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return styles.statusInProgress;
      case 'COMPLETED': return styles.statusCompleted;
      case 'PRELIMINARY':
      case 'APPROVED':
      case 'LAUNCH_PERMITTED': return styles.statusPlanned;
      case 'POSTPONED': return styles.statusPostponed;
      default: return styles.statusPlanned;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.error}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Отображение заказов</h2>
      </div>
      
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск по названию заказа..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Статус:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
              className={styles.filterSelect}
            >
              <option value="ALL">Все статусы</option>
              <option value="PRELIMINARY">Предварительный</option>
              <option value="APPROVED">Утверждено</option>
              <option value="LAUNCH_PERMITTED">Разрешено к запуску</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="COMPLETED">Завершен</option>
              <option value="POSTPONED">Отложен</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Производство (%):</label>
            <div className={styles.rangeContainer}>
              <input
                type="number"
                min="0"
                max="100"
                value={productionMin === 0 ? '' : productionMin}
                onChange={(e) => setProductionMin(Number(e.target.value) || 0)}
                className={styles.rangeInput}
                placeholder="От"
              />
              <span className={styles.rangeSeparator}>-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={productionMax === 100 ? '' : productionMax}
                onChange={(e) => setProductionMax(Number(e.target.value) || 100)}
                className={styles.rangeInput}
                placeholder="До"
              />
            </div>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Упаковка (%):</label>
            <div className={styles.rangeContainer}>
              <input
                type="number"
                min="0"
                max="100"
                value={packingMin === 0 ? '' : packingMin}
                onChange={(e) => setPackingMin(Number(e.target.value) || 0)}
                className={styles.rangeInput}
                placeholder="От"
              />
              <span className={styles.rangeSeparator}>-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={packingMax === 100 ? '' : packingMax}
                onChange={(e) => setPackingMax(Number(e.target.value) || 100)}
                className={styles.rangeInput}
                placeholder="До"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.ordersTable}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.headerCell}>Заказ</th>
              <th className={styles.headerCell}>Статус</th>
              <th className={styles.headerCell}>Производство</th>
              <th className={styles.headerCell}>Упаковка</th>
              <th className={styles.headerCell}>Дата завершения</th>
              <th className={styles.headerCell}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.orderId} className={styles.tableRow}>
                <td className={styles.cell}>{order.batchNumber}</td>
                <td className={styles.cell}>
                  <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className={styles.cell}>
                  <div className={styles.progressContainer}>
                    <div 
                      className={styles.progressBar}
                      style={{ 
                        width: `${order.productionProgress}%`,
                        backgroundColor: getProgressColor(order.productionProgress)
                      }}
                    />
                    <span className={styles.progressText}>{order.productionProgress}%</span>
                  </div>
                </td>
                <td className={styles.cell}>
                  <div className={styles.progressContainer}>
                    <div 
                      className={styles.progressBar}
                      style={{ 
                        width: `${order.packingProgress}%`,
                        backgroundColor: getProgressColor(order.packingProgress)
                      }}
                    />
                    <span className={styles.progressText}>{order.packingProgress}%</span>
                  </div>
                </td>
                <td className={styles.cell}>{new Date(order.requiredDate).toLocaleDateString()}</td>
                <td className={styles.cell}>
                  <button 
                    className={styles.detailsButton}
                    onClick={() => handleShowDetails(order.orderId)}
                  >
                    Показать детали
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedOrderId && orderDetails && (
        <OrderDetailsModal
          orderId={selectedOrderId.toString()}
          orderDetails={orderDetails}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default OrderDisplay;