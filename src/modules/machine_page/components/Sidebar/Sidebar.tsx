import React from 'react';
import styles from './Sidebar.module.css';

// Пример: вы можете подключать SVG-иконки напрямую
// или использовать готовые иконки из библиотеки (например, react-icons).
// Здесь показан условный пример:
import { ReactComponent as BarChartIcon } from '../../../../assets/bar-chart.svg';
import { ReactComponent as TableIcon } from '../../../../assets/table-icon.svg';
 
const Sidebar: React.FC = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {/* Кнопка START */}
        <button className={styles.startButton}>START</button>

        {/* Блок с иконками (примерно как на скриншоте) */}
        <div className={styles.iconGroup}>
          <BarChartIcon className={styles.icon} />
          <BarChartIcon className={styles.icon} />
        </div>

        {/* Прогресс-бар c надписью 100% */}
        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>100%</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
          </div>
        </div>

        {/* Ещё иконки (для примера) */}
        <div className={styles.iconGroup}>
          <TableIcon className={styles.icon} />
        </div>

        {/* Низ панели (например, меню или логотип) */}
        <div className={styles.footerIcon}>
          <TableIcon className={styles.icon} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;