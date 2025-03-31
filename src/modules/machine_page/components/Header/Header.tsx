import React from 'react';
import styles from './Header.module.css';
// Если есть логотип/иконки, импортируйте их, например:
import logo from '../../../../assets/Rectangle 12.jpg';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
    {/* Левый блок: название этапа и кнопки */}
    <div className={styles.leftContainer}>
      <div className={styles.techStage}>
        НАЗВАНИЕ ТЕХНОЛОГИЧЕСКОГО ЭТАПА
      </div>
      <div className={styles.navButtons}>
        <button className={styles.navButton}>СТАНОК</button>
        <button className={styles.navButton}>ОПЕРАТОР</button>
      </div>
    </div>

    {/* Правый блок: логотип с текстом и кнопка питания (теперь в колонку) */}
    <div className={styles.rightContainer}>
      <div className={styles.brandContainer}>
        {/* Если есть логотип, раскомментируйте и под��тавьте нужный импорт */}
        
        {/* <img src={logo} alt="Logo" className={styles.logo} /> */}
       
        <span className={styles.brandName}>FIT-MES</span>
      </div>
      <button className={styles.powerButton}>
        {/* Можно использовать SVG-иконку или символ */}
        &#x23FB;
      </button>
    </div>
  </header>
);
};

export default Header;
