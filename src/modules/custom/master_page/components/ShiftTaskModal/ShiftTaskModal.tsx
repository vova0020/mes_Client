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
        materials: 'ЛДСП Дуб Сонома светлый - 16мм (50)\nЛДСП Дуб Сонома темный - 16мм (23)\nЛМДФ - 16мм (15)',
        status: 'В работе',
        detailsCount: 111,
        parts: [
          { id: 1, articleNumber: 'ABCD-ABCD-38', name: 'Боковина шкафа правая/левая кривая', material: 'ЛДСП Дуб Сонома светлый - 16мм', size: '2050x650', quantity: 25, status: 'В работе' },
          { id: 2, articleNumber: 'ABCD-ABCD-38', name: 'Боковина шкафа правая/левая кривая', material: 'ЛДСП Дуб Сонома светлый - 16мм', size: '2050x650', quantity: 25, status: 'В работе' },
        ]
      },
      {
        id: 2,
        palletNumber: 'ABCD-ABCD-38',
        materials: 'ЛДСП Дуб Сонома светлый - 16мм (50)\nЛДСП Дуб Сонома темный - 16мм (23)\nЛМДФ - 16мм (15)',
        status: 'В работе',
        detailsCount: 111,
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
                      <div className={styles.palletHeader} onClick={() => togglePallet(pallet.id)}>
                        <div className={`${styles.palletCell} ${styles.bold}`}>
                          <div>№ поддона</div>
                          <div>{pallet.palletNumber}</div>
                        </div>
                        <div className={styles.palletCell}>
                          <div>Материалы</div>
                          <div className={styles.materials}>{pallet.materials}</div>
                        </div>
                        <div className={styles.palletCell}>
                          <div>Статус</div>
                          <div>
                            <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>
                              {pallet.status}
                            </span>
                          </div>
                        </div>
                        <div className={styles.palletCell}>
                          <div>Деталей на поддоне</div>
                          <div>{pallet.detailsCount}</div>
                        </div>
                        <div className={styles.palletCell}>
                          <button className={styles.actionButton}>Начать/Завершить</button>
                        </div>
                        <div className={styles.palletCell}>
                          <button className={styles.actionButton}>Переназначить станок</button>
                        </div>
                        <div className={styles.palletCell}>
                          <button className={`${styles.actionButton} ${styles.deleteButton}`}>Удалить</button>
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
