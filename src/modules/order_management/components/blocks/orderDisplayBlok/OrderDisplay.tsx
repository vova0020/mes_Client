import React, { useState } from 'react';
import OrderDetailsModal from './OrderDetailsModal';
import styles from './OrderDisplay.module.css';

interface Order {
  id: string;
  status: string;
  progress: number;
  completionDate: string;
}

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

const OrderDisplay: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Моковые данные
  const orders: Order[] = [
    { id: 'ORD-001', status: 'В работе', progress: 65, completionDate: '2024-01-15' },
    { id: 'ORD-002', status: 'Завершен', progress: 100, completionDate: '2024-01-10' },
    { id: 'ORD-003', status: 'Планируется', progress: 0, completionDate: '2024-01-20' },
  ];

  const orderDetails: { [key: string]: Package[] } = {
    'ORD-001': [
      {
        id: 'PKG-001',
        name: 'Упаковка А',
        quantity: 50,
        details: [
          {
            id: 'DET-001',
            name: 'Деталь А1',
            totalQuantity: 100,
            route: ['раскрой', 'присадка', 'упаковка'],
            stages: { 'раскрой': 30, 'присадка': 10, 'упаковка': 0 },
            packageId: 'PKG-001',
            pallets: [
              { id: 'PAL-001', stages: { 'раскрой': 'completed', 'присадка': 'in-progress', 'упаковка': 'not-started' } },
              { id: 'PAL-002', stages: { 'раскрой': 'completed', 'присадка': 'not-started', 'упаковка': 'not-started' } },
            ]
          },
          {
            id: 'DET-002',
            name: 'Деталь А2',
            totalQuantity: 75,
            route: ['раскрой', 'упаковка'],
            stages: { 'раскрой': 80, 'упаковка': 20 },
            packageId: 'PKG-001',
            pallets: [
              { id: 'PAL-003', stages: { 'раскрой': 'completed', 'упаковка': 'in-progress' } },
            ]
          }
        ]
      },
      {
        id: 'PKG-002',
        name: 'Упаковка Б',
        quantity: 30,
        details: [
          {
            id: 'DET-003',
            name: 'Деталь Б1',
            totalQuantity: 60,
            route: ['раскрой', 'присадка', 'сборка', 'упаковка'],
            stages: { 'раскрой': 100, 'присадка': 70, 'сборка': 40, 'упаковка': 0 },
            packageId: 'PKG-002',
            pallets: [
              { id: 'PAL-004', stages: { 'раскрой': 'completed', 'присадка': 'completed', 'сборка': 'in-progress', 'упаковка': 'not-started' } },
            ]
          }
        ]
      }
    ],
    'ORD-002': [
      {
        id: 'PKG-003',
        name: 'Упаковка В',
        quantity: 100,
        details: [
          {
            id: 'DET-004',
            name: 'Деталь В1',
            totalQuantity: 200,
            route: ['раскрой', 'присадка', 'упаковка'],
            stages: { 'раскрой': 100, 'присадка': 100, 'упаковка': 100 },
            packageId: 'PKG-003',
            pallets: [
              { id: 'PAL-005', stages: { 'раскрой': 'completed', 'присадка': 'completed', 'упаковка': 'completed' } },
              { id: 'PAL-006', stages: { 'раскрой': 'completed', 'присадка': 'completed', 'упаковка': 'completed' } },
            ]
          }
        ]
      }
    ]
  };

  const handleShowDetails = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#ff4444';
    if (progress < 70) return '#ffaa00';
    return '#44ff44';
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'В работе': return styles.statusInProgress;
      case 'Завершен': return styles.statusCompleted;
      case 'Планируется': return styles.statusPlanned;
      default: return styles.statusPlanned;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Отображение заказов</h2>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.ordersTable}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.headerCell}>Заказ</th>
              <th className={styles.headerCell}>Статус</th>
              <th className={styles.headerCell}>Прогресс выполнения</th>
              <th className={styles.headerCell}>Дата завершения</th>
              <th className={styles.headerCell}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className={styles.tableRow}>
                <td className={styles.cell}>{order.id}</td>
                <td className={styles.cell}>
                  <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className={styles.cell}>
                  <div className={styles.progressContainer}>
                    <div 
                      className={styles.progressBar}
                      style={{ 
                        width: `${order.progress}%`,
                        backgroundColor: getProgressColor(order.progress)
                      }}
                    />
                    <span className={styles.progressText}>{order.progress}%</span>
                  </div>
                </td>
                <td className={styles.cell}>{order.completionDate}</td>
                <td className={styles.cell}>
                  <button 
                    className={styles.detailsButton}
                    onClick={() => handleShowDetails(order.id)}
                  >
                    Показать детали
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedOrder && (
        <OrderDetailsModal
          orderId={selectedOrder}
          packages={orderDetails[selectedOrder] || []}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default OrderDisplay;