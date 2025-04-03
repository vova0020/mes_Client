import React from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import OrdersTable from './components/OrdersTable/OrdersTable';
import DetailsTable from './components/DetailsTable/DetailsTable';
import MachinesCards from './components/MachinesCards/MachinesCards';

import styles from './MasterPage.module.css';

const MasterPage: React.FC = () => {
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
              <OrdersTable />
            </div>
            
            {/* Секция с карточками станков */}
            <div className={styles.machinesSection}>
              <MachinesCards />
            </div>
          </div>
          
          {/* Нижний ряд с таблицей деталей на всю ширину */}
          <div className={styles.bottomRow}>
            <div className={styles.detailsSection}>
              <DetailsTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterPage;