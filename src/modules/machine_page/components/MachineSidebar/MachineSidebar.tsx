import React, { useState, useEffect } from 'react';
import styles from './MachineSidebar.module.css';

import { ReactComponent as StatisticIcon } from '../../../../assets/sidebar/statistic.svg';
import { ReactComponent as HistoriIcon } from '../../../../assets/sidebar/historiButton.svg';
import { ReactComponent as ReclamaciIcon } from '../../../../assets/sidebar/reclamaciButton.svg';
import { ReactComponent as KleiInActiveIcon } from '../../../../assets/sidebar/kleiInActive.svg';
import { ReactComponent as KleiIActiveIcon } from '../../../../assets/sidebar/kleiActive.svg';
import { ReactComponent as StartInactiveIcon } from '../../../../assets/sidebar/startButton.svg';
import { ReactComponent as StartActiveIcon } from '../../../../assets/sidebar/activeStartButton.svg';
import { ReactComponent as PolomkaInActiveIcon } from '../../../../assets/sidebar/sloman.svg';
import { ReactComponent as PolomkaActiveIcon } from '../../../../assets/sidebar/slomanActive.svg';
import { ReactComponent as WifiIcon } from '../../../../assets/sidebar/wifi.svg'; // Необходимо добавить иконку WiFi

import { Button, Tooltip } from '@mui/material';
import { Machine, MachineStatus } from '../../../api/machinNoSmenApi/machineApi';

interface SidebarProps {
  machine?: Machine | null; 
  isLoading?: boolean;
  onStatusChange?: (status: MachineStatus) => Promise<void>;
  isSocketConnected?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  machine, 
  isLoading = false,
  onStatusChange,
  isSocketConnected = false
}) => {
  const [isStartActive, setIsStartActive] = useState(false);
  const [isPolomkaActive, setIsPolomkaActive] = useState(false);
  const [isCleiActive, setIsCleiActive] = useState(false);
  
  // Вычисляем процент выполнения на основе данных машины
  const progressValue = machine?.completionPercentage || 0;
  
  // Обновляем состояние кнопок в зависимости от статуса станка
  useEffect(() => {
    if (machine) {
      // Устанавливаем состояние кнопки "Старт" в зависимости от статуса
      setIsStartActive(machine.status === 'ACTIVE');
      
      // Устанавливаем состояние кнопки "Поломка" в зависимости от статуса
      setIsPolomkaActive(machine.status === 'BROKEN');
    }
  }, [machine]);
  
  // Определяем, должны ли второстепенные кнопки быть отключены
  const areIconButtonsDisabled = isLoading || !machine || 
                           machine.status === 'INACTIVE' || 
                           machine.status === 'MAINTENANCE';
  
  // Определяем, должна ли кнопка "Старт" быть отключена
  // Важно: не отключаем её для INACTIVE статуса, чтобы можно было активировать станок
  const isStartButtonDisabled = isLoading || !machine || 
                           machine.status === 'MAINTENANCE' || 
                           machine.status === 'BROKEN';
  
  // Определяем дополнительные классы для сайдбара в зависимости от состояния
  const getSidebarClassNames = () => {
    if (!machine) return '';
    
    if (machine.status === 'INACTIVE') return styles.inactiveMode;
    if (machine.status === 'MAINTENANCE') return styles.maintenanceMode;
    
    return '';
  };

  // Функция для обработки нажатия кнопки "Старт"
  const toggleStartButton = async () => {
    if (!machine || !onStatusChange || isLoading) return;
    
    try {
      if (machine.status === 'ACTIVE') {
        // Если станок активен, делаем его неактивным
        await onStatusChange('INACTIVE');
      } else if (machine.status === 'INACTIVE') {
        // Если станок неактивен, делаем его активным
        await onStatusChange('ACTIVE');
        console.log('Меняем статус с INACTIVE на ACTIVE');
      }
      // В остальных случаях (BROKEN, MAINTENANCE) ничего не делаем
    } catch (error) {
      console.error('Ошибка при изменении статуса станка:', error);
    }
  };
  
  // Функция для обработки нажатия кнопки "Поломка"
  const togglePolomkatButton = async () => {
    if (!machine || !onStatusChange || isLoading) return;
    
    try {
      if (machine.status === 'BROKEN') {
        // Если станок сломан, делаем его неактивным
        await onStatusChange('INACTIVE');
      } else {
        // В остальных случаях (ACTIVE, INACTIVE, MAINTENANCE) делаем его сломанным
        await onStatusChange('BROKEN');
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса станка:', error);
    }
  };

  // Функция для обработки нажатия кнопки "Клей"
  const toggleCleiButton = () => {
    // Не меняем состояние, если станок неактивен или на обслуживании или сломан
    if (isLoading || !machine || machine.status === 'INACTIVE' || 
        machine.status === 'MAINTENANCE' || machine.status === 'BROKEN') {
      return;
    }
    setIsCleiActive(prevState => !prevState);
  };

  return (
    <div className={styles.sidebar}>
      <div className={`${styles.sidebarContent} ${getSidebarClassNames()}`}>
        
        {/* Кнопка START */}
        <button
          className={`${styles.startButton} ${isStartActive ? styles.startButtonActive : ''} ${isStartButtonDisabled ? styles.buttonDisabled : ''}`}
          onClick={toggleStartButton}
          aria-label="Start"
          disabled={isStartButtonDisabled}
        >
          <div className={styles.startIconContainer}>
            {isStartActive ? (
              <StartActiveIcon className={styles.startIcon} />
            ) : (
              <StartInactiveIcon className={styles.startIcon} />
            )}
          </div>
        </button>

        {/* Кнопка "Поломка" */}
        <button 
          className={`${styles.startButton} ${isPolomkaActive ? `${styles.brokenButtonActive} ${styles.pulseBroken}` : ''}`}
          onClick={togglePolomkatButton}
          aria-label="Polomka"
          // Кнопка поломки никогда не отключается полностью
        >
          <div className={styles.startIconContainer}>
            {isPolomkaActive ? (
              <PolomkaActiveIcon className={styles.startIcon} />
            ) : (
              <PolomkaInActiveIcon className={styles.startIcon} />
            )}
          </div>
        </button>

        {/* Блок с иконками */}
        <div className={styles.iconGroup}>
          <Button disabled={areIconButtonsDisabled}>
            <StatisticIcon className={styles.icon} />
          </Button>
        </div>

        {/* Вертикальный прогресс-бар */}
        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>{progressValue}%</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ height: `${progressValue}%` }}
            />
          </div>
        </div>

        {/* Нижние иконки */}
        <div className={styles.footerIcon}>
          {/* <Button
            onClick={toggleCleiButton}
            aria-label="Klei"
            disabled={areIconButtonsDisabled}
          >
            <div className={styles.startIconContainer}>
              {isCleiActive ? (
                <KleiIActiveIcon className={styles.icon} />
              ) : (
                <KleiInActiveIcon className={styles.icon} />
              )}
            </div>
          </Button> */}

          <Button disabled={areIconButtonsDisabled}>
            <HistoriIcon className={styles.icon} />
          </Button>
          <Button disabled={areIconButtonsDisabled}>
            <ReclamaciIcon className={styles.icon} />
          </Button>
          
      
        </div>
      </div>
    </div>
  );
};

export default Sidebar;