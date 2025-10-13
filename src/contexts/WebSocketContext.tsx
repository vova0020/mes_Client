import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  serverUrl = process.env.REACT_APP_WS_URL 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[WebSocketContext] already connected, skipping');
      return;
    }

    console.log('[WebSocketContext] connecting to:', serverUrl);
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      autoConnect: false
    });

    newSocket.on('connect', () => {
      console.log('[WebSocketContext] connected, socket.id:', newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[WebSocketContext] disconnected, reason:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[WebSocketContext] connect_error:', err.message);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    // Обработчики для комнат
    newSocket.on('room_joined', (data: any) => {
      console.log('[WebSocketContext] successfully joined room:', data);
    });

    newSocket.on('room_left', (data: any) => {
      console.log('[WebSocketContext] successfully left room:', data);
    });

    newSocket.on('room_error', (data: any) => {
      console.error('[WebSocketContext] room error:', data);
    });

    // Общие обработчики событий
    newSocket.onAny((eventName, ...args) => {
      console.log('[WebSocketContext] received event:', eventName, args);
    });

    socketRef.current = newSocket;
    newSocket.connect();
  }, [serverUrl]);

  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      console.log('[WebSocketContext] joining room:', room, 'socket.id:', socketRef.current.id);
      socketRef.current.emit('join_room', { room });
      
      // Подтверждение присоединения к комнате
      socketRef.current.emit('join_room', { room }, (response: any) => {
        console.log('[WebSocketContext] join room response:', response);
      });
    } else {
      console.warn('[WebSocketContext] cannot join room - not connected:', room, 'socket state:', {
        exists: !!socketRef.current,
        connected: socketRef.current?.connected,
        id: socketRef.current?.id
      });
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      console.log('[WebSocketContext] leaving room:', room);
      socketRef.current.emit('leave_room', { room });
    } else {
      console.warn('[WebSocketContext] cannot leave room - not connected:', room);
    }
  }, []);

  useEffect(() => {
    connect();
    
    const handleBeforeUnload = () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      error,
      joinRoom,
      leaveRoom
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};