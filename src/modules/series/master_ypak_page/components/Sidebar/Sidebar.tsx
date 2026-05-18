import React, { useState } from 'react';
import styles from './Sidebar.module.css';

import { ReactComponent as StatisticIcon } from '../../../../../assets/sidebar/statistic.svg';
import { ReactComponent as HistoriIcon } from '../../../../../assets/sidebar/historiButton.svg';
import { ReactComponent as ReclamaciIcon } from '../../../../../assets/sidebar/reclamaciButton.svg';
import { ReactComponent as BuferIcon } from '../../../../../assets/sidebar/buferButton.svg';
import { ReactComponent as PolomkaInActiveIcon } from '../../../../../assets/sidebar/sloman.svg';
import { ReactComponent as PolomkaActiveIcon } from '../../../../../assets/sidebar/slomanActive.svg';

import { Button } from '@mui/material';
import YpakMachineStatusMenu from './YpakMachineStatusMenu';
import InternalReclamationsModal from '../../../../order_management/components/blocks/InternalReclamationsModal';

const Sidebar: React.FC = () => {
  const [isStartActive, setIsStartActive] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isReclamationsModalOpen, setIsReclamationsModalOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
    setIsStartActive(true);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setIsStartActive(false);
  };

  const handleOpenReclamationsModal = () => {
    setIsReclamationsModalOpen(true);
  };

  const handleCloseReclamationsModal = () => {
    setIsReclamationsModalOpen(false);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContent}>


      <button 
          className={`${styles.startButton} ${isStartActive ? styles.startButtonActive : ''}`}
          onClick={handleMenuOpen}
          aria-label="Изменить статус станка упаковки"
        >
          <div className={styles.startIconContainer}>
            {isStartActive ? (
              <PolomkaActiveIcon className={styles.startIcon} />
            ) : (
              <PolomkaInActiveIcon className={styles.startIcon} />
            )}
          </div>
        </button>

        <YpakMachineStatusMenu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        />



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
          <Button onClick={handleOpenReclamationsModal}>
            <ReclamaciIcon className={styles.icon} />
          </Button>


        </div>
      </div>

      {/* Модальное окно журнала внутренних рекламаций */}
      {isReclamationsModalOpen && (
        <InternalReclamationsModal onClose={handleCloseReclamationsModal} />
      )}
    </div>
  );
};

export default Sidebar;