import React, { useState } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import OrdersTable from './components/OrdersTable/OrdersTable';
import DetailsYpakTable from './components/DetailsTable/MasterYpackDetailsYpackTable';
import MachinesCards from './components/MachinesCards/MachinesCards';

import styles from './MasterYpakPage.module.css';

const MasterYpakPage: React.FC = () => {
  // Добавляем только состояние для отслеживания выбранного заказа
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Обработчик выбора заказа
  const handleOrderSelect = (orderId: number | null) => {
    setSelectedOrderId(orderId);
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
              <OrdersTable onOrderSelect={handleOrderSelect} />
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
    </div>
  );
};

export default MasterYpakPage;