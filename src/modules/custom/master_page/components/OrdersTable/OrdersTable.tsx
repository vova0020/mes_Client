import React, { useState, useEffect, useRef } from 'react';
import styles from './OrdersTable.module.css';

interface Order {
  id: number;
  batchNumber: string;
  orderName: string;
  available: number;
  completed: number;
  priority?: number;
}

interface OrdersTableProps {
  onOrderSelect?: (orderId: number | null) => void;
}

const MOCK_ORDERS: Order[] = [
  { id: 1, batchNumber: 'ЗАК-001', orderName: 'Заказ клиента А', available: 100, completed: 45, priority: 1 },
  { id: 2, batchNumber: 'ЗАК-002', orderName: 'Заказ клиента Б', available: 80, completed: 20, priority: 2 },
  { id: 3, batchNumber: 'ЗАК-003', orderName: 'Заказ клиента В', available: 60, completed: 75, priority: 3 },
];

const OrdersTable: React.FC<OrdersTableProps> = ({ onOrderSelect }) => {
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [showOrders, setShowOrders] = useState(false);
  const [orders] = useState<Order[]>(MOCK_ORDERS);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (onOrderSelect) {
      onOrderSelect(activeOrderId);
    }
  }, [activeOrderId, onOrderSelect]);

  useEffect(() => {
    if (orders.length > 0) {
      if (isFirstLoad.current) {
        const timer = setTimeout(() => {
          setShowOrders(true);
          isFirstLoad.current = false;
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setShowOrders(true);
      }
    }
  }, [orders]);

  const handleOrderClick = (orderId: number) => {
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
    } else {
      setActiveOrderId(orderId);
    }
  };

  return (
    <div className={styles.ordersContainer}>
      <h2 className={styles.title}>ЗАКАЗЫ</h2>
      <div className={styles.listContainer}>
        {orders.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.emptyMessage}>
              <h3>Нет доступных заказов</h3>
              <p>В данный момент список заказов пуст</p>
            </div>
          </div>
        ) : (
          <div className={showOrders ? styles.showOrders : styles.hideOrders}>
            {orders.sort((a, b) => (a.priority || 999) - (b.priority || 999) || a.id - b.id).map((order, index) => (
              <div
                key={order.id}
                className={`
                  ${styles.orderItem} 
                  ${index === 0 ? styles.firstItem : ''} 
                  ${activeOrderId === order.id ? styles.activeItem : ''} 
                  ${styles.animatedItem}
                `}
                style={{ animationDelay: `${index * 70}ms` }}
                onClick={() => handleOrderClick(order.id)}
              >
                <div className={styles.orderTitle}>
                  {order.batchNumber} - {order.orderName || 'Без названия'}
                </div>
                <div className={styles.orderInfo}>
                  <div className={styles.orderAvailability}>
                    Доступно: {order.available} %
                  </div>
                  <div className={styles.orderProgress}>
                    Выполнено: {order.completed} %
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
