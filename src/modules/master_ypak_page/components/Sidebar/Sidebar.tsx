import React, { useState } from 'react';
import styles from './Sidebar.module.css';

// Пример: вы можете подключать SVG-иконки напрямую
// или использовать готовые иконки из библиотеки (например, react-icons).
// Здесь показан условный пример:

import { ReactComponent as StatisticIcon } from '../../../../assets/sidebar/statistic.svg';
import { ReactComponent as HistoriIcon } from '../../../../assets/sidebar/historiButton.svg';
import { ReactComponent as ReclamaciIcon } from '../../../../assets/sidebar/reclamaciButton.svg';
import { ReactComponent as BuferIcon } from '../../../../assets/sidebar/buferButton.svg';
import { ReactComponent as PolomkaInActiveIcon } from '../../../../assets/sidebar/sloman.svg';
import { ReactComponent as PolomkaActiveIcon } from '../../../../assets/sidebar/slomanActive.svg';

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


      <button 
          className={`${styles.startButton} ${isStartActive ? styles.startButtonActive : ''}`}
          onClick={toggleStartButton}
          aria-label="Start"
        >
          <div className={styles.startIconContainer}>
            {isStartActive ? (
              <PolomkaActiveIcon className={styles.startIcon} />
            ) : (
              <PolomkaInActiveIcon className={styles.startIcon} />
            )}
          </div>
        </button>



        {/* Низ панели (например, меню или логотип) */}
        <div className={styles.footerIcon}>
          <Button>
            <StatisticIcon className={styles.icon} />
          </Button>
          <Button>
            <BuferIcon className={styles.icon} />
          </Button>
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