import React, { useState, useEffect, useRef } from 'react';
import styles from './OrdersTable.module.css';

interface LineInfo {
  id: number;
  name: string;
  conveyor: string;
  totalOrders: number;
  pendingOrders: number;
  availability: string;
}

interface OrdersTableProps {
  onOrderSelect?: (lineId: number | null) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ 
  onOrderSelect
}) => {
  // Дефолтные данные для демонстрации - линии производства с конвейерами
  const defaultLines: LineInfo[] = [
    { id: 1, name: 'Линия 1', conveyor: 'Конвейер 1', totalOrders: 15, pendingOrders: 8, availability: '85%' },
    { id: 2, name: 'Линия 2', conveyor: 'Конвейер 2', totalOrders: 22, pendingOrders: 14, availability: '92%' },
    { id: 3, name: 'Линия 3', conveyor: 'Конвейер 3', totalOrders: 11, pendingOrders: 5, availability: '78%' },
    { id: 4, name: 'Линия 4', conveyor: 'Конвейер 4', totalOrders: 19, pendingOrders: 9, availability: '90%' },
  ];

  const [activeLineId, setActiveLineId] = useState<number | null>(null);
  const [showLines, setShowLines] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lines, setLines] = useState<LineInfo[]>([]);

  const isFirstLoad = useRef(true);
  const prevActiveLineId = useRef<number | null>(null);

  // Имитация загрузки данных при первой загрузке
  useEffect(() => {
    const timer = setTimeout(() => {
      setLines(defaultLines);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Оповещаем родительский компонент о выборе линии
  useEffect(() => {
    if (onOrderSelect && prevActiveLineId.current !== activeLineId) {
      prevActiveLineId.current = activeLineId;
      onOrderSelect(activeLineId);
    }
  }, [activeLineId, onOrderSelect]);
  
  // Анимация появления данных
  useEffect(() => {
    if (!loading && lines.length > 0) {
      if (isFirstLoad.current) {
        const timer = setTimeout(() => {
          setShowLines(true);
          isFirstLoad.current = false;
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setShowLines(true);
      }
    }
  }, [loading, lines]);

  // Скрываем данные при загрузке
  useEffect(() => {
    if (loading && !isFirstLoad.current) {
      setShowLines(false);
    }
  }, [loading]);

  // Обработчик выбора линии
  const handleLineClick = (lineId: number) => {
    if (activeLineId === lineId) {
      setActiveLineId(null);
    } else {
      setActiveLineId(lineId);
    }
  };

  // Функция обновления данных
  const handleRefreshLines = () => {
    setShowLines(false);
    setLoading(true);
    
    setTimeout(() => {
      setLines(defaultLines);
      setLoading(false);
    }, 1000);
  };

  // Экран загрузки
  if (loading) {
    return (
      <div className={styles.ordersContainer}>
        <h2 className={styles.title}>ЛИНИИ КОМПЛЕКТАЦИИ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка линий</h3>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      </div>
    );
  }

  // Экран ошибки
  if (error) {
    return (
      <div className={styles.ordersContainer}>
        <h2 className={styles.title}>ЛИНИИ КОМПЛЕКТАЦИИ</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className={styles.errorMessage}>
            <h3>Не удалось загрузить данные линий</h3>
            <p>Произошла ошибка при получении данных с сервера</p>
            <button onClick={handleRefreshLines} className={styles.retryButton}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Основной вид компонента
  return (
    <div className={styles.ordersContainer}>
      <h2 className={styles.title}>ЛИНИИ КОМПЛЕКТАЦИИ</h2>
     
      <div className={styles.listContainer}>
        {lines.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.emptyMessage}>
              <h3>Нет доступных линий</h3>
              <p>В данный момент список линий пуст</p>
            </div>
          </div>
        ) : (
          <div className={showLines ? styles.showOrders : styles.hideOrders}>
            {lines.map((line, index) => (
              <div
                key={line.id}
                className={`
                  ${styles.orderItem} 
                  ${index === 0 ? styles.firstItem : ''} 
                  ${activeLineId === line.id ? styles.activeItem : ''} 
                  ${styles.animatedItem}
                `}
                style={{ animationDelay: `${index * 70}ms` }} 
                onClick={() => handleLineClick(line.id)}
              >
                <div className={styles.orderTitle}>
                  {line.name} - {line.conveyor}
                </div>
                {/* <div className={styles.orderInfo}>
                  <div className={styles.orderAvailability}>
                    Загруженность: {line.availability}
                  </div>
                  <div className={styles.orderProgress}>
                    Заказы в очереди: {line.pendingOrders} из {line.totalOrders}
                  </div>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;