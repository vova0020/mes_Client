
import React, { useState, useEffect, useRef } from 'react';
import styles from './Sidebar.module.css';

import { ReactComponent as StatisticIcon } from '../../../../assets/sidebar/statistic.svg';
import { ReactComponent as HistoriIcon } from '../../../../assets/sidebar/historiButton.svg';
import { ReactComponent as ReclamaciIcon } from '../../../../assets/sidebar/reclamaciButton.svg';
import { ReactComponent as KleiInActiveIcon } from '../../../../assets/sidebar/kleiInActive.svg';
import { ReactComponent as KleiIActiveIcon } from '../../../../assets/sidebar/kleiActive.svg';
import { ReactComponent as StartInactiveIcon } from '../../../../assets/sidebar/startButton.svg';
import { ReactComponent as StartActiveIcon } from '../../../../assets/sidebar/activeStartButton.svg';
import { ReactComponent as PolomkaInActiveIcon } from '../../../../assets/sidebar/sloman.svg';
import { ReactComponent as PolomkaActiveIcon } from '../../../../assets/sidebar/slomanActive.svg';

import { Button } from '@mui/material';
import { Machine, MachineStatus } from '../../../api/machinNoSmenApi/machineApi';

interface SidebarProps {
  machine?: Machine | null;
  isLoading?: boolean;
  onStatusChange?: (status: MachineStatus) => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  machine, 
  isLoading = false,
  onStatusChange
}) => {
  // Состояния кнопок
  const [isStartActive, setIsStartActive] = useState(false);
  const [isPolomkaActive, setIsPolomkaActive] = useState(false);
  const [isCleiActive, setIsCleiActive] = useState(false);
  
  // Локальное состояние для хранения предыдущих данных о станке
  const [displayMachine, setDisplayMachine] = useState<Machine | null>(null);
  
  // Флаг для отслеживания первой загрузки
  const initialLoadDone = useRef(false);
  
  // Прогресс-бар (может быть получен из данных о станке в будущем)
  const progressValue = 100;
  
  // Обновляем локальное состояние машины с минимальными визуальными изменениями
  useEffect(() => {
    if (machine) {
      if (!initialLoadDone.current || !displayMachine) {
        // При первой загрузке или если displayMachine еще не установлен
        setDisplayMachine(machine);
        initialLoadDone.current = true;
      } else {
        // Обновляем только те поля, которые могут меняться,
        // сохраняя стабильность отображения
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
  }, [machine, displayMachine]);
  
  // Обновляем состояние кнопок в зависимости от статуса станка
  useEffect(() => {
    // Используем displayMachine вместо machine для стабильности
    if (displayMachine) {
      // Устанавливаем состояние кнопки "Старт" в зависимости от статуса
      setIsStartActive(displayMachine.status === 'ACTIVE');
      
      // Устанавливаем состояние кнопки "Поломка" в зависимости от статуса
      setIsPolomkaActive(displayMachine.status === 'BROKEN');
    }
  }, [displayMachine]);
  
  // Отображаем компонент только после первой загрузки
  const shouldShowLoading = isLoading && !initialLoadDone.current;
  
  // Определяем, должны ли второстепенные кнопки быть отключены
  const areIconButtonsDisabled = shouldShowLoading || !displayMachine || 
                           displayMachine.status === 'INACTIVE' || 
                           displayMachine.status === 'MAINTENANCE';
  
  // Определяем, должна ли кнопка "Старт" быть отключена
  // Важно: не отключаем её для INACTIVE статуса, чтобы можно было активировать станок
  const isStartButtonDisabled = shouldShowLoading || !displayMachine || 
                           displayMachine.status === 'MAINTENANCE' || 
                           displayMachine.status === 'BROKEN';
  
  // Определяем дополнительные классы для сайдбара в зависимости от состояния
  const getSidebarClassNames = () => {
    if (!displayMachine) return '';
    
    if (displayMachine.status === 'INACTIVE') return styles.inactiveMode;
    if (displayMachine.status === 'MAINTENANCE') return styles.maintenanceMode;
    
    return '';
  };

  // Функция для обработки нажатия кнопки "Старт"
  const toggleStartButton = async () => {
    if (!displayMachine || !onStatusChange || shouldShowLoading) return;
    
    try {
      if (displayMachine.status === 'ACTIVE') {
        // Если станок активен, делаем его неактивным
        await onStatusChange('INACTIVE');
      } else if (displayMachine.status === 'INACTIVE') {
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
    if (!displayMachine || !onStatusChange || shouldShowLoading) return;
    
    try {
      if (displayMachine.status === 'BROKEN') {
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
    if (shouldShowLoading || !displayMachine || displayMachine.status === 'INACTIVE' || 
        displayMachine.status === 'MAINTENANCE' || displayMachine.status === 'BROKEN') {
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
              style={{ 
                height: `${progressValue}%`,
                transition: 'height 0.5s ease-in-out'  // Добавляем плавную анимацию
              }}
            />
          </div>
        </div>

        {/* Нижние иконки */}
        <div className={styles.footerIcon}>
          <Button
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
          </Button>

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
