import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import OrdersTable from './components/OrdersTable/OrdersTable';
import DetailsYpakTable from './components/DetailsTable/MasterYpackDetailsYpackTable';
import MachinesCards from './components/MachinesCards/MachinesCards';
import { useStageListener } from '../../componentsGlobal/Navbar/useStageListener';
import useOrders from '../hooks/ypakMasterHook/useOrdersMaster';

import styles from './MasterYpakPage.module.css';
import PackagingModal from './PackagingModal';

const MasterYpakPage: React.FC = () => {
  // Состояние для отслеживания выбранного заказа
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Состояние для модального окна с упаковками
  const [isPackagingModalOpen, setIsPackagingModalOpen] = useState(false);
  const [packagingOrderId, setPackagingOrderId] = useState<number | null>(null);
  const [packagingOrderName, setPackagingOrderName] = useState<string>('');

  // Получаем данные заказов
  const { orders, loading, error, fetchOrders } = useOrders();

  // Отслеживаем изменения выбранного этапа
  const currentStage = useStageListener();

  // Перезагружаем данные при смене этапа
  useEffect(() => {
    if (currentStage) {
      console.log('Этап изменен в MasterYpakPage:', currentStage);
      // Сбрасываем выбранный заказ
      setSelectedOrderId(null);
    }
  }, [currentStage]);

  // Обработчик выбора заказа
  const handleOrderSelect = (orderId: number | null) => {
    setSelectedOrderId(orderId);
  };

  // Обработка открытия модального окна с составом заказа
  const handleViewOrderComposition = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    const orderDisplayName = order
      ? `${order.batchNumber} - ${order.orderName || 'Без названия'}`
      : `Заказ ${orderId}`;

    setPackagingOrderId(orderId);
    setPackagingOrderName(orderDisplayName);
    setIsPackagingModalOpen(true);
  };

  // Обработка закрытия модального окна
  const handleClosePackagingModal = () => {
    setIsPackagingModalOpen(false);
    setPackagingOrderId(null);
    setPackagingOrderName('');
  };

  return (
    <div className={styles.mesPage}>
      {/* Боковая панель */}
      <div className={styles.Sidebar_Block}>
        <Sidebar />
      </div>

      {/* Основной блок контента (прижат к правому краю) */}
      <div className={styles.Content_Block}>
        {/* Шапка */}
        <div className={styles.headerBlock}>
          <Header />
        </div>

        {/* Основной контейнер с контентом */}
        <div className={styles.mainContainer}>
          {/* Верхний ряд с двумя секциями */}
          <div className={styles.topRow}>
            {/* Секция с таблицей заказов */}
            <div className={styles.ordersSection}>
              <OrdersTable
                selectedOrderId={selectedOrderId}
                onOrderSelect={handleOrderSelect}
                onViewOrderComposition={handleViewOrderComposition}
              />
            </div>

            {/* Секция с карточками станков */}
            <div className={styles.machinesSection}>
              <MachinesCards />
            </div>
          </div>

          {/* Нижний ряд с таблицей деталей на всю ширину */}
          <div className={styles.bottomRow}>
            <div className={styles.detailsSection}>
              <DetailsYpakTable selectedOrderId={selectedOrderId} />
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно с упаковками */}
      <PackagingModal
        isOpen={isPackagingModalOpen}
        onClose={handleClosePackagingModal}
        orderId={packagingOrderId}
        orderName={packagingOrderName}
      />
    </div>
  );
};

export default MasterYpakPage;