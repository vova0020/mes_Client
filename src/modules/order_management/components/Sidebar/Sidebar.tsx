import React, { useState } from 'react';
import styles from './Sidebar.module.css';

import { ReactComponent as Statistik } from '../../../../assets/orderManager/statistik.svg';
import { ReactComponent as Buffers } from '../../../../assets/orderManager/buffers.svg';
import { ReactComponent as СreateOrder } from '../../../../assets/orderManager/createOrder.svg';
import { ReactComponent as DetailRouteManagement } from '../../../../assets/orderManager/detailRouteManagement.svg';
import { ReactComponent as History } from '../../../../assets/orderManager/history.svg';
import { ReactComponent as OrderManagement } from '../../../../assets/orderManager/orderManagement.svg';
import { ReactComponent as Reclamats } from '../../../../assets/orderManager/reclamats.svg';

import DefectAnalysisModal from '../blocks/DefectAnalysisModal/index';

import { Button, Tooltip } from '@mui/material';

// Определяем все доступные раазделы настроек
export type SettingSection =
  | 'creatOrder'
  | 'detailRouteManagement'
  | 'orderManagement'
  | 'orderDisplay'
  | 'statistics'
  | null;

interface SidebarProps {
  activeSection?: SettingSection;
  onSectionChange: (section: SettingSection) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

  // Функция для определения класса активной кнопки
  const getButtonClass = (section: SettingSection) => {
    return activeSection === section ? `${styles.icon} ${styles.activeIcon}` : styles.icon;
  };

  // Обработчик открытия модального окна анализа брака
  const handleOpenDefectModal = () => {
    setIsDefectModalOpen(true);
  };

  // Обработчик закрытия модального окна анализа брака
  const handleCloseDefectModal = () => {
    setIsDefectModalOpen(false);
  };

  return (
    <div className={styles.sidebar}>
      {/* Нижние иконки */}
      <div className={styles.footerIcon}>


        <Tooltip title="Статистика" placement="right">
          <Button onClick={() => onSectionChange('statistics')}>
            <Statistik className={getButtonClass('statistics')} />
          </Button>
        </Tooltip>
        <Tooltip title="Буфер деталей" placement="right">
          <Button>
            <Buffers />
          </Button>
        </Tooltip>
        <Tooltip title="Журнал внутренниз рекламаций" placement="right">
          <Button >
            <Reclamats  />
          </Button>
        </Tooltip>
        <Tooltip title="История обработки" placement="right">
          <Button onClick={handleOpenDefectModal}>
            <History  />
          </Button>
        </Tooltip>



        <Tooltip title="Создание заказа" placement="right">
          <Button onClick={() => onSectionChange('creatOrder')}>
            <СreateOrder className={getButtonClass('creatOrder')} />
          </Button>
        </Tooltip>
        <Tooltip title="Управление маршрутами деталей в заказе" placement="right">
          <Button onClick={() => onSectionChange('detailRouteManagement')}>
            <DetailRouteManagement className={getButtonClass('detailRouteManagement')} />
          </Button>
        </Tooltip>
        <Tooltip title="Управление заказами (планирование)" placement="right">
          <Button onClick={() => onSectionChange('orderManagement')}>
            <OrderManagement className={getButtonClass('orderManagement')} />
          </Button>
        </Tooltip>
        {/* <Tooltip title="Отображение заказов" placement="right">
          <Button onClick={() => onSectionChange('orderDisplay')}>
            <OrderManagement className={getButtonClass('orderDisplay')} />
          </Button>
        </Tooltip> */}

     
      </div>

      {/* Модальное окно анализа брака */}
      {isDefectModalOpen && (
        <DefectAnalysisModal onClose={handleCloseDefectModal} />
      )}
    </div>
  );
};

export default Sidebar;