import React, { useState } from 'react';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import styles from './SocketConnectionIndicator.module.css';

interface SocketConnectionIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
}

export const SocketConnectionIndicator: React.FC<SocketConnectionIndicatorProps> = ({
  position = 'bottom-right',
  showDetails = false,
}) => {
  const { isConnected, error } = useWebSocketContext();
  const connectionAttempts = 0; // Заглушка для совместимости
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusText = () => {
    if (isConnected) return 'Подключено';
    if (connectionAttempts > 0) return `Переподключение... (${connectionAttempts})`;
    return 'Отключено';
  };

  const getStatusColor = () => {
    if (isConnected) return '#10b981'; // green
    if (connectionAttempts > 0) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleReconnect = () => {
    // Переподключение через новый WebSocket контекст
    window.location.reload();
  };

  const handleDisconnect = () => {
    // Отключение через новый WebSocket контекст
    console.log('Отключение WebSocket');
  };

  return (
    <div className={`${styles.indicator} ${styles[position]}`}>
      {/* Основной индикатор */}
      <div 
        className={styles.statusBadge}
        onClick={showDetails ? handleToggleExpanded : undefined}
        style={{ cursor: showDetails ? 'pointer' : 'default' }}
      >
        <div 
          className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`}
          style={{ backgroundColor: getStatusColor() }}
        />
        {showDetails && (
          <span className={styles.statusText}>
            {getStatusText()}
          </span>
        )}
      </div>

      {/* Детальная панель */}
      {showDetails && isExpanded && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsHeader}>
            <h4 className={styles.detailsTitle}>Socket.IO</h4>
            <button 
              className={styles.closeButton}
              onClick={handleToggleExpanded}
            >
              ×
            </button>
          </div>
          
          <div className={styles.detailsContent}>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Статус:</span>
              <span 
                className={styles.statusValue}
                style={{ color: getStatusColor() }}
              >
                {getStatusText()}
              </span>
            </div>
            
            {connectionAttempts > 0 && (
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>Попытки:</span>
                <span className={styles.statusValue}>
                  {connectionAttempts} / 5
                </span>
              </div>
            )}
            
            <div className={styles.detailsActions}>
              {!isConnected && (
                <button 
                  className={`${styles.actionButton} ${styles.reconnectButton}`}
                  onClick={handleReconnect}
                >
                  🔄 Переподключить
                </button>
              )}
              
              {isConnected && (
                <button 
                  className={`${styles.actionButton} ${styles.disconnectButton}`}
                  onClick={handleDisconnect}
                >
                  🔌 Отключить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};