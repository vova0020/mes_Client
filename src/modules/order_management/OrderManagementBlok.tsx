import React, { useEffect, useState } from 'react';
import Header from './components/Header/Header';
import Sidebar, { SettingSection } from './components/Sidebar/Sidebar';
import OrderCreation from './components/blocks/OrderCreation';
import DetailRouteManagement from './components/blocks/DetailRouteManagement';
import OrderPlanning from './components/blocks/OrderPlanning';
import OrderDisplay from './components/blocks/orderDisplayBlok/OrderDisplay';

import styles from './OrderManagement.module.css';



const OrderManagementBlok: React.FC = () => {
  // Состояние для отслеживания текущего активного раздела
  const [activeSection, setActiveSection] = useState<SettingSection>(null);

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
        return <OrderDisplay />;
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