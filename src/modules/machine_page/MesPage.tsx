import React from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import OrdersTable from './components/OrdersTable/OrdersTable';
import DetailsTable from './components/DetailsTable/DetailsTable';

import styles from './MesPage.module.css';

const MesPage: React.FC = () => {
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
          {/* Таблицы заказов и деталей */}
          <div className={styles.content}>
            <div className={styles.ordersSection}>
              <OrdersTable />
            </div>
            <div className={styles.detailsSection}>
              <DetailsTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MesPage;