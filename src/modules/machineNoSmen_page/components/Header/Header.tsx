
import React, { useEffect, useState } from 'react';
import styles from './Header.module.css';
import logo from '../../../../assets/logo-Photoroom.png';
import LogoutButton from '../../../../componentsGlobal/LogoutButton/LogoutButton';
import StageSelector from '../../../machine_page/components/StageSelector/StageSelector';

interface Stage {
  id: number;
  name: string;
  finalStage: boolean;
}

interface Machine {
  id: number;
  name: string;
  status: string;
  segmentId: number;
  segmentName: string;
  stages: Stage[];
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
  const [machineName, setMachineName] = useState<string>("СТАНОК");
  const [operatorName, setOperatorName] = useState<string>("ОПЕРАТОР");
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (assignmentsData) {
        const assignments: Assignments = JSON.parse(assignmentsData);
        if (assignments.machines && assignments.machines.length > 0) {
          const machine = assignments.machines[0];
          setMachineName(machine.name);
          setStages(machine.stages || []);
        }
      }

      const userData = localStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        setOperatorName(user.fullName);
      }
    } catch (error) {
      console.error("Ошибка при получении данных из localStorage:", error);
    }
  }, []);

  const handleStageSelect = (stageId: number) => {
    console.log('Выбран этап:', stageId);
    window.dispatchEvent(new CustomEvent('machineStageChanged', { detail: stageId }));
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftContainer}>
        <div className={styles.navButtons}>
          <StageSelector stages={stages} onStageSelect={handleStageSelect} />
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
