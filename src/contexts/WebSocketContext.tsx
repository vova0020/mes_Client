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
    if (socketRef.current?.connected) return;

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      autoConnect: false
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    newSocket.connect();
  }, [serverUrl]);

  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { room });
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', { room });
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
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