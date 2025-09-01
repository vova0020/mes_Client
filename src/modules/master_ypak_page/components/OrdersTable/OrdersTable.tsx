// файл: OrdersTable.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './OrdersTable.module.css';
import useOrders from '../../../hooks/ypakMasterHook/useOrdersMaster';
import { Order } from '../../../api/ypakMasterApi/orderServiceMaster';

interface OrdersTableProps {
  onOrderSelect?: (orderId: number | null) => void;
  onViewOrderComposition?: (orderId: number) => void;
  onViewOrderConsumption?: (orderId: number) => void;

  // Добавляем optional prop для синхронизации с родителем
  selectedOrderId?: number | null;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  onOrderSelect,
  onViewOrderComposition,
  onViewOrderConsumption,
  selectedOrderId // <- новый проп
}) => {
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [showOrders, setShowOrders] = useState(false);
  const { orders, loading, error, fetchOrders } = useOrders();
  const isFirstLoad = useRef(true);

  // Синхронизация локального activeOrderId с пропом selectedOrderId (если передан)
  useEffect(() => {
    // Если родитель явно передаёт selectedOrderId — синхронизируем
    if (typeof selectedOrderId !== 'undefined') {
      setActiveOrderId(selectedOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId]);

  // Оповещаем родителя о выборе (через callback)
  useEffect(() => {
    if (onOrderSelect) {
      onOrderSelect(activeOrderId);
    }
  }, [activeOrderId, onOrderSelect]);

  // Сбрасываем активный заказ при изменении списка заказов
  useEffect(() => {
    // Если список заказов пуст — явно очищаем выбор
    if (orders.length === 0) {
      if (activeOrderId !== null) {
        setActiveOrderId(null);
      }
      return;
    }

    // Иначе — если выбранный заказ больше не в списке, очищаем
    if (activeOrderId && !orders.find(order => order.id === activeOrderId)) {
      setActiveOrderId(null);
    }
  }, [orders, activeOrderId]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
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
  }, [loading, orders]);

  useEffect(() => {
    if (loading && !isFirstLoad.current) {
      setShowOrders(false);
    }
  }, [loading]);

  const handleOrderClick = (orderId: number) => {
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
    } else {
      setActiveOrderId(orderId);
    }
  };
  const getProgress = (order: Order) => {
    return `${order.completed || 0} %`;
  };

  const getAvailability = (order: Order) => {
    return `${order.available || 0 } %`;
  };

  const handleViewComposition = (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    if (onViewOrderComposition) {
      onViewOrderComposition(orderId);
    }
  };

  const handleViewConsumption = (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    if (onViewOrderConsumption) {
      onViewOrderConsumption(orderId);
    }
  };

  const handleRefreshOrders = () => {
    setShowOrders(false);
    setTimeout(() => {
      fetchOrders();
    }, 400);
  };

  if (loading) {
    return (
      <div className={styles.ordersContainer}>
        <h2 className={styles.title}>ЗАКАЗЫ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка заказов</h3>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Ошибка в компоненте OrdersTable:", error);
    return (
      <div className={styles.ordersContainer}>
        <h2 className={styles.title}>ЗАКАЗЫ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>
            {/* ... svg */}
          </div>
          <div className={styles.errorMessage}>
            <h3>Не удалось загрузить заказы</h3>
            <p>Произошла ошибка при получении данных с сервера</p>
            <button onClick={handleRefreshOrders} className={styles.retryButton}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ordersContainer}>
      <h2 className={styles.title}>ЗАКАЗЫ</h2>
      <div className={styles.listContainer}>
        {orders.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>
              {/* ... svg */}
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
                    Доступно: {getAvailability(order)}
                  </div>
                  <div className={styles.orderProgress}>
                    Выполнено: {getProgress(order)}
                  </div>
                  <div className={styles.orderActions}>
                    <button 
                      className={styles.actionButton} 
                      onClick={(e) => handleViewComposition(e, order.id)}
                      title="Состав заказа"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button 
                      className={styles.actionButton} 
                      onClick={(e) => handleViewConsumption(e, order.id)}
                      title="Расход на заказ"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 19H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M4 15L8 9L12 11L16 6L20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="8" cy="9" r="1" fill="currentColor"/>
                        <circle cx="12" cy="11" r="1" fill="currentColor"/>
                        <circle cx="16" cy="6" r="1" fill="currentColor"/>
                        <circle cx="20" cy="10" r="1" fill="currentColor"/>
                      </svg>
                    </button>
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
