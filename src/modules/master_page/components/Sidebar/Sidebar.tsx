import React, { useState } from 'react';
import styles from './Sidebar.module.css';

// Пример: вы можете подключать SVG-иконки напрямую
// или использовать готовые иконки из библиотеки (например, react-icons).
// Здесь показан условный пример:

import { ReactComponent as StatisticIcon } from '../../../../assets/sidebar/statistic.svg';
import { ReactComponent as HistoriIcon } from '../../../../assets/sidebar/historiButton.svg';
import { ReactComponent as ReclamaciIcon } from '../../../../assets/sidebar/reclamaciButton.svg';
// Импортируем иконки для кнопки Start
import { ReactComponent as StartInactiveIcon } from '../../../../assets/sidebar/startButton.svg';
import { ReactComponent as StartActiveIcon } from '../../../../assets/sidebar/activeStartButton.svg';
import { Button } from '@mui/material';
 
const Sidebar: React.FC = () => {
  // Добавляем состояние для отслеживания активности кнопки Start
  const [isStartActive, setIsStartActive] = useState(false);

  // Функция для переключения состояния кнопки
  const toggleStartButton = () => {
    setIsStartActive(prevState => !prevState);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* Кнопка START только с SVG-изображением */}
        <button 
          className={`${styles.startButton} ${isStartActive ? styles.startButtonActive : ''}`}
          onClick={toggleStartButton}
          aria-label="Start"
        >
          <div className={styles.startIconContainer}>
            {isStartActive ? (
              <StartActiveIcon className={styles.startIcon} />
            ) : (
              <StartInactiveIcon className={styles.startIcon} />
            )}
          </div>
        </button>

        {/* Блок с иконками (примерно как на скриншоте) */}
        <div className={styles.iconGroup}>
          <Button>
            <StatisticIcon className={styles.icon} /> 
          </Button>
          

        </div>

        {/* Прогресс-бар c надписью 100% */}
        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>100%</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
          </div>
        </div>

        {/* Ещё иконки (для примера) */}
        {/* <div className={styles.iconGroup}>
          <TableIcon className={styles.icon} />
        </div> */}

        {/* Низ панели (например, меню или логотип) */}
        <div className={styles.footerIcon}>
  
          <Button> 
            <HistoriIcon className={styles.icon} />
            </Button>
          <Button>
             <ReclamaciIcon className={styles.icon} />
          </Button>
         
         
        </div>
      </div>
    </div>
  );
};

export default Sidebar;