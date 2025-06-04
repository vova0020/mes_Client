import React from 'react';
import styles from './Sidebar.module.css';

import { ReactComponent as Settings_buffer } from '../../../../assets/settingsSidebar/Settings_buffer.svg';
import { ReactComponent as Settings_users } from '../../../../assets/settingsSidebar/Settings_users.svg';
import { ReactComponent as Settings_workplace_ypak } from '../../../../assets/settingsSidebar/Settings_workplace_ypak.svg';
import { ReactComponent as Settings_machin } from '../../../../assets/settingsSidebar/Settings_machin.svg';
import { ReactComponent as Settings_technological_route } from '../../../../assets/settingsSidebar/Settings_technological_route.svg';
import { ReactComponent as Settings_technological_operations } from '../../../../assets/settingsSidebar/Settings_technological_operations.svg';
import { ReactComponent as Settings_streams } from '../../../../assets/settingsSidebar/Settings_streams.svg';
import { ReactComponent as Settings_materials } from '../../../../assets/settingsSidebar/Settings_materials.svg';

import { Button, Tooltip } from '@mui/material';

// Определяем все доступные раазделы настроек
export type SettingSection = 
  | 'buffer' 
  | 'users' 
  | 'workplace_ypak' 
  | 'machin' 
  | 'technological_route' 
  | 'technological_operations' 
  | 'streams' 
  | 'materials' 
  | null;

interface SidebarProps {
  activeSection?: SettingSection;
  onSectionChange: (section: SettingSection) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  // Функция для определения класса активной кнопки
  const getButtonClass = (section: SettingSection) => {
    return activeSection === section ? `${styles.icon} ${styles.activeIcon}` : styles.icon;
  };

  return (
    <div className={styles.sidebar}>
      {/* Нижние иконки */}
      <div className={styles.footerIcon}>
        <Tooltip title="Настройки буфера" placement="right">
          <Button onClick={() => onSectionChange('buffer')}>
            <Settings_buffer className={getButtonClass('buffer')} />
          </Button>
        </Tooltip>
        
        <Tooltip title="Управление потоками" placement="right">
          <Button onClick={() => onSectionChange('streams')}>
            <Settings_streams className={getButtonClass('streams')} />
          </Button>
        </Tooltip>
        
        <Tooltip title="Технологические операции" placement="right">
          <Button onClick={() => onSectionChange('technological_operations')}>
            <Settings_technological_operations className={getButtonClass('technological_operations')} />
          </Button>
        </Tooltip>
        
        <Tooltip title="Технологические маршруты" placement="right">
          <Button onClick={() => onSectionChange('technological_route')}>
            <Settings_technological_route className={getButtonClass('technological_route')} />
          </Button>
        </Tooltip>
        
        <Tooltip title="Настройки станков" placement="right">
          <Button onClick={() => onSectionChange('machin')}>
            <Settings_machin className={getButtonClass('machin')} />
          </Button>
        </Tooltip>

        <Tooltip title="Настройки рабочих мест УПАК" placement="right">
          <Button onClick={() => onSectionChange('workplace_ypak')}>
            <Settings_workplace_ypak className={getButtonClass('workplace_ypak')} />
          </Button>
        </Tooltip>
        
        <Tooltip title="Управление пользователями" placement="right">
          <Button onClick={() => onSectionChange('users')}>
            <Settings_users className={getButtonClass('users')} />
          </Button>
        </Tooltip>
        
        <Tooltip title="Материалы" placement="right">
          <Button onClick={() => onSectionChange('materials')}>
            <Settings_materials className={getButtonClass('materials')} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default Sidebar;