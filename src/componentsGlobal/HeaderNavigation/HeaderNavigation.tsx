import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './HeaderNavigation.module.css';

interface NavigationItem {
  id: string;
  name: string;
  path: string;
  requiredRoles: string[];
}

const HeaderNavigation: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPageName, setCurrentPageName] = useState<string>('Станок');
  const navigate = useNavigate();
  const location = useLocation();

  // Доступные страницы для навигации
  const navigationItems: NavigationItem[] = [
    {
      id: 'settings',
      name: 'Настройки',
      path: '/settings',
      requiredRoles: ['admin']
    },
    {
      id: 'order_management',
      name: 'Управление заказами',
      path: '/order-management',
      requiredRoles: ['admin', 'management', 'technologist']
    }
  ];

  // Фильтруем доступные элементы навигации на основе ролей пользователя
  const getAvailableItems = (): NavigationItem[] => {
    const user = authService.getUser();
    if (!user) return [];

    return navigationItems.filter(item => 
      item.requiredRoles.some(role => 
        authService.hasRole(role) || authService.isPrimaryRole(role)
      )
    );
  };

  // Определяем текущую страницу на основе URL
  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = navigationItems.find(item => item.path === currentPath);
    
    if (currentItem) {
      setCurrentPageName(currentItem.name);
    } else {
      // Если текущая страница не найдена в списке навигации, показываем "Станок"
      setCurrentPageName('Станок');
    }
  }, [location.pathname]);

  // Обработчик выбора страницы
  const handlePageSelect = (item: NavigationItem) => {
    setIsDropdownOpen(false);
    navigate(item.path);
  };

  // Обработчик кли��а по кнопке навигации
  const handleNavigationClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Закрытие dropdown при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.headerNavigation}`)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const availableItems = getAvailableItems();

  // Если нет доступных элементов навигации, показываем только текущую страницу
  if (availableItems.length === 0) {
    return (
      <button className={styles.navButton} disabled>
        {currentPageName}
      </button>
    );
  }

  return (
    <div className={styles.headerNavigation}>
      <button 
        className={styles.navButton}
        onClick={handleNavigationClick}
      >
        {currentPageName}
        <span className={`${styles.arrow} ${isDropdownOpen ? styles.arrowUp : styles.arrowDown}`}>
          ▼
        </span>
      </button>
      
      {isDropdownOpen && (
        <div className={styles.dropdown}>
          {availableItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.dropdownItem} ${location.pathname === item.path ? styles.activeItem : ''}`}
              onClick={() => handlePageSelect(item)}
            >
              <span className={styles.itemName}>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderNavigation;