import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OperatorDashboard.module.css';
import authService from '../../services/authService';
import logo from '../../assets/logo-Photoroom.png';
import LogoutButton from '../../componentsGlobal/LogoutButton/LogoutButton';
import WorkplaceConnectionModal from './components/WorkplaceConnectionModal';
import { operatorBindingApi, MachineBinding, OtherOperator } from '../api/operatorApi';

const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  
  // Состояния для управления подключением к станку
  const [isAssignedToWorkplace, setIsAssignedToWorkplace] = useState(false);
  const [machineBinding, setMachineBinding] = useState<MachineBinding | null>(null);
  const [otherOperators, setOtherOperators] = useState<OtherOperator[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [changingNumber, setChangingNumber] = useState(false);

  // Данные пользователя (из authService или дефолтные)
  const fullName = user?.fullName || user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : 'Иванов Иван Иванович';
  const position = user?.position || 'Оператор станка';
  const userId = user?.id || 0;

  // Загрузка статуса привязки при монтировании компонента
  useEffect(() => {
    loadBindingStatus();
  }, []);

  const loadBindingStatus = async () => {
    if (!userId) {
      setError('Не удалось определить ID пользователя');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const status = await operatorBindingApi.getBindingStatus(userId);
      
      if (status.isBound && status.machine) {
        setIsAssignedToWorkplace(true);
        setMachineBinding(status.machine);
        setOtherOperators(status.otherOperators || []);
      } else {
        setIsAssignedToWorkplace(false);
        setMachineBinding(null);
        setOtherOperators([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке статуса привязки:', err);
      setError('Не удалось загрузить статус привязки');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConnect = async (code: string) => {
    if (!userId) {
      setError('Не удалось определить ID пользователя');
      return;
    }

    try {
      const response = await operatorBindingApi.bindOperator({
        userId,
        machineCode: code
      });

      if (response.success) {
        // Обновляем состояние после успешной привязки
        setIsAssignedToWorkplace(true);
        setMachineBinding({
          machineId: response.binding.machineId,
          machineName: response.binding.machineName,
          machineCode: response.binding.machineCode,
          operatorNumber: response.binding.operatorNumber,
          boundAt: response.binding.boundAt
        });
        setOtherOperators(response.otherOperators);
        setIsModalOpen(false);
        setError('');
      }
    } catch (err) {
      console.error('Ошибка при привязке к станку:', err);
      throw err; // Пробрасываем ошибку в модальное окно
    }
  };

  const handleChangeNumber = async (newNumber: number) => {
    if (!userId || !machineBinding) {
      setError('Не удалось определить данные для смены номера');
      return;
    }

    try {
      setChangingNumber(true);
      setError('');
      
      const response = await operatorBindingApi.changeOperatorNumber({
        userId,
        machineId: machineBinding.machineId,
        newOperatorNumber: newNumber
      });

      if (response.success) {
        // Обновляем номер оператора
        setMachineBinding({
          ...machineBinding,
          operatorNumber: response.newNumber
        });
        
        // Перезагружаем статус для обновления списка других операторов
        await loadBindingStatus();
      }
    } catch (err) {
      console.error('Ошибка при смене номера:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось сменить номер оператора');
      }
    } finally {
      setChangingNumber(false);
    }
  };

  const handleEndWork = async () => {
    if (!userId || !machineBinding) {
      setError('Не удалось определить данные для отвязки');
      return;
    }

    try {
      setLoading(true);
      const response = await operatorBindingApi.unbindOperator({
        userId,
        machineId: machineBinding.machineId
      });

      if (response.success) {
        // Сброс данных после успешной отвязки
        setIsAssignedToWorkplace(false);
        setMachineBinding(null);
        setOtherOperators([]);
        setError('');
      }
    } catch (err) {
      console.error('Ошибка при отвязке от станка:', err);
      setError('Не удалось завершить работу на станке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Шапка */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Личный кабинет</h1>
          <p className={styles.subtitle}>Оператор</p>
        </div>
        <div className={styles.headerRight}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <LogoutButton className={styles.exitButton} />
        </div>
      </header>

      {/* Основной контент */}
      <div className={styles.mainContent}>
        <div className={styles.card}>
          {error && (
            <div style={{
              background: 'linear-gradient(to bottom, #fee, #fdd)',
              border: '1px solid #fcc',
              color: '#c53030',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Личные данные</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>ФИО:</span>
                <span className={styles.infoValue}>{fullName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Должность:</span>
                <span className={styles.infoValue}>{position}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Рабочее место</h2>
            <div className={styles.workplaceStatus}>
              {loading ? (
                <>
                  <div className={styles.statusLabel}>Загрузка...</div>
                </>
              ) : isAssignedToWorkplace && machineBinding ? (
                <>
                  <div className={styles.statusLabel}>Вы работаете на:</div>
                  <div className={styles.workplaceName}>
                    {machineBinding.machineName} ({machineBinding.machineCode})
                  </div>
                  <div style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: '#4a5568',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <span>Ваш номер: Оператор №{machineBinding.operatorNumber}</span>
                    {otherOperators.length > 0 && (
                      <select
                        value={machineBinding.operatorNumber}
                        onChange={(e) => handleChangeNumber(Number(e.target.value))}
                        disabled={changingNumber}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e0',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {[...Array(otherOperators.length + 1)].map((_, index) => (
                          <option key={index + 1} value={index + 1}>
                            Сменить на №{index + 1}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.statusLabel}>Статус:</div>
                  <div className={styles.noWorkplace}>Не привязан к рабочему месту</div>
                </>
              )}
            </div>
  
            {/* Секция с другими операторами */}
            {isAssignedToWorkplace && otherOperators.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Другие операторы на станке</h2>
                <div className={styles.infoGrid}>
                  {otherOperators.map((operator) => (
                    <div key={operator.userId} className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        Оператор №{operator.operatorNumber}:
                      </span>
                      <span className={styles.infoValue}>
                        {operator.firstName} {operator.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
              {isAssignedToWorkplace ? (
              <button
                className={`${styles.button} ${styles.endButton}`}
                onClick={handleEndWork}
                disabled={loading}
              >
                {loading ? 'Завершение...' : 'Закончить работу'}
              </button>
            ) : (
              <button
                className={`${styles.button} ${styles.selectButton}`}
                onClick={handleOpenModal}
                disabled={loading}
              >
                Выбрать рабочее место
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно подключения к станку */}
      <WorkplaceConnectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default OperatorDashboard;
