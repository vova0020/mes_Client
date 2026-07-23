import React, { useEffect, useState } from 'react';
import Header from './components/Header/Header';
import Sidebar, { SettingSection } from './components/Sidebar/Sidebar';
import SeriesOrderCreation from './components/blocks/SeriesOrderCreation';
import DetailRouteManagement from './components/blocks/DetailRouteManagement';
import OrderPlanning from './components/blocks/OrderPlanning';
import OrderDisplay from './components/blocks/orderDisplayBlok/OrderDisplay';
import StreamsManagement from './components/blocks/StreamsManagement/StreamsManagement';
import StatisticsDisplay from './components/blocks/StatisticsDisplay';
// СКРЫТО: переключатель типа производства — всегда серийное
// import ProductionTypeSwitch, { ProductionType } from './components/ProductionTypeSwitch';
// import { CustomOrderCreation } from './custom';
// import CustomOrderDisplay from './custom/orderDisplayBlock/OrderDisplay';

import styles from './OrderManagement.module.css';

type TabType = 'orders' | 'streams';



const OrderManagementBlok: React.FC = () => {
  // Состояние для отслеживания текущего активного раздела
  const [activeSection, setActiveSection] = useState<SettingSection>(null);
  // Состояние для отслеживания активной вкладки
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  // СКРЫТО: состояние для типа производства — всегда серийное
  // const [productionType, setProductionType] = useState<ProductionType>('series');

  // Функция для изменения активного раздела
  const handleSectionChange = (section: SettingSection) => {
    setActiveSection(section);
  };

  // Функция для возврата к главному экрану
  const handleBackToMain = () => {
    setActiveSection(null);
  };

  // Функция для рендеринга соответствующего компонента в зависимости от активного раздела
  const renderActiveComponent = () => {
    switch (activeSection) {
      case 'creatOrder':
        return (
          <>
            {/* СКРЫТО: ProductionTypeSwitch — всегда серийное */}
            <SeriesOrderCreation onBack={handleBackToMain} />
          </>
        );
      case 'detailRouteManagement':
        return (
          <>
            {/* СКРЫТО: ProductionTypeSwitch — всегда серийное */}
            <DetailRouteManagement onBack={handleBackToMain} />
          </>
        );
      case 'orderManagement':
        return (
          <>
            {/* СКРЫТО: ProductionTypeSwitch — всегда серийное */}
            <OrderPlanning onBack={handleBackToMain} />
          </>
        );
      case 'statistics':
        return (
          <>
            {/* СКРЫТО: ProductionTypeSwitch — всегда серийное */}
            <StatisticsDisplay onBack={handleBackToMain} />
          </>
        );
      case 'orderDisplay':
      default:
        return (
          <>
            {/* СКРЫТО: ProductionTypeSwitch — всегда серийное */}
            <div className={styles.tabNavigation}>
              <button
                className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                Монитор заказов
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'streams' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('streams')}
              >
                Монитор загрузки
              </button>
            </div>
            {activeTab === 'orders' ? (
              <OrderDisplay />
            ) : (
              <StreamsManagement />
            )}
          </>
        );
    }
  };
  useEffect(()=>{
    console.log(activeSection);
    
  },[activeSection])

  return (
    <div className={styles.mesPage}>
      {/* Боковая панель всегда отображается */}
      <div className={styles.Sidebar_Block}>
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
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
          {/* Рендер активного компонента */}
          <div className={styles.settingsContent}>
            {renderActiveComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagementBlok;
