import React from 'react';
import styles from './ProductionTypeSwitch.module.css';

export type ProductionType = 'series' | 'custom';

interface ProductionTypeSwitchProps {
  activeType: ProductionType;
  onChange: (type: ProductionType) => void;
}

const ProductionTypeSwitch: React.FC<ProductionTypeSwitchProps> = ({ activeType, onChange }) => {
  return (
    <div className={styles.switchContainer}>
      <button
        className={`${styles.switchButton} ${activeType === 'series' ? styles.active : ''}`}
        onClick={() => onChange('series')}
      >
        <span className={styles.icon}>📦</span>
        <span className={styles.label}>Серийное производство</span>
      </button>
      <button
        className={`${styles.switchButton} ${activeType === 'custom' ? styles.active : ''}`}
        onClick={() => onChange('custom')}
      >
        <span className={styles.icon}>⚙️</span>
        <span className={styles.label}>Индивидуальное производство</span>
      </button>
    </div>
  );
};

export default ProductionTypeSwitch;
