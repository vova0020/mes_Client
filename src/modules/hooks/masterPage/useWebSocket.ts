// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHookOptions {
  room: string; // Комната для подключения
  serverUrl?: string; // URL сервера (по умолчанию из env)
  autoConnect?: boolean; // Автоматически подключаться при инициализации
}

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const useWebSocket = ({
  room,
  serverUrl = process.env.REACT_APP_WS_URL || 'http://localhost:3001',
  autoConnect = true
}: WebSocketHookOptions): WebSocketHookReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const roomRef = useRef<string>(room);

  // Обновляем roomRef когда изменяется room
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      console.log(`Connecting to ${serverUrl} with room: ${roomRef.current}`);
      
      // Создаем новое соединение с указанием комнаты в query параметрах
      const newSocket = io(serverUrl, {
        query: {
          room: roomRef.current
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        autoConnect: false
      });

      // Обработчики событий подключения
      newSocket.on('connect', () => {
        console.log(`Connected to WebSocket server. Socket ID: ${newSocket.id}`);
        setIsConnected(true);
        setError(null);
        
        // Дополнительно отправляем запрос на присоединение к комнате
        // (на случай, если query параметр не сработал)
        newSocket.emit('join_room', { room: roomRef.current });
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`Disconnected from WebSocket server. Reason: ${reason}`);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });

      // Обработчики событий комнат
      newSocket.on('joined', (data) => {
        console.log('Successfully joined room:', data.room);
      });

      newSocket.on('left', (data) => {
        console.log('Successfully left room:', data.room);
      });

      newSocket.on('error', (data) => {
        console.error('Server error:', data.message);
        setError(data.message);
      });

      newSocket.on('available_rooms', (data) => {
        console.log('Available rooms:', data.rooms);
      });

      socketRef.current = newSocket;
      newSocket.connect();
      
    } catch (err) {
      console.error('Error creating socket connection:', err);
      setError(err instanceof Error ? err.message : 'Unknown connection error');
    }
  }, [serverUrl]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting from WebSocket server');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const joinRoom = useCallback((newRoom: string) => {
    if (socketRef.current?.connected) {
      console.log(`Joining room: ${newRoom}`);
      socketRef.current.emit('join_room', { room: newRoom });
      roomRef.current = newRoom;
    } else {
      console.warn('Cannot join room: socket not connected');
    }
  }, []);

  const leaveRoom = useCallback((roomToLeave: string) => {
    if (socketRef.current?.connected) {
      console.log(`Leaving room: ${roomToLeave}`);
      socketRef.current.emit('leave_room', { room: roomToLeave });
    } else {
      console.warn('Cannot leave room: socket not connected');
    }
  }, []);

  // Автоматическое подключение при монтировании компонента
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup при размонтировании
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect, autoConnect]);

  // Переподключение при изменении комнаты
  useEffect(() => {
    if (socketRef.current?.connected && room !== roomRef.current) {
      // Покидаем старую комнату и присоединяемся к новой
      if (roomRef.current) {
        leaveRoom(roomRef.current);
      }
      joinRoom(room);
    }
  }, [room, joinRoom, leaveRoom]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
    joinRoom,
    leaveRoom
  };
};

export default useWebSocket;