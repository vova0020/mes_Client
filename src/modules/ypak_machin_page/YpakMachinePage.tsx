import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';

import DetailsTable from './components/DetailsTable/YpackMachinDetailsTable';
import { 
  LoadingSpinner, 
  ErrorStatus, 
  BrokenStatus, 
  InactiveStatus, 
  MaintenanceStatus 
} from './components/loader/spiner';
import { useMachine } from '../hooks/machinNoSmenHook/useMachine';

import styles from './YpakMachinePage.module.css';
import RotateScreen from '../../componentsGlobal/RotateScreen/RotateScreen';

const YpakMachinePage: React.FC = () => {
  const [hasStorageData, setHasStorageData] = useState(true);

  // Проверяем наличие данных в localStorage
  useEffect(() => {
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (!assignmentsData) {
        console.error('Отсутствуют данные assignments в localStorage');
        setHasStorageData(false);
        return;
      }
      
      const parsedData = JSON.parse(assignmentsData);
      if (!parsedData.machines || parsedData.machines.length === 0) {
        console.error('Нет данных о станках в assignments');
        setHasStorageData(false);
        return;
      }
      
      setHasStorageData(true);
    } catch (error) {
      console.error('Ошибка при проверке данных в localStorage:', error);
      setHasStorageData(false);
    }
  }, []);

  // Использовать хук без передачи ID - он сам возьмет ID из localStorage
  const { 
    machine, 
    loading, 
    error, 
    isInactive, 
    isBroken, 
    isOnMaintenance, 
    refetch,
    changeStatus
  } = useMachine();

  // Функция для отображения соответствующего контента в зависимости от состояния
  const renderContent = () => {
    // Если нет данных в localStorage, показываем ошибку
    if (!hasStorageData) {
      return <ErrorStatus message="Отсутствуют данные о станке. Пожалуйста, авторизуйтесь заново." onRetry={() => window.location.reload()} />;
    }
    
    // Если идет загрузка, показываем спиннер
    if (loading === 'loading') {
      return <LoadingSpinner />;
    }
    
    // Если произошла ошибка, показываем сообщение об ошибке
    if (loading === 'error' || error) {
      return <ErrorStatus message={error?.message || 'Неизвестная ошибка'} onRetry={refetch} />;
    }
    
    // Если станок сломан, показываем соответствующее сообщение
    if (isBroken) {
      return <BrokenStatus machineName={machine?.name || ''} />;
    }
    
    // Если станок неактивен, показываем соответствующее сообщение
    if (isInactive) {
      return <InactiveStatus machineName={machine?.name || ''} />;
    }
    
    // Если станок на обслуживании, показываем соответствующее сообщение
    if (isOnMaintenance) {
      return <MaintenanceStatus machineName={machine?.name || ''} />;
    }
    
    // Если станок активен, показываем только DetailsTable на всю ширину
    return (
      <div className={styles.fullWidthSection}>
        <DetailsTable  />
      </div>
    );
  };

  return (
     <>
      <RotateScreen />
    <div className={styles.mesPage}>
      {/* Боковая панель всегда отображается, но с учетом статуса станка */}
      <div className={styles.Sidebar_Block}>
        <Sidebar 
          machine={machine} 
          isLoading={loading === 'loading'} 
          onStatusChange={changeStatus} 
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
          {/* Основной контент в зависимости от состояния */}
          <div className={styles.content}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default YpakMachinePage;