import React from 'react';
import styles from './DetailsSection.module.css';

export const DetailsSection: React.FC = () => {
  return (
    <div className={styles['details-section']}>
      <div className={styles['section-header']}>
        <h3>Детали</h3>
      </div>
      
      <div className={styles['section-content']}>
        <div className={styles.placeholder}>
          <p>Секция деталей будет реализована позже</p>
          <p className={styles['placeholder__hint']}>
            Здесь будет отображаться список деталей для выбранной упаковки
          </p>
        </div>
      </div>
    </div>
  );
};
