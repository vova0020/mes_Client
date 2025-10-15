import React, { useEffect, useState } from 'react';
import Header from './components/Header/Header';
import Sidebar, { SettingSection } from './components/Sidebar/Sidebar';
import BufferSettings from './components/blocks/BufferSettings/BufferSettings';

import styles from './SettingsPage.module.css';
import {UserSettings} from './components/blocks/UserSettings/UserSettings';
import MachineSettings from './components/blocks/MachineSettings/MachineSettings';
import RouteSettings from './components/blocks/RouteSettings/RouteSettings';
import OperationsSettings from './components/blocks/OperationsSettings/OperationsSettings';
import settingsFon from '../../assets/settings/settingsFon.png';
import StreamsSettings from './components/blocks/StreamsSettings/StreamsSettings';
import { MaterialSettingsPage } from './components/blocks/MaterialSettings/MaterialSettingsPage';
import { DetailsReferenceContainer } from './components/blocks/DetailsReference/components/DetailsReferenceContainer';

const SettingsPage: React.FC = () => {
  // Состояние для отслеживания текущего активного раздела
  const [activeSection, setActiveSection] = useState<SettingSection>(null);

  // Функция для изменения активного раздела
  const handleSectionChange = (section: SettingSection) => {
    setActiveSection(section);
  };

  // Функция для рендеринга соответствующего компонента в зависимости от активного раздела
  const renderActiveComponent = () => {
    switch (activeSection) {
      case 'buffer':
        return <BufferSettings />;
      case 'users':
        return <UserSettings />;
      case 'workplace_ypak':
        return <div className={styles.placeholderContent}>Настройки рабочих мест УПАК (в разработке)</div>;
      case 'machin':
        return <MachineSettings/>;
      case 'details_reference_container':
        return <DetailsReferenceContainer/>;
      case 'technological_route':
        return <RouteSettings/>;
      case 'technological_operations':
        return <OperationsSettings/>;
      case 'streams':
        return <StreamsSettings/>; 
      case 'materials':
        return <MaterialSettingsPage/>;
      default:
        return (
          <div className={styles.welcomeContent}>
            <img src={settingsFon} alt="Заглушка" className={styles.fullWidthImage} />
            {/* <h2>Добро пожаловать в настройки MES системы</h2>
            <p>Выберите раздел настроек в боковом меню</p> */}
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

export default SettingsPage;