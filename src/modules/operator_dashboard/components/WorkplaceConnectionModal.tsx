import React, { useState, useEffect } from 'react';
import styles from './WorkplaceConnectionModal.module.css';

interface WorkplaceConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (machineCode: string) => Promise<void>;
}

type TabType = 'code' | 'qr';

const WorkplaceConnectionModal: React.FC<WorkplaceConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('code');
  const [machineCode, setMachineCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMachineCode('');
      setError('');
      setSuccess('');
      setIsConnecting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Ограничиваем ввод 4 символами
    if (value.length <= 4) {
      setMachineCode(value);
      setError('');
    }
  };

  const handleConnect = async () => {
    // Валидация кода (4 символа)
    if (machineCode.length !== 4) {
      setError('Код станка должен состоять из 4 символов');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');
      setSuccess('Подключение к станку...');
      
      await onConnect(machineCode);
      
      // Если успешно, закрываем модальное окно
      setSuccess('Успешно подключено!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setSuccess('');
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не удалось подключиться к станку');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQRScan = () => {
    // TODO: Реализовать сканирование QR-кода
    console.log('Запуск сканера QR-кода');
    setError('Функция сканирования QR-кода будет реализована');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Подключение к станку</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'code' ? styles.active : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Ввод кода
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'qr' ? styles.active : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            QR-код
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'code' ? (
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="machineCode">
                Код станка
              </label>
              <input
                id="machineCode"
                type="text"
                className={styles.codeInput}
                value={machineCode}
                onChange={handleCodeChange}
                placeholder="Р311"
                maxLength={4}
                autoFocus
              />
              <div className={styles.hint}>
                Введите 4-значный код станка (например: Р311)
              </div>
            </div>
          ) : (
            <div className={styles.qrScannerContainer}>
              <div className={styles.qrPlaceholder}>
                <div className={styles.qrIcon}>📷</div>
                <div className={styles.qrText}>Наведите камеру на QR-код</div>
                <div className={styles.qrSubtext}>
                  QR-код находится на корпусе станка
                </div>
              </div>
              <button
                className={`${styles.button} ${styles.connectButton}`}
                onClick={handleQRScan}
              >
                Запустить сканер
              </button>
            </div>
          )}
        </div>

        {activeTab === 'code' && (
          <div className={styles.buttonGroup}>
            <button className={`${styles.button} ${styles.cancelButton}`} onClick={onClose}>
              Отмена
            </button>
            <button
              className={`${styles.button} ${styles.connectButton}`}
              onClick={handleConnect}
              disabled={machineCode.length !== 4 || isConnecting}
            >
              {isConnecting ? 'Подключение...' : 'Подключиться'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkplaceConnectionModal;
