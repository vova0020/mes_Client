import React from 'react';
import styles from './LoadingScreen.module.css';
import logo from '../../assets/logo-Photoroom.png';

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  return (
    <div className={`${styles.loadingOverlay} ${!isLoading ? styles.fadeOut : ''}`}>
      <img src={logo} alt="Логотип" className={styles.loadingLogo} />
      <div className={styles.spinner}></div>
    </div>
  );
};

export default LoadingScreen;