import React, { useState, useEffect } from 'react';
import { useStageNavbar } from './useStageNavbar';
import styles from './StageNavbar.module.css';


const Navbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const {
    availableStages,
    loading,
    error,
    fetchStages,
    selectStage,
  } = useStageNavbar();

  // Обработчик выбора этапа
  const handleStageSelect = (stage: any) => {
    setIsDropdownOpen(false);
    selectStage(stage);
  };

  // Обработчик клика по кнопке навбара
  const handleNavbarClick = () => {
    if (!isDropdownOpen) {
      fetchStages();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Закрытие dropdown при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.stageNavbar}`)) {
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

  return (
    <div className={styles.stageNavbar}>
      <button 
        className={styles.navButton}
        onClick={handleNavbarClick}
        disabled={loading}
      >
        Навигация
        <span className={`${styles.arrow} ${isDropdownOpen ? styles.arrowUp : styles.arrowDown}`}>
          ▼
        </span>
      </button>
      
      {isDropdownOpen && (
        <div className={styles.dropdown}>
          {loading && (
            <div className={styles.loadingItem}>
              Загрузка...
            </div>
          )}
          
          {error && (
            <div className={styles.errorItem}>
              Ошибка: {error}
            </div>
          )}
          
          {!loading && !error && availableStages.length === 0 && (
            <div className={styles.emptyItem}>
              Нет доступных этапов
            </div>
          )}
          
          {!loading && !error && availableStages.map((stage) => (
            <button
              key={stage.id}
              className={styles.dropdownItem}
              onClick={() => handleStageSelect(stage)}
            >
              <span className={styles.stageName}>{stage.name}</span>
              {stage.finalStage && (
                <span className={styles.finalBadge}>Финальный</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;