import React, { useEffect, useState } from 'react';

import styles from './DetailsReference.module.css';
import { DetailsReferenceContainer } from './components/DetailsReferenceContainer';


const DetailsReferencePage: React.FC = () => {
  // Состояние для отслеживания текущего активного раздела
  const [activeSection, setActiveSection] = useState(null);

;

  // Функция для рендеринга соответствующего компонента в зависимости от активного раздела
  const renderActiveComponent = () => {
    switch (activeSection) {
 
      default:
        return (
          <div className={styles.welcomeContent}>
            <h2>Добро пожаловать в справочники MES системы</h2>
            {/* <p>Выберите раздел настроек в боковом меню</p> */}
          </div>
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
        {/* <Sidebar/> */}
      </div>
      
      {/* Основной блок контента (прижат к правому краю) */}
      <div className={styles.Content_Block}>
        {/* Шапка */}
        <div className={styles.headerBlock}>
          {/* <Header /> */}
        </div>

        {/* Основной контейнер с контентом */}
        <div className={styles.mainContainer}>
          {/* Рендер активного компонента */}
          <div className={styles.settingsContent}>
            <DetailsReferenceContainer/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsReferencePage;