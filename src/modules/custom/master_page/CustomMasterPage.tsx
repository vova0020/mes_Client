import React, { useState } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import OrdersTable from './components/OrdersTable/OrdersTable';
import PalletsTable from './components/PalletsTable/PalletsTable';
import MachinesCards from './components/MachinesCards/MachinesCards';
import PartsModal from './components/PartsModal/PartsModal';
import RotateScreen from '../../../componentsGlobal/RotateScreen/RotateScreen';
import styles from './CustomMasterPage.module.css';

const CustomMasterPage: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);

  const handleOrderSelect = (orderId: number | null) => {
    setSelectedOrderId(orderId);
  };

  const handleShowParts = (palletId: number) => {
    setSelectedPalletId(palletId);
    setIsPartsModalOpen(true);
  };

  const handleClosePartsModal = () => {
    setIsPartsModalOpen(false);
    setSelectedPalletId(null);
  };

  return (
    <>
      <RotateScreen />
      <div className={styles.mesPage}>
        <div className={styles.Sidebar_Block}>
          <Sidebar />
        </div>

        <div className={styles.Content_Block}>
          <div className={styles.headerBlock}>
            <Header />
          </div>

          <div className={styles.mainContainer}>
            <div className={styles.topRow}>
              <div className={styles.ordersSection}>
                <OrdersTable onOrderSelect={handleOrderSelect} />
              </div>

              <div className={styles.machinesSection}>
                <MachinesCards />
              </div>
            </div>

            <div className={styles.bottomRow}>
              <div className={styles.detailsSection}>
                <PalletsTable 
                  selectedOrderId={selectedOrderId}
                  onShowParts={handleShowParts}
                />
              </div>
            </div>
          </div>
        </div>

        <PartsModal
          isOpen={isPartsModalOpen}
          onClose={handleClosePartsModal}
          palletId={selectedPalletId}
        />
      </div>
    </>
  );
};

export default CustomMasterPage;
