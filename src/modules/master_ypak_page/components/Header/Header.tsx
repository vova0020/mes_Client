
import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
// Если есть логотип/иконки, импортируйте их, например:
import logo from '../../../../assets/logo-Photoroom.png';
// Импортируем компонент LogoutButton вместо иконки LogoutIcon
import LogoutButton from '../../../../componentsGlobal/LogoutButton/LogoutButton';

// Интерфейс для данных сегмента из localStorage
interface SegmentData {
  id: number;
  name: string;
  lineId: number;
  lineName: string;
}

// Интерфейс для структуры данных из localStorage
interface AssignmentsData {
  segments: SegmentData[];
  // Возможно, здесь будут другие поля, если они появятся в будущем
}

const Header: React.FC = () => {
  // Состояния для хранения данных о технологическом этапе и производственной линии
  const [techStageName, setTechStageName] = useState<string>('НАЗВАНИЕ ТЕХНОЛОГИЧЕСКОГО ЭТАПА');
  const [productionLineName, setProductionLineName] = useState<string>('Производственная линия');

  // Загрузка данных из localStorage при монтировании компонента
  useEffect(() => {
    try {
      // Получаем данные из localStorage
      const assignmentsDataString = localStorage.getItem('assignments');
      
      if (assignmentsDataString) {
        // Парсим JSON
        const assignmentsData: AssignmentsData = JSON.parse(assignmentsDataString);
        
        // Проверяем, есть ли данные о сегментах
        if (assignmentsData.segments && assignmentsData.segments.length > 0) {
          // Берем данные из первого сегмента (если их несколько)
          const segment = assignmentsData.segments[0];
          
          // Обновляем состояния
          setTechStageName(segment.name);
          setProductionLineName(segment.lineName);
          
          // Отладочный вывод
          console.log('Загружены данные из localStorage:', segment);
        } else {
          console.warn('В данных assignments отсутствуют сегменты');
        }
      } else {
        console.warn('Данные assignments не найдены в localStorage');
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных из localStorage:', error);
    }
  }, []);

  return (
    <header className={styles.header}>
      {/* Левый блок: название этапа и кнопки */}
      <div className={styles.leftContainer}>
        <div className={styles.techStage}>
          {techStageName}
        </div>
        <div className={styles.navButtons}>
          <button className={styles.navButton}>{productionLineName}</button>
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
