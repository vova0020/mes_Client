
import React, { useEffect, useState } from 'react';
import styles from './Header.module.css';
// Если есть логотип/иконки, импортируйте их, например:
import logo from '../../../../assets/logo-Photoroom.png';
import LogoutButton from '../../../../componentsGlobal/LogoutButton/LogoutButton';

// Интерфейсы для типизации данных из localStorage
interface Machine {
  id: number;
  name: string;
  status: string;
  segmentId: number;
  segmentName: string;
}

interface Assignments {
  machines: Machine[];
}

interface User {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

const Header: React.FC = () => {
  // Состояния для хранения данных из localStorage
  const [techStage, setTechStage] = useState<string>("НАЗВАНИЕ ТЕХНОЛОГИЧЕСКОГО ЭТАПА");
  const [machineName, setMachineName] = useState<string>("СТАНОК");
  const [operatorName, setOperatorName] = useState<string>("ОПЕРАТОР");

  useEffect(() => {
    // Получение данных из localStorage при монтировании компонента
    try {
      // Получение данных о назначениях (этап и станок)
      const assignmentsData = localStorage.getItem('assignments');
      if (assignmentsData) {
        const assignments: Assignments = JSON.parse(assignmentsData);
        if (assignments.machines && assignments.machines.length > 0) {
          // Берем первую машину из списка для примера
          const machine = assignments.machines[0];
          setMachineName(machine.name);
          setTechStage(machine.segmentName);
        }
      }

      // Получение данных об операторе
      const userData = localStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        setOperatorName(user.fullName);
      }
    } catch (error) {
      console.error("Ошибка при получении данных из localStorage:", error);
    }
  }, []);

  return (
    <header className={styles.header}>
      {/* Левый блок: название этапа и кнопки */}
      <div className={styles.leftContainer}>
        <div className={styles.techStage}>
          {techStage}
        </div>
        <div className={styles.navButtons}>
          <button className={styles.navButton}>{machineName}</button>
          <button className={styles.navButton}>{operatorName}</button>
        </div>
      </div>

      {/* Правый блок: логотип с текстом и кнопка питания (теперь в колонку) */}
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
