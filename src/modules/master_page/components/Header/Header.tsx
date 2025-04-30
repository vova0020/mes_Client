
import React from 'react';
import styles from './Header.module.css';
// Если есть логотип/иконки, импортируйте их, например:
import logo from '../../../../assets/logo-Photoroom.png';
// Импортируем компонент LogoutButton вместо иконки LogoutIcon
import LogoutButton from '../../../../componentsGlobal/LogoutButton/LogoutButton';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      {/* Левый блок: название этапа и кнопки */}
      <div className={styles.leftContainer}>
        <div className={styles.techStage}>
          НАЗВАНИЕ ТЕХНОЛОГИЧЕСКОГО ЭТАПА
        </div>
        <div className={styles.navButtons}>
          <button className={styles.navButton}>Производственная линия</button>
          <button className={styles.navButton}>СТАНОК</button>
        </div>
      </div>

      {/* Правый блок: логотип с текстом и кнопка выхода (теперь в колонку) */}
      <div className={styles.rightContainer}>
        <div className={styles.brandContainer}>
          {/* Если есть логотип, раскомментируйте и подставьте нужный импорт */}
          <img src={logo} alt="Logo" className={styles.logo} />
          {/* <span className={styles.brandName}>FIT-MES</span> */}
        </div>
        {/* Заменяем старую кнопку выхода на компонент LogoutButton */}
        <LogoutButton className={styles.exitButton} />
      </div>
    </header>
  );
};

export default Header;
