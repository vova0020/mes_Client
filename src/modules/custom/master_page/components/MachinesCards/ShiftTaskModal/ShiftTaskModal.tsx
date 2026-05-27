import React, { useState } from 'react';
import styles from './ShiftTaskModal.module.css';

interface Part {
  id: number;
  articleNumber: string;
  name: string;
  material: string;
  size: string;
  quantity: number;
  status: string;
}

interface Pallet {
  id: number;
  palletNumber: string;
  materials: string;
  status: string;
  detailsCount: number;
  parts: Part[];
}

interface Order {
  id: number;
  orderNumber: string;
  palletsTotal: number;
  detailsTotal: number;
  materials: string;
  pallets: Pallet[];
}

interface ShiftTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: number;
}

const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    orderNumber: '303/145 Очень важный',
    palletsTotal: 3,
    detailsTotal: 666,
    materials: '5шт',
    pallets: [
      {
        id: 1,
        palletNumber: 'ABCD-ABCD-38',
        materials: 'ЛДСП Дуб Сонома светлый - 16мм (50), ЛДСП Дуб Сонома темный - 16мм (23), ЛМДФ - 16мм (15)',
        status: 'В работе',
        detailsCount: 111,
        parts: [
          { id: 1, articleNumber: 'ABCD-ABCD-38', name: 'Боковина шкафа правая/левая кривая', material: 'ЛДСП Дуб Сонома светлый - 16мм', size: '2050x650', quantity: 25, status: 'В работе' },
          { id: 2, articleNumber: 'ABCD-ABCD-39', name: 'Полка верхняя', material: 'ЛДСП Дуб Сонома темный - 16мм', size: '1800x400', quantity: 30, status: 'В работе' },
          { id: 3, articleNumber: 'ABCD-ABCD-40', name: 'Дверца фасадная', material: 'ЛМДФ - 16мм', size: '2000x600', quantity: 15, status: 'Ожидание' },
        ]
      },
      {
        id: 2,
        palletNumber: 'ABCD-ABCD-39',
        materials: 'ЛДСП Дуб Сонома светлый - 16мм (40), ЛМДФ - 16мм (20)',
        status: 'Ожидание',
        detailsCount: 88,
        parts: [
          { id: 4, articleNumber: 'ABCD-ABCD-41', name: 'Столешница', material: 'ЛДСП Дуб Сонома светлый - 16мм', size: '2400x600', quantity: 20, status: 'Ожидание' },
          { id: 5, articleNumber: 'ABCD-ABCD-42', name: 'Задняя стенка', material: 'ЛМДФ - 16мм', size: '2000x800', quantity: 20, status: 'Ожидание' },
        ]
      },
      {
        id: 3,
        palletNumber: 'ABCD-ABCD-40',
        materials: 'ЛДСП Дуб Сонома темный - 16мм (60)',
        status: 'Завершено',
        detailsCount: 60,
        parts: []
      }
    ]
  },
  {
    id: 2,
    orderNumber: '304/150 Срочный',
    palletsTotal: 2,
    detailsTotal: 200,
    materials: '3шт',
    pallets: [
      {
        id: 4,
        palletNumber: 'EFGH-EFGH-50',
        materials: 'ЛДСП Венге - 18мм (100)',
        status: 'В работе',
        detailsCount: 100,
        parts: [
          { id: 6, articleNumber: 'EFGH-EFGH-50', name: 'Боковина тумбы', material: 'ЛДСП Венге - 18мм', size: '800x400', quantity: 50, status: 'В работе' },
          { id: 7, articleNumber: 'EFGH-EFGH-51', name: 'Полка внутренняя', material: 'ЛДСП Венге - 18мм', size: '750x350', quantity: 50, status: 'Ожидание' },
        ]
      },
      {
        id: 5,
        palletNumber: 'EFGH-EFGH-51',
        materials: 'ЛДСП Венге - 18мм (100)',
        status: 'Ожидание',
        detailsCount: 100,
        parts: []
      }
    ]
  }
];

const ShiftTaskModal: React.FC<ShiftTaskModalProps> = ({ isOpen, onClose, machineId }) => {
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [expandedPallets, setExpandedPallets] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleOrder = (orderId: number) => {
    setExpandedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const togglePallet = (palletId: number) => {
    setExpandedPallets(prev =>
      prev.includes(palletId) ? prev.filter(id => id !== palletId) : [...prev, palletId]
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Сменное задание - Станок {machineId}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {MOCK_ORDERS.map(order => (
            <div key={order.id} className={styles.orderRow}>
              <div className={styles.orderHeader} onClick={() => toggleOrder(order.id)}>
                <div className={styles.orderInfo}>
                  <div className={styles.orderTitle}>Заказ: {order.orderNumber}</div>
                  <div className={styles.orderDetail}>Всего поддонов: {order.palletsTotal}шт (Деталей {order.detailsTotal})</div>
                  <div className={styles.orderDetail}>Материалы: {order.materials}</div>
                </div>
                <div className={`${styles.expandIcon} ${expandedOrders.includes(order.id) ? styles.expanded : ''}`}>
                  ▶
                </div>
              </div>

              {expandedOrders.includes(order.id) && (
                <div className={styles.palletsContainer}>
                  {order.pallets.map(pallet => (
                    <div key={pallet.id} className={styles.palletRow}>
                      <div className={styles.palletHeader}>
                        <div className={styles.palletMainInfo} onClick={() => togglePallet(pallet.id)}>
                          <div className={`${styles.expandIcon} ${expandedPallets.includes(pallet.id) ? styles.expanded : ''}`}>
                            ▶
                          </div>
                          <div className={`${styles.palletCell} ${styles.bold}`}>
                            {pallet.palletNumber}
                          </div>
                          <div className={styles.palletCell}>
                            <div className={styles.materials}>{pallet.materials}</div>
                          </div>
                          <div className={styles.palletCell}>
                            <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>
                              {pallet.status}
                            </span>
                          </div>
                          <div className={styles.palletCell}>
                            {pallet.detailsCount} шт.
                          </div>
                        </div>
                        <div className={styles.palletActions}>
                          <button className={styles.actionButton} onClick={(e) => e.stopPropagation()}>Начать/Завершить</button>
                          <button className={styles.actionButton} onClick={(e) => e.stopPropagation()}>Переназначить</button>
                          <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={(e) => e.stopPropagation()}>Удалить</button>
                        </div>
                      </div>

                      {expandedPallets.includes(pallet.id) && pallet.parts.length > 0 && (
                        <div className={styles.partsContainer}>
                          <table className={styles.partsTable}>
                            <thead>
                              <tr>
                                <th>Артикул детали</th>
                                <th>Название детали</th>
                                <th>Материал</th>
                                <th>Размер</th>
                                <th>Количество</th>
                                <th>Статус</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pallet.parts.map(part => (
                                <tr key={part.id}>
                                  <td>{part.articleNumber}</td>
                                  <td>{part.name}</td>
                                  <td>{part.material}</td>
                                  <td>{part.size}</td>
                                  <td>{part.quantity}</td>
                                  <td>
                                    <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>
                                      {part.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
    </div>
  );
};

export default ShiftTaskModal;
