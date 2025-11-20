import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  getJoinedRooms: () => string[];
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
  serverUrl = process.env.REACT_APP_WS_URL ?? ''
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Map room -> count of subscribers
  const joinCountsRef = useRef<Map<string, number>>(new Map());

  // Create/connect socket once
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

    // Core lifecycle handlers
    const onConnect = () => {
      console.log('[WebSocketContext] connected, socket.id:', newSocket.id);
      setIsConnected(true);
      setError(null);

      // re-join all rooms that have positive counts
      Array.from(joinCountsRef.current.keys()).forEach(room => {
        try {
          // try the common "join" API first (backend may expect 'join')
          newSocket.emit('join', room, (ack: any) => {
            console.log('[WebSocketContext] re-join ack (join):', room, ack);
          });
        } catch (e) {
          /* ignore */
        }
        try {
          // also attempt legacy/alternate event name if backend expects it
          newSocket.emit('join_room', { room }, (ack: any) => {
            console.log('[WebSocketContext] re-join ack (join_room):', room, ack);
          });
        } catch (e) {
          /* ignore */
        }
      });
    };

    const onDisconnect = (reason: any) => {
      console.log('[WebSocketContext] disconnected, reason:', reason);
      setIsConnected(false);
    };

    const onConnectError = (err: any) => {
      console.error('[WebSocketContext] connect_error:', err?.message ?? err);
      setError(`Connection error: ${err?.message ?? String(err)}`);
      setIsConnected(false);
    };

    // Some servers emit different event names; listen to common ones for debug + logs
    const onJoined = (data: any) => console.log('[WebSocketContext] joined:', data);
    const onLeft = (data: any) => console.log('[WebSocketContext] left:', data);
    const onRoomJoined = (data: any) => console.log('[WebSocketContext] room_joined:', data);
    const onRoomLeft = (data: any) => console.log('[WebSocketContext] room_left:', data);

    // global onAny for debugging (keeps previous behavior)
    const onAnyHandler = (evt: string, ...args: any[]) => {
      console.log('[WebSocketContext] received event:', evt, args);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onConnectError);

    // compatibility: listen to various "joined"/"left" events the backend might emit
    newSocket.on('joined', onJoined);
    newSocket.on('left', onLeft);
    newSocket.on('room_joined', onRoomJoined);
    newSocket.on('room_left', onRoomLeft);

    // keep onAny (useful) — if performance/verbosity is concern, remove after debugging
    if ((newSocket as any).onAny) {
      (newSocket as any).onAny(onAnyHandler);
    }

    socketRef.current = newSocket;
    newSocket.connect();

    // cleanup when socket is replaced/closed
    const cleanup = () => {
      try {
        newSocket.off('connect', onConnect);
        newSocket.off('disconnect', onDisconnect);
        newSocket.off('connect_error', onConnectError);
        newSocket.off('joined', onJoined);
        newSocket.off('left', onLeft);
        newSocket.off('room_joined', onRoomJoined);
        newSocket.off('room_left', onRoomLeft);
        if ((newSocket as any).offAny) (newSocket as any).offAny(onAnyHandler);
      } catch (e) {
        /* ignore */
      }
    };

    // If provider unmounts, caller effect will call socketRef.current?.disconnect()
    return cleanup;
  }, [serverUrl]);

  // joinRoom with ref-counting
  const joinRoom = useCallback((room: string) => {
    const socket = socketRef.current;
    if (!room) return;

    const prev = joinCountsRef.current.get(room) ?? 0;
    joinCountsRef.current.set(room, prev + 1);

    // If this is the first subscriber, actually emit join to server
    if (prev === 0) {
      if (!socket) {
        console.warn('[WebSocketContext] joinRoom: socket not ready yet, will join on connect:', room);
        return;
      }
      console.log('[WebSocketContext] joining room (first subscriber):', room, 'socket.id:', socket.id);

      // Try common join variants. Server should handle idempotency.
      try {
        socket.emit('join', room, (ack: any) => console.log('[WebSocketContext] join ack (join):', room, ack));
      } catch (e) { /* ignore */ }

      try {
        socket.emit('join_room', { room }, (ack: any) => console.log('[WebSocketContext] join ack (join_room):', room, ack));
      } catch (e) { /* ignore */ }
    } else {
      console.log('[WebSocketContext] joinRoom: incremented count for', room, '->', prev + 1);
    }
  }, []);

  // leaveRoom with ref-counting
  const leaveRoom = useCallback((room: string) => {
    const socket = socketRef.current;
    if (!room) return;

    const prev = joinCountsRef.current.get(room) ?? 0;
    if (prev <= 1) {
      joinCountsRef.current.delete(room);
      if (!socket) {
        console.warn('[WebSocketContext] leaveRoom: socket not ready but clearing count for', room);
        return;
      }
      console.log('[WebSocketContext] leaving room (no more subscribers):', room);
      try {
        socket.emit('leave', room, (ack: any) => console.log('[WebSocketContext] leave ack (leave):', room, ack));
      } catch (e) { /* ignore */ }
      try {
        socket.emit('leave_room', { room }, (ack: any) => console.log('[WebSocketContext] leave ack (leave_room):', room, ack));
      } catch (e) { /* ignore */ }
    } else {
      joinCountsRef.current.set(room, prev - 1);
      console.log('[WebSocketContext] leaveRoom: decremented count for', room, '->', prev - 1);
    }
  }, []);

  const getJoinedRooms = useCallback(() => Array.from(joinCountsRef.current.keys()), []);

  // connect once on mount
  useEffect(() => {
    const cleanupConnect = connect();
    // cleanup function
    const handleBeforeUnload = () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // disconnect socket on provider unmount
      try {
        socketRef.current?.disconnect();
      } catch (e) { /* ignore */ }
      // cleanup returned from connect if any
      if (typeof cleanupConnect === 'function') cleanupConnect();
    };
    // connect is stable (memoized)
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      error,
      joinRoom,
      leaveRoom,
      getJoinedRooms
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
