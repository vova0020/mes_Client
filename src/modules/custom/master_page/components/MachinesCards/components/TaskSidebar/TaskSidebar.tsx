import React, { useState, useEffect } from 'react';
import styles from './TaskSidebar.module.css';
import { machineAssignmentsApi } from '../../../../../../api/custom/machines/machineAssignmentsApi';
import useCustomMachinesMaster from '../../../../../../hooks/custom/master/useCustomMachinesMaster';

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number;
  machineName?: string;
}

const TaskSidebar: React.FC<TaskSidebarProps> = ({ 
  isOpen, 
  onClose, 
  machineId,
  machineName = 'Станок'
}) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set([]));
  const [expandedPallets, setExpandedPallets] = useState<Set<number>>(new Set());

  const { orders, loading, fetchAssignments } = useCustomMachinesMaster(machineId);

  useEffect(() => {
    if (isOpen && machineId) {
      fetchAssignments(machineId);
    }
  }, [isOpen, machineId, fetchAssignments]);

  const toggleOrder = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const togglePallet = (palletId: number) => {
    const newExpanded = new Set(expandedPallets);
    if (newExpanded.has(palletId)) {
      newExpanded.delete(palletId);
    } else {
      newExpanded.add(palletId);
    }
    setExpandedPallets(newExpanded);
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return styles.statusPending;
      case 'IN_PROGRESS':
        return styles.statusInProgress;
      case 'COMPLETED':
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Ожидание';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'COMPLETED':
        return 'Завершено';
      default:
        return 'Ожидание';
    }
  };

  // Взять в работу все детали поддона, которые еще не в работе
  const handleStartAllDetails = async (pallet: any) => {
    try {
      const pendingDetails = pallet.details.filter((d: any) => d.status === 'PENDING');
      
      for (const detail of pendingDetails) {
        await machineAssignmentsApi.startDetail(detail.assignmentPartId);
      }
      
      await fetchAssignments(machineId);
    } catch (err: any) {
      console.error('Ошибка начала работы над деталями:', err);
    }
  };

  // Завершить все детали поддона, которые еще не завершены
  const handleCompleteAllDetails = async (pallet: any) => {
    try {
      const inProgressDetails = pallet.details.filter((d: any) => d.status === 'IN_PROGRESS');
      
      for (const detail of inProgressDetails) {
        await machineAssignmentsApi.completeDetail(detail.assignmentPartId, {
          processedQuantity: detail.plannedQuantity
        });
      }
      
      await fetchAssignments(machineId);
    } catch (err: any) {
      console.error('Ошибка завершения работы над деталями:', err);
    }
  };

  // Проверить, все ли детали в работе
  const areAllDetailsInProgress = (pallet: any): boolean => {
    return pallet.details.every((d: any) => d.status === 'IN_PROGRESS' || d.status === 'COMPLETED');
  };

  // Проверить, все ли детали завершены
  const areAllDetailsCompleted = (pallet: any): boolean => {
    return pallet.details.every((d: any) => d.status === 'COMPLETED');
  };

  // Проверить, есть ли хотя бы одна деталь в работе
  const hasDetailsInProgress = (pallet: any): boolean => {
    return pallet.details.some((d: any) => d.status === 'IN_PROGRESS');
  };

  const handleStartDetail = async (assignmentPartId: number) => {
    try {
      await machineAssignmentsApi.startDetail(assignmentPartId);
      await fetchAssignments(machineId);
    } catch (err: any) {
      console.error('Ошибка начала работы над деталью:', err);
    }
  };

  const handleCompleteDetail = async (assignmentPartId: number, processedQuantity: number) => {
    try {
      await machineAssignmentsApi.completeDetail(assignmentPartId, { processedQuantity });
      await fetchAssignments(machineId);
    } catch (err: any) {
      console.error('Ошибка завершения работы над деталью:', err);
    }
  };

  const handleDeletePallet = async (assignmentId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот поддон?')) {
      try {
        await machineAssignmentsApi.deleteAssignment(assignmentId);
        await fetchAssignments(machineId);
      } catch (err: any) {
        console.error('Ошибка удаления задания:', err);
      }
    }
  };

  const handleDeleteDetail = async (assignmentPartId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту деталь?')) {
      try {
        await machineAssignmentsApi.deleteDetail(assignmentPartId);
        await fetchAssignments(machineId);
      } catch (err: any) {
        console.error('Ошибка удаления детали:', err);
      }
    }
  };

  const handleReassignMachine = (itemId: number, itemType: 'pallet' | 'detail') => {
    console.log(`Переназначить станок для ${itemType}:`, itemId);
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2>Сменное задание: {machineName}</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.sidebarContent}>
        {orders.map((order) => (
          <div key={order.orderId} className={styles.orderGroup}>
            <div 
              className={styles.orderHeader}
              onClick={() => toggleOrder(order.orderId)}
            >
              <div className={styles.expandIcon}>
                {expandedOrders.has(order.orderId) ? '▼' : '▶'}
              </div>
              <div className={styles.orderInfo}>
                <div className={styles.orderTitle}>Заказ: {order.orderName}</div>
                <div className={styles.orderStats}>
                  Всего поддонов: {order.totalPallets} шт. (Деталей {order.totalDetails})
                </div>
              </div>
            </div>

            {expandedOrders.has(order.orderId) && (
              <div className={styles.palletsContainer}>
                {order.pallets.map((pallet) => (
                  <div key={pallet.assignmentId} className={styles.palletGroup}>
                    <div 
                      className={styles.palletHeader}
                      onClick={() => togglePallet(pallet.assignmentId)}
                    >
                      <div className={styles.expandIcon}>
                        {expandedPallets.has(pallet.assignmentId) ? '▼' : '▶'}
                      </div>
                      <div className={styles.palletInfo}>
                        <div className={styles.palletNumber}>№ поддона</div>
                        <div className={styles.palletValue}>{pallet.palletNumber}</div>
                      </div>
                      <div className={styles.palletInfo}>
                        <div className={styles.palletLabel}>Материалы</div>
                        <div className={styles.palletValue}>
                          {pallet.details.map(d => d.materialName).join(', ')}
                        </div>
                      </div>
                      <div className={styles.palletInfo}>
                        <div className={styles.palletLabel}>Статус</div>
                        <div className={`${styles.statusIndicator} ${getStatusClass(pallet.status)}`}>
                          {getStatusText(pallet.status)}
                        </div>
                      </div>
                      <div className={styles.palletInfo}>
                        <div className={styles.palletLabel}>Деталей на поддоне</div>
                        <div className={styles.palletValue}>{pallet.details.reduce((sum, d) => sum + d.plannedQuantity, 0)}</div>
                      </div>
                      <div className={styles.palletActions} onClick={(e) => e.stopPropagation()}>
                        {!areAllDetailsCompleted(pallet) && (
                          <>
                            {!areAllDetailsInProgress(pallet) && (
                              <button
                                className={`${styles.actionButton} ${styles.startButton}`}
                                onClick={() => handleStartAllDetails(pallet)}
                              >
                                Взять в работу все
                              </button>
                            )}
                            {hasDetailsInProgress(pallet) && areAllDetailsInProgress(pallet) && (
                              <button
                                className={`${styles.actionButton} ${styles.completeButton}`}
                                onClick={() => handleCompleteAllDetails(pallet)}
                              >
                                Завершить все
                              </button>
                            )}
                          </>
                        )}
                        <input 
                          type="text" 
                          className={styles.machineInput}
                          placeholder="Переназначить станок"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDeletePallet(pallet.assignmentId)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    {expandedPallets.has(pallet.assignmentId) && (
                      <div className={styles.detailsContainer}>
                        <div className={styles.detailsHeader}>
                          <span>Артикул детали</span>
                          <span>Название детали</span>
                          <span>Материал</span>
                          <span>Размер</span>
                          <span>Количество</span>
                          <span>Статус</span>
                          <span>Переназначить станок</span>
                        </div>

                        {pallet.details.map((detail) => (
                          <div key={detail.assignmentPartId} className={styles.detailRow}>
                            <div className={styles.detailCell} data-label="Артикул детали">
                              {detail.partCode}
                            </div>
                            <div className={styles.detailCell} data-label="Название детали">
                              {detail.partName}
                            </div>
                            <div className={styles.detailCell} data-label="Материал">
                              {detail.materialName}
                            </div>
                            <div className={styles.detailCell} data-label="Размер">
                              {detail.size}
                            </div>
                            <div className={styles.detailCell} data-label="Количество">
                              {detail.plannedQuantity}
                            </div>
                            <div className={styles.detailCell} data-label="Статус">
                              <div className={`${styles.statusIndicator} ${getStatusClass(detail.status)}`}>
                                {getStatusText(detail.status)}
                              </div>
                            </div>
                            <div className={styles.detailCell} data-label="Действия">
                              <div className={styles.detailActions}>
                                {detail.status === 'PENDING' && (
                                  <button
                                    className={`${styles.actionButton} ${styles.startButton}`}
                                    onClick={() => handleStartDetail(detail.assignmentPartId)}
                                  >
                                    В работу
                                  </button>
                                )}
                                {detail.status === 'IN_PROGRESS' && (
                                  <button
                                    className={`${styles.actionButton} ${styles.completeButton}`}
                                    onClick={() => handleCompleteDetail(detail.assignmentPartId, detail.plannedQuantity)}
                                  >
                                    Завершить
                                  </button>
                                )}
                                <input
                                  type="text"
                                  className={styles.machineInput}
                                  placeholder="Переназначить"
                                />
                                <button
                                  className={`${styles.actionButton} ${styles.deleteButton}`}
                                  onClick={() => handleDeleteDetail(detail.assignmentPartId)}
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskSidebar;
