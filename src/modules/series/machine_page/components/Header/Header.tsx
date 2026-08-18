
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../../../../../assets/logo-Photoroom.png';
import LogoutButton from '../../../../../componentsGlobal/LogoutButton/LogoutButton';
import StageSelector from '../StageSelector/StageSelector';
import { useMachine } from '../../../../hooks/machinhook/useMachine';

interface Stage {
  id: number;
  name: string;
  finalStage: boolean;
}

interface Machine {
  id: number;
  name: string;
  noSmenTask: boolean;
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
  const navigate = useNavigate();
  
  // Получаем данные станка из хука
  const { machine } = useMachine();

  // СКРЫТО: переключение на индивидуальное производство
  // const handleSwitchToCustom = () => {
  //   navigate('/machine');
  // };

  // СКРЫТО: логика проверки типа производства
  // useEffect(() => {
  //   const productionType = localStorage.getItem('productionType');
  //   setShowProductionSwitch(productionType === 'BOTH');
  //   if (productionType && productionType !== 'BOTH' && productionType !== 'SERIAL') {
  //     navigate('/machine');
  //   }
  // }, [navigate]);

  useEffect(() => {
    try {
      const assignmentsData = localStorage.getItem('assignments');
      if (assignmentsData) {
        const assignments: Assignments = JSON.parse(assignmentsData);
        if (assignments.machines && assignments.machines.length > 0) {
          const machine = assignments.machines[0];
          setMachineName(machine.name);
          setStages(machine.stages || []);
          console.log('Этапы станка:', machine.stages);
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
          <button className={styles.navButton}>
            {machineName}
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
