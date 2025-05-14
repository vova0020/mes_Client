import React, { useState } from 'react';
import OrdersTable from '../OrdersTable/OrdersTable';
import DetailsTable from '../DetailsTable/MasterYpackDetailsTable';
import styles from './MasterPageContent.module.css';

const MasterPageContent: React.FC = () => {
  // Состояние для отслеживания выбранного ID заказа
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Обработка выбора заказа
  const handleOrderSelect = (orderId: number | null) => {
    setSelectedOrderId(orderId);
  };

  return (
    <div className={styles.masterPageContainer}>
      <div className={styles.tablesContainer}>
        <div className={styles.ordersTableSection}>
          <OrdersTable onOrderSelect={handleOrderSelect} />
        </div>
        <div className={styles.detailsTableSection}>
          <DetailsTable selectedOrderId={selectedOrderId} />
        </div>
      </div>
    </div>
  );
};

export default MasterPageContent;