import React, { useState } from 'react';
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

const Sidebar: React.FC = () => {
  const [isStartActive, setIsStartActive] = useState(false);
  const [isPolomkaActive, setIsPolomkaActive] = useState(false);
  const [isCleiActive, setIsCleiActive] = useState(false);
  const progressValue = 100; // Это значение можно получать из пропсов или состояния

  const toggleStartButton = () => {
    setIsStartActive(prevState => !prevState);
  };
  const togglePolomkatButton = () => {
    setIsPolomkaActive(prevState => !prevState);
  };

  const toggleCleiButton = () => {
    setIsCleiActive(prevState => !prevState);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* Кнопка START */}
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

        <button 
          className={`${styles.startButton} ${isStartActive ? styles.startButtonActive : ''}`}
          onClick={togglePolomkatButton}
          aria-label="Start"
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
          <Button>
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
          <Button
            onClick={toggleCleiButton}
            aria-label="Klei"
          >
            <div className={styles.startIconContainer}>
              {isCleiActive ? (
                <KleiIActiveIcon className={styles.icon} />
              ) : (
                <KleiInActiveIcon className={styles.icon} />
              )}
            </div>
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