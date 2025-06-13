import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connected: boolean;
  connectionAttempts: number;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
  emit: (event: string, data?: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
  autoConnect?: boolean;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  serverUrl = 'http://localhost:5000',
  autoConnect = true,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const createSocket = useCallback(() => {
    console.log('🔌 Создание Socket.IO соединения...', serverUrl);
    
    const newSocket = io(serverUrl, {
      autoConnect: false,
      reconnection: true, // Мы сами управляем переподключением
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    // Обработчики событий соединения
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO подключен:', newSocket.id);
      setIsConnected(true);
      setConnectionAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO отключен:', reason);
      setIsConnected(false);
      
      // Автоматическое переподключение при неожиданном отключении
      if (reason === 'io server disconnect') {
        // Сервер принудительно отключил соединение
        console.log('🔄 Сервер отключил соединение, попытка переподключения...');
        scheduleReconnect();
      } else if (reason === 'transport close' || reason === 'transport error') {
        console.log('🔄 Ошибка транспорта, попытка переподключения...');
        scheduleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Ошибка подключения Socket.IO:', error);
      setIsConnected(false);
      scheduleReconnect();
    });

    // Обработчики событий материалов
    newSocket.on('materialCreated', (data) => {
      console.log('📦 Новый материал создан:', data);
      // Событие будет обработано в MaterialsSocketHandler
    });

    newSocket.on('materialUpdated', (data) => {
      console.log('📝 Материал обновлен:', data);
    });

    newSocket.on('materialDeleted', (data) => {
      console.log('🗑️ Материал удален:', data);
    });

    newSocket.on('materialLinkedToGroup', (data) => {
      console.log('🔗 Материал привязан к группе:', data);
    });

    newSocket.on('materialUnlinkedFromGroup', (data) => {
      console.log('🔓 Материал отвязан от группы:', data);
    });

    // Обработчики событий групп материалов
    newSocket.on('materialGroupCreated', (data) => {
      console.log('📁 Новая группа материалов создана:', data);
    });

    newSocket.on('materialGroupUpdated', (data) => {
      console.log('📝 Группа материалов обновлена:', data);
    });

    newSocket.on('materialGroupDeleted', (data) => {
      console.log('🗑️ Группа материалов удалена:', data);
    });

    return newSocket;
  }, [serverUrl]);

  const scheduleReconnect = useCallback(() => {
    if (connectionAttempts >= maxReconnectAttempts) {
      console.log('❌ Превышено максимальное количество попыток переподключения');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = reconnectDelay * Math.pow(1.5, connectionAttempts);
    console.log(`🔄 Переподключение через ${delay}ms (попытка ${connectionAttempts + 1}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionAttempts(prev => prev + 1);
      if (socket) {
        socket.connect();
      }
    }, delay);
  }, [connectionAttempts, socket]);

  const joinRoom = useCallback((roomName: string) => {
    if (socket && isConnected) {
      console.log('🏠 Подключение к комнате:', roomName);
      socket.emit(roomName);
    } else {
      console.warn('⚠️ Socket не подключен, невозможно присоединиться к комнате:', roomName);
    }
  }, [socket, isConnected]);

  const leaveRoom = useCallback((roomName: string) => {
    if (socket && isConnected) {
      console.log('🚪 Отключение от комнаты:', roomName);
      socket.emit(`leave${roomName.charAt(0).toUpperCase() + roomName.slice(1)}`);
    }
  }, [socket, isConnected]);

  const disconnect = useCallback(() => {
    console.log('🔌 Принудительное отключение Socket.IO');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.disconnect();
    }
    setIsConnected(false);
    setConnectionAttempts(0);
  }, [socket]);

  const reconnect = useCallback(() => {
    console.log('🔄 Принудительное переподключение Socket.IO');
    setConnectionAttempts(0);
    if (socket) {
      socket.connect();
    }
  }, [socket]);

  // Добавляем методы для работы с событиями
  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (socket) {
      socket.on(event, handler);
    }
  }, [socket]);

  const off = useCallback((event: string, handler: (data: any) => void) => {
    if (socket) {
      socket.off(event, handler);
    }
  }, [socket]);

  const emit = useCallback((event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  // Инициализация соединения
  useEffect(() => {
    if (autoConnect) {
      const newSocket = createSocket();
      setSocket(newSocket);
      newSocket.connect();

      return () => {
        console.log('🧹 Очистка Socket.IO соединения');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        newSocket.disconnect();
      };
    }
  }, [createSocket, autoConnect]);

  // Автоматическое подключение к комнатам материалов при соединении
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🏠 Автоматическое подключен��е к комнатам материалов');
      joinRoom('joinMaterialsRoom');
      joinRoom('joinMaterialGroupsRoom');
    }
  }, [socket, isConnected, joinRoom]);

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    connected: isConnected, // Добавляем connected как alias для isConnected
    connectionAttempts,
    joinRoom,
    leaveRoom,
    disconnect,
    reconnect,
    on,
    off,
    emit,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};