import React from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const WebSocketDebug: React.FC = () => {
  const { socket, isConnected, error } = useWebSocketContext();

  const testConnection = () => {
    if (socket) {
      console.log('Тестируем WebSocket подключение...');
      socket.emit('test_connection', { message: 'test from client' });
    }
  };

  const testJoinRoom = () => {
    if (socket) {
      console.log('Тестируем присоединение к комнате...');
      socket.emit('join_room', { room: 'room:masterypack' });
    }
  };

  const testPackageEvent = () => {
    if (socket) {
      console.log('Тестируем отправку события упаковки...');
      socket.emit('test_package_event', { status: 'updated' });
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4>WebSocket Debug</h4>
      <div>
        <strong>Статус:</strong> {isConnected ? '✅ Подключен' : '❌ Отключен'}
      </div>
      <div>
        <strong>Socket ID:</strong> {socket?.id || 'N/A'}
      </div>
      {error && (
        <div style={{ color: 'red' }}>
          <strong>Ошибка:</strong> {error}
        </div>
      )}
      <div style={{ marginTop: '10px' }}>
        <button onClick={testConnection} disabled={!isConnected}>
          Тест подключения
        </button>
        <br />
        <button onClick={testJoinRoom} disabled={!isConnected}>
          Тест комнаты
        </button>
        <br />
        <button onClick={testPackageEvent} disabled={!isConnected}>
          Тест события
        </button>
      </div>
    </div>
  );
};

export default WebSocketDebug;