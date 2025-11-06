import React, { useState, useEffect } from 'react';
import styles from './RotateScreen.module.css';

const RotateScreen: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (!isPortrait) return null;

  return (
    <div className={styles.rotateOverlay}>
      <div className={styles.rotateIcon}>📱</div>
      <p className={styles.rotateText}>Пожалуйста, поверните устройство</p>
    </div>
  );
};

export default RotateScreen;
