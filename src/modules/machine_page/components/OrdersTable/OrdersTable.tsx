import React, { useState } from 'react';
import styles from './OrdersTable.module.css';

const OrdersTable: React.FC = () => {
  // Состояние для отслеживания активного заказа
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  // Пример данных с большим количеством заказов для демонстрации прокрутки
  const orders = [
    {
      id: 1489,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '100%',
    },
    {
      id: 1490,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '75%',
    },
    {
      id: 1491,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '50%',
    },
    {
      id: 1492,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '25%',
    },
    {
      id: 1493,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '10%',
    },
    {
      id: 1494,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '90%',
    },
    {
      id: 1495,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '60%',
    },
    {
      id: 1496,
      name: 'АБВГ/АВВГ/АБВГ/АЕВАГА',
      progress: '30%',
    },
    // При необходимости можно добавить еще заказы
  ];

  // Обработчик клика по карточке заказа с возможностью сброса выбора
  const handleOrderClick = (orderId: number) => {
    // Если нажали на уже выбранную карточку, сбрасываем выбор
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
    } else {
      // Иначе выбираем новую карточку
      setActiveOrderId(orderId);
    }
    
    // Здесь можно добавить дополнительную логику при выборе/отмене выбора заказа
    // Например, загрузку деталей заказа или обновление других компонентов
  };

  return (
    <div className={styles.ordersContainer}>
      <h2 className={styles.title}>ЗАКАЗЫ</h2>

      <div className={styles.listContainer}>
        {orders.map((order, index) => (
          <div
            key={order.id}
            className={`
              ${styles.orderItem} 
              ${index === 0 ? styles.firstItem : ''} 
              ${activeOrderId === order.id ? styles.activeItem : ''}
            `}
            onClick={() => handleOrderClick(order.id)}
          >
            <div className={styles.orderTitle}>
              {order.id} - {order.name}
            </div>
            <div className={styles.orderProgress}>
              Выполнено: {order.progress}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersTable;