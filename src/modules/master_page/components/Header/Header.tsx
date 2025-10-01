
import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
// Если есть логотип/иконки, импортируйте их, например:
import logo from '../../../../assets/logo-Photoroom.png';
// Импортируем компонент LogoutButton вместо иконки LogoutIcon
import LogoutButton from '../../../../componentsGlobal/LogoutButton/LogoutButton';
// Импортируем новый к��мпонент Navbar
import Navbar from '../../../../componentsGlobal/Navbar/Navbar';
// Импортируем хук для работы с навбаром
import { useStageNavbar } from '../../../../componentsGlobal/Navbar/useStageNavbar';

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

  // Используем хук для работы с навбаром
  const { getCurrentStage } = useStageNavbar();

  // Функция для загрузки данных этапа
  const loadStageData = () => {
    try {
      // Получаем выбранный этап из localStorage
      const selectedStage = getCurrentStage();
      
      if (selectedStage) {
        // Устанавливаем название выбранного этапа
        setTechStageName(selectedStage.name);
        console.log('Загружен выбранный этап:', selectedStage);
      } else {
        // Если выбранный этап не найден, пытаемся установить первый доступный
        const assignmentsDataString = localStorage.getItem('assignments');
        if (assignmentsDataString) {
          const assignmentsData: AssignmentsData = JSON.parse(assignmentsDataString);
          if (assignmentsData.segments && assignmentsData.segments.length > 0) {
            setTechStageName(assignmentsData.segments[0].name);
          }
        }
        console.warn('Выбранный этап не найден, используется этап по умолчанию');
      }

      // Получаем данные о производственной линии из assignments
      const assignmentsDataString = localStorage.getItem('assignments');
      
      if (assignmentsDataString) {
        // Парсим JSON
        const assignmentsData: AssignmentsData = JSON.parse(assignmentsDataString);
        
        // Проверяем, есть ли данные о сегментах
        if (assignmentsData.segments && assignmentsData.segments.length > 0) {
          // Берем данные из первого сегмента (если их несколько)
          const segment = assignmentsData.segments[0];
          
          // Обновляем только название производственной линии
          setProductionLineName(segment.lineName);
          
          // Отладочный вывод
          console.log('Загружены данные о производственной линии:', segment.lineName);
        } else {
          console.warn('В данных assignments отсутствуют сегменты');
        }
      } else {
        console.warn('Данные assignments не найдены в localStorage');
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных из localStorage:', error);
    }
  };

  // Загрузка данных из localStorage при монтировании компонента
  useEffect(() => {
    loadStageData();
  }, [getCurrentStage]);

  // Подписка на изменения выбранного этапа
  useEffect(() => {
    const handleStageChange = (event: CustomEvent) => {
      const stage = event.detail;
      // Обновляем заголовок только если это НЕ финальный этап
      if (!stage?.finalStage) {
        console.log('Получено событие изменения этапа:', event.detail);
        loadStageData();
      }
    };

    window.addEventListener('stageChanged', handleStageChange as EventListener);
    
    return () => {
      window.removeEventListener('stageChanged', handleStageChange as EventListener);
    };
  }, []);

  return (
    <header className={styles.header}>
      {/* Левый блок: название этапа и кнопки */}
      <div className={styles.leftContainer}>
        <div className={styles.techStage}>
          {techStageName}
        </div>
        <div className={styles.navButtons}>
          {/* <button className={styles.navButton}>{productionLineName}</button> */}
          <Navbar />
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
