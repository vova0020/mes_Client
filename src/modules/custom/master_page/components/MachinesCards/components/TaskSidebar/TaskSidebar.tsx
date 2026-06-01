import React, { useState } from 'react';
import styles from './TaskSidebar.module.css';

// Типы данных
interface Detail {
  id: number;
  detailArticle: string;
  detailName: string;
  material: string;
  size: string;
  quantity: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface Pallet {
  id: number;
  palletNumber: string;
  details: Detail[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface Order {
  id: number;
  orderName: string;
  totalPallets: number;
  totalDetails: number;
  pallets: Pallet[];
}

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number;
  machineName?: string;
}

// Тестовые данные
const mockData: Order[] = [
  {
    id: 1,
    orderName: '303/145 Очень важный',
    totalPallets: 2,
    totalDetails: 666,
    pallets: [
      {
        id: 1,
        palletNumber: 'ABCD-ABCD-38',
        status: 'IN_PROGRESS',
        details: [
          {
            id: 1,
            detailArticle: 'ABCD-ABCD-38',
            detailName: 'Боковина шкафа правая/левая кривая',
            material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
            size: '2050x650',
            quantity: 25,
            status: 'IN_PROGRESS'
          },
          {
            id: 2,
            detailArticle: 'ABCD-ABCD-38',
            detailName: 'Боковина шкафа правая/левая кривая',
            material: 'ЛДСП Дуб Сонома темный - 16мм (23)',
            size: '2050x650',
            quantity: 25,
            status: 'PENDING'
          },
          {
            id: 3,
            detailArticle: 'ABCD-ABCD-38',
            detailName: 'Боковина шкафа правая/левая кривая',
            material: 'ЛМДФ - 16мм (15)',
            size: '2050x650',
            quantity: 25,
            status: 'PENDING'
          }
        ]
      },
      {
        id: 2,
        palletNumber: 'ABCD-ABCD-38',
        status: 'PENDING',
        details: [
          {
            id: 4,
            detailArticle: 'ABCD-ABCD-38',
            detailName: 'Боковина шкафа правая/левая кривая',
            material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
            size: '2050x650',
            quantity: 111,
            status: 'PENDING'
          }
        ]
      }
    ]
  },
  {
    id: 2,
    orderName: '304/150 Срочный заказ',
    totalPallets: 1,
    totalDetails: 150,
    pallets: [
      {
        id: 3,
        palletNumber: 'EFGH-EFGH-42',
        status: 'PENDING',
        details: [
          {
            id: 5,
            detailArticle: 'EFGH-EFGH-42',
            detailName: 'Полка верхняя',
            material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
            size: '1800x400',
            quantity: 50,
            status: 'PENDING'
          },
          {
            id: 6,
            detailArticle: 'EFGH-EFGH-42',
            detailName: 'Полка нижняя',
            material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
            size: '1800x400',
            quantity: 50,
            status: 'PENDING'
          },
          {
            id: 7,
            detailArticle: 'EFGH-EFGH-42',
            detailName: 'Полка средняя',
            material: 'ЛДСП Дуб Сонома светлый - 16мм (50)',
            size: '1800x400',
            quantity: 50,
            status: 'PENDING'
          }
        ]
      }
    ]
  }
];

const TaskSidebar: React.FC<TaskSidebarProps> = ({ 
  isOpen, 
  onClose, 
  machineId,
  machineName = 'Станок'
}) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set([1]));
  const [expandedPallets, setExpandedPallets] = useState<Set<number>>(new Set());
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());

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

  const toggleDetail = (detailId: number) => {
    const newExpanded = new Set(expandedDetails);
    if (newExpanded.has(detailId)) {
      newExpanded.delete(detailId);
    } else {
      newExpanded.add(detailId);
    }
    setExpandedDetails(newExpanded);
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

  const handleStartPallet = (palletId: number) => {
    console.log('Взять в работу поддон:', palletId);
    // TODO: API вызов
  };

  const handleCompletePallet = (palletId: number) => {
    console.log('Завершить работу над поддоном:', palletId);
    // TODO: API вызов
  };

  const handleStartDetail = (detailId: number) => {
    console.log('Взять в работу деталь:', detailId);
    // TODO: API вызов
  };

  const handleCompleteDetail = (detailId: number) => {
    console.log('Завершить работу над деталью:', detailId);
    // TODO: API вызов
  };

  const handleDeletePallet = (palletId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот поддон?')) {
      console.log('Удалить поддон:', palletId);
      // TODO: API вызов
    }
  };

  const handleDeleteDetail = (detailId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту деталь?')) {
      console.log('Удалить деталь:', detailId);
      // TODO: API вызов
    }
  };

  const handleReassignMachine = (itemId: number, itemType: 'pallet' | 'detail') => {
    console.log(`Переназначить станок для ${itemType}:`, itemId);
    // TODO: API вызов
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2>Сменное задание: {machineName}</h2>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.sidebarContent}>
        {mockData.map((order) => (
          <div key={order.id} className={styles.orderGroup}>
            {/* Уровень 1: Заказ */}
            <div 
              className={styles.orderHeader}
              onClick={() => toggleOrder(order.id)}
            >
              <div className={styles.expandIcon}>
                {expandedOrders.has(order.id) ? '▼' : '▶'}
              </div>
              <div className={styles.orderInfo}>
                <div className={styles.orderTitle}>Заказ: {order.orderName}</div>
                <div className={styles.orderStats}>
                  Всего поддонов: {order.totalPallets} шт. (Деталей {order.totalDetails})
                </div>
              </div>
            </div>

            {/* Уровень 2: Поддоны */}
            {expandedOrders.has(order.id) && (
              <div className={styles.palletsContainer}>
                {order.pallets.map((pallet) => (
                  <div key={pallet.id} className={styles.palletGroup}>
                    <div 
                      className={styles.palletHeader}
                      onClick={() => togglePallet(pallet.id)}
                    >
                      <div className={styles.expandIcon}>
                        {expandedPallets.has(pallet.id) ? '▼' : '▶'}
                      </div>
                      <div className={styles.palletInfo}>
                        <div className={styles.palletNumber}>№ поддона</div>
                        <div className={styles.palletValue}>{pallet.palletNumber}</div>
                      </div>
                      <div className={styles.palletInfo}>
                        <div className={styles.palletLabel}>Материалы</div>
                        <div className={styles.palletValue}>
                          {pallet.details.map(d => d.material).join(', ')}
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
                        <div className={styles.palletValue}>{pallet.details.reduce((sum, d) => sum + d.quantity, 0)}</div>
                      </div>
                      <div className={styles.palletActions} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className={`${styles.actionButton} ${styles.startButton}`}
                          onClick={() => handleStartPallet(pallet.id)}
                          disabled={pallet.status === 'IN_PROGRESS' || pallet.status === 'COMPLETED'}
                        >
                          Начать/Завершить
                        </button>
                        <input 
                          type="text" 
                          className={styles.machineInput}
                          placeholder="Переназначить станок"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDeletePallet(pallet.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    {/* Уровень 3: Детали */}
                    {expandedPallets.has(pallet.id) && (
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
                          <div key={detail.id} className={styles.detailRow}>
                            <div className={styles.detailCell} data-label="Артикул детали">
                              {detail.detailArticle}
                            </div>
                            <div className={styles.detailCell} data-label="Название детали">
                              {detail.detailName}
                            </div>
                            <div className={styles.detailCell} data-label="Материал">
                              {detail.material}
                            </div>
                            <div className={styles.detailCell} data-label="Размер">
                              {detail.size}
                            </div>
                            <div className={styles.detailCell} data-label="Количество">
                              {detail.quantity}
                            </div>
                            <div className={styles.detailCell} data-label="Статус">
                              <div className={`${styles.statusIndicator} ${getStatusClass(detail.status)}`}>
                                {getStatusText(detail.status)}
                              </div>
                            </div>
                            <div className={styles.detailCell} data-label="Действия">
                              <div className={styles.detailActions}>
                                <button
                                  className={`${styles.actionButton} ${styles.startButton}`}
                                  onClick={() => handleStartDetail(detail.id)}
                                  disabled={detail.status === 'IN_PROGRESS' || detail.status === 'COMPLETED'}
                                >
                                  Начать/Завершить
                                </button>
                                <input
                                  type="text"
                                  className={styles.machineInput}
                                  placeholder="Переназначить"
                                />
                                <button
                                  className={`${styles.actionButton} ${styles.deleteButton}`}
                                  onClick={() => handleDeleteDetail(detail.id)}
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
