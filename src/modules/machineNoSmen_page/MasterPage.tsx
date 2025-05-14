import React, { useState, useCallback } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import OrdersTable from './components/OrdersTable/OrdersTable';
import DetailsTable from './components/DetailsTable/NoSmenDetailsTable';
import { 
  LoadingSpinner, 
  ErrorStatus, 
  BrokenStatus, 
  InactiveStatus, 
  MaintenanceStatus 
} from './components/loader/spiner';
import { useMachine } from '../hooks/machinNoSmenHook/useMachine';

import styles from './MesPage.module.css';

const MasterPage: React.FC = () => {
  // Использовать хук без передачи ID - он сам возьмет ID из localStorage
  const { 
    machine, 
    loading, 
    error, 
    isInactive, 
    isBroken, 
    isOnMaintenance, 
    refetch,
    changeStatus
  } = useMachine();

  // Добавляем только состояние для отсле��ивания выбранного заказа
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  // Обработчик выбора заказа с useCallback для стабильной ссылки на функцию
  const handleOrderSelect = useCallback((orderId: number | null) => {
    setSelectedOrderId(orderId);
  }, []);

  // Функция для отображения соответствующего контента в зависимости от состояния
  const renderContent = () => {
    // Если идет загрузка, показываем спиннер
    if (loading === 'loading') {
      return <LoadingSpinner />;
    }
    
    // Если произошла ошибка, показываем сообщение об ошибке
    if (loading === 'error' || error) {
      return <ErrorStatus message={error?.message || 'Неизвестная ошибка'} onRetry={refetch} />;
    }
    
    // Если станок сломан, показываем соответствующее сообщение
    if (isBroken) {
      return <BrokenStatus machineName={machine?.name || ''} />;
    }
    
    // Если станок неактивен, показываем соответствующее сообщение
    if (isInactive) {
      return <InactiveStatus machineName={machine?.name || ''} />;
    }
    
    // Если станок на обслуживании, показываем соответствующее сообщение
    if (isOnMaintenance) {
      return <MaintenanceStatus machineName={machine?.name || ''} />;
    }
    
    // Если станок активен, показываем обычный контент с таблицами
    return (
      <>
        <div className={styles.ordersSection}>
          <OrdersTable onOrderSelect={handleOrderSelect} />
        </div>
        <div className={styles.detailsSection}>
          <DetailsTable selectedOrderId={selectedOrderId} />
        </div>
      </>
    );
  };

  return (
    <div className={styles.mesPage}>
      {/* Боковая панель всегда отображается, но с учетом статуса станка */}
      <div className={styles.Sidebar_Block}>
        <Sidebar 
          machine={machine} 
          isLoading={loading === 'loading'} 
          onStatusChange={changeStatus} 
        />
      </div>
      
      {/* Основной блок контента (прижат к правому краю) */}
      <div className={styles.Content_Block}>
        {/* Шапка */}
        <div className={styles.headerBlock}>
          <Header />
        </div>

        {/* Основной контейнер с контентом */}
        <div className={styles.mainContainer}>
          {/* Основной контент в зависимости от состояния */}
          <div className={styles.content}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterPage;