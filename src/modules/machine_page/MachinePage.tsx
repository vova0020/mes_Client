// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';

import DetailsTable from './components/DetailsTable/DetailsTable';
import { 
  LoadingSpinner, 
  ErrorStatus, 
  BrokenStatus, 
  InactiveStatus, 
  MaintenanceStatus 
} from './components/loader/spiner';
import { useMachine } from '../hooks/machinNoSmenHook/useMachine';

import styles from './MachinePage.module.css';

const MachinePage: React.FC = () => {
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
  
  // Локальное состояние для отображения данных о станке
  const [displayMachine, setDisplayMachine] = useState<any>(null);
  
  // Флаг для отслеживания первой загрузки
  const initialLoadDone = useRef(false);
  
  // Интервал для обновления данных (в миллисекундах)
  const refreshInterval = 4000;

  // Обновляем displayMachine только когда это необходимо
  useEffect(() => {
    if (loading !== 'loading' && machine) {
      if (!initialLoadDone.current || !displayMachine) {
        // При первой загрузке или если displayMachine еще не установлен
        setDisplayMachine(machine);
        initialLoadDone.current = true;
      } else {
        // Обновляем только те поля, которые могут меняться
        setDisplayMachine(prevMachine => {
          if (!prevMachine) return machine;
          
          return {
            ...prevMachine,
            status: machine.status,
            // Другие поля, которые могут меняться динамически
          };
        });
      }
    }
  }, [machine, loading, displayMachine]);

  // Настройка интервала автоматического обновления
  useEffect(() => {
    // Устанавливаем интервал обновления
    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [refetch]);

  // Функция для отображения соответствующего контента в зависимости от состояния
  const renderContent = () => {
    // Показываем загрузку только при первой загрузке
    if (loading === 'loading' && !initialLoadDone.current) {
      return <LoadingSpinner />;
    }
    
    // При ошибке, если еще не было успешной загрузки
    if ((loading === 'error' || error) && !initialLoadDone.current) {
      return <ErrorStatus message={error?.message || 'Неизвестная ошибка'} onRetry={refetch} />;
    }
    
    // Используем данные из displayMachine для отображения
    const machineData = displayMachine || machine;
    if (!machineData) {
      return <LoadingSpinner />;
    }
    
    // Проверяем статус из displayMachine
    const isDisplayBroken = machineData.status === 'BROKEN';
    const isDisplayInactive = machineData.status === 'INACTIVE';
    const isDisplayOnMaintenance = machineData.status === 'MAINTENANCE';
    
    // Если станок сломан, показываем соответствующее сообщение
    if (isDisplayBroken) {
      return <BrokenStatus machineName={machineData.name || ''} />;
    }
    
    // Если станок неактивен, показываем соответствующее сообщение
    if (isDisplayInactive) {
      return <InactiveStatus machineName={machineData.name || ''} />;
    }
    
    // Если станок на обслуживании, показываем соответствующее сообщение
    if (isDisplayOnMaintenance) {
      return <MaintenanceStatus machineName={machineData.name || ''} />;
    }
    
    // Если станок активен, показываем только DetailsTable на всю ширину
    return (
      <div className={styles.fullWidthSection}>
        <DetailsTable />
      </div>
    );
  };

  return (
    <div className={styles.mesPage}>
      {/* Боковая панель всегда отображается, но с учетом статуса станка */}
      <div className={styles.Sidebar_Block}>
        <Sidebar 
          machine={displayMachine || machine} 
          isLoading={loading === 'loading' && !initialLoadDone.current} 
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
  );
};

export default MachinePage;
