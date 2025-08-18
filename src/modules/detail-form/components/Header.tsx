import React from 'react';
import styles from '../styles.module.css';

const Header: React.FC = () => {
  return (
    <>
      <h1 className={styles.title}>НАЗВАНИЕ ДЕТАЛИ/ПОДУФАБРИКАТА (МЕСТО НА 2 СТРОКИ)</h1>
      <div className={styles.topSection}>
        <div className={styles.infoFields}>
          <div className={styles.field}>
            <label>АРТИКУЛ:</label>
            <input type="text" className={styles.underlineInput} />
          </div>
          <div className={styles.field}>
            <label>Подраздел N°:</label>
            <input type="text" className={styles.underlineInput} />
          </div>
          <div className={styles.field}>
            <label>Дата:</label>
            <input type="text" className={styles.underlineInput} />
          </div>
          <div className={styles.field}>
            <label>Кол-во:</label>
            <input type="text" className={styles.underlineInput} />
          </div>
          <div className={styles.field}>
            <label>Материал:</label>
            <input type="text" className={styles.underlineInput} />
          </div>
        </div>
        <div className={styles.qrSection}>
          <div className={styles.symbols}>
            ΠΦ/<br />ΠΦ CB
          </div>
          <span className={styles.arrow}>←</span>
          <div className={styles.qr}>QR</div>
        </div>
      </div>
      <div className={styles.sizeSection}>
        <div className={styles.sizeField}>
          <label>Размер по раскрою:</label>
          <div className={styles.grayBox}>2500x1210</div>
        </div>
        <div className={styles.sizeField}>
          <label>Размер готовой детали:</label>
          <div className={styles.grayBox}>2500x1210</div>
        </div>
      </div>
      <div className={styles.partsField}>
        <label>Деталей в заказе:</label>
        <input type="text" className={styles.underlineInput} />
      </div>
    </>
  );
};

export default Header;