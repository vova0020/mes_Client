import React, { useState } from 'react';
import styles from './Sidebar.module.css';

import { ReactComponent as Settings_buffer } from '../../../../assets/settingsSidebar/Settings_buffer.svg';
import { ReactComponent as Settings_users } from '../../../../assets/settingsSidebar/Settings_users.svg';
import { ReactComponent as Settings_5 } from '../../../../assets/settingsSidebar/Settings_workplace_ypak.svg';
import { ReactComponent as Settings_4 } from '../../../../assets/settingsSidebar/Settings_machin.svg';
import { ReactComponent as Settings_3 } from '../../../../assets/settingsSidebar/Settings_technological_route.svg';
import { ReactComponent as Settings_2 } from '../../../../assets/settingsSidebar/Settings_technological_operations.svg';
import { ReactComponent as Settings_1 } from '../../../../assets/settingsSidebar/Settings_streams.svg';
import { ReactComponent as Settings_materials } from '../../../../assets/settingsSidebar/Settings_materials.svg';
import { ReactComponent as Sprav_details } from '../../../../assets/settingsSidebar/Sprav_details.svg';

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
  | 'details_reference_container'
  | null;

interface SidebarProps {
  activeSection?: SettingSection;
  onSectionChange: (section: SettingSection) => void;
}

interface MenuItem {
  id: SettingSection;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [hoveredItem, setHoveredItem] = useState<SettingSection>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const menuItems: MenuItem[] = [
    { id: 'materials', icon: Settings_materials, title: 'Материалы' },
    { id: 'streams', icon: Settings_1, title: 'Управление потоками' },
    { id: 'technological_route', icon: Settings_3, title: 'Технологические маршруты' },
    { id: 'machin', icon: Settings_4, title: 'Настройки станков' },
    { id: 'details_reference_container', icon: Sprav_details, title: 'Справочник деталей' },
    { id: 'users', icon: Settings_users, title: 'Управление пользователями' },
    { id: 'buffer', icon: Settings_buffer, title: 'Настройки буфера' },
  ];

  const getIconClass = (section: SettingSection) => {
    if (activeSection === section) return `${styles.iconButton} ${styles.active}`;
    return styles.iconButton;
  };

  const handleMouseEnter = (item: SettingSection, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 15
    });
    setHoveredItem(item);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.menuContainer}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <div
              key={item.id}
              className={getIconClass(item.id)}
              onClick={() => onSectionChange(item.id)}
              onMouseEnter={(e) => handleMouseEnter(item.id, e)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Icon className={styles.icon} />
            </div>
          );
        })}
      </div>
      {hoveredItem && (
        <div 
          className={styles.tooltip} 
          style={{ 
            top: `${tooltipPosition.top}px`, 
            left: `${tooltipPosition.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          {menuItems.find(item => item.id === hoveredItem)?.title}
        </div>
      )}
    </div>
  );
};

export default Sidebar;