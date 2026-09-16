
import React, { useEffect, useState } from 'react';
import styles from './Header.module.css';
import logo from '../../../../../assets/logo-Photoroom.png';
import LogoutButton from '../../../../../componentsGlobal/LogoutButton/LogoutButton';
import { Machine } from '../../../../api/machinNoSmenApi/machineApi';

// Интерфейсы для типизации данных из localStorage
interface Assignments {
  machines: {
    id: number;
    name: string;
    status: string;
    segmentId: number;
    segmentName: string;
  }[];
}

interface HeaderProps {
  machine?: Machine | null;
}

const Header: React.FC<HeaderProps> = ({ machine }) => {
  // Состояния для хранения данных из localStorage
  const [techStage, setTechStage] = useState<string>("Упаковка");
  const [machineName, setMachineName] = useState<string>("СТАНОК");

  useEffect(() => {
    // Получение данных из localStorage при монтировании компонента
    try {
      // Получение данных о назначениях (этап и станок)
      const assignmentsData = localStorage.getItem('assignments');
      if (assignmentsData) {
        const assignments: Assignments = JSON.parse(assignmentsData);
        if (assignments.machines && assignments.machines.length > 0) {
          // Берем первую машину из списка для примера
          const machineData = assignments.machines[0];
          setMachineName(machineData.name);
          setTechStage(machineData.segmentName || 'Упаковка');
        }
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
          <button className={styles.navButton}>
            {machine?.name || machineName}
            {machine?.machineCode && (
              <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                ({machine.machineCode})
              </span>
            )}
          </button>
          {machine?.boundOperators && machine.boundOperators.length > 0 && (
            <button className={styles.navButton} style={{ fontSize: '13px' }}>
              Операторы: {machine.boundOperators.map(op => `№${op.operatorNumber} ${op.firstName}`).join(', ')}
            </button>
          )}
        </div>
      </div>

      {/* Правый блок: логотип с текстом и кнопка питания (теперь в колонку) */}
       <div className={styles.rightContainer}>
        <div className={styles.brandContainer}>
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
