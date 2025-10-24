import React, { useEffect, useState } from 'react';
import Header from './components/Header/Header';
import Sidebar, { SettingSection } from './components/Sidebar/Sidebar';
import OrderCreation from './components/blocks/OrderCreation';
import DetailRouteManagement from './components/blocks/DetailRouteManagement';
import OrderPlanning from './components/blocks/OrderPlanning';
import OrderDisplay from './components/blocks/orderDisplayBlok/OrderDisplay';
import StreamsManagement from './components/blocks/StreamsManagement/StreamsManagement';

import styles from './OrderManagement.module.css';

type TabType = 'orders' | 'streams';



const OrderManagementBlok: React.FC = () => {
  // Состояние для отслеживания текущего активного раздела
  const [activeSection, setActiveSection] = useState<SettingSection>(null);
  // Состояние для отслеживания активной вкладки
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  // Функция для изменения активного раздела
  const handleSectionChange = (section: SettingSection) => {
    setActiveSection(section);
  };

  // Функция для возврата к главному экрану
  const handleBackToMain = () => {
    setActiveSection(null);
  };

  // Функция для рендеринга соответствующего компонента в зависимости от активного разд��ла
  const renderActiveComponent = () => {
    switch (activeSection) {
      case 'creatOrder':
        return <OrderCreation onBack={handleBackToMain} />;
      case 'detailRouteManagement':
        return <DetailRouteManagement onBack={handleBackToMain} />;
      case 'orderManagement':
        return <OrderPlanning onBack={handleBackToMain} />;
      case 'orderDisplay':
      default:
        return (
          <>
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
            {activeTab === 'orders' ? <OrderDisplay /> : <StreamsManagement />}
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