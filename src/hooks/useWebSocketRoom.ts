import { useEffect } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';

interface UseWebSocketRoomOptions {
  room: string;
  autoJoin?: boolean;
}

export const useWebSocketRoom = ({ room, autoJoin = true }: UseWebSocketRoomOptions) => {
  const { socket, isConnected, error, joinRoom, leaveRoom } = useWebSocketContext();

  useEffect(() => {
    if (isConnected && autoJoin) {
      console.log('[useWebSocketRoom] joining room:', room);
      joinRoom(room);
    }

    return () => {
      if (isConnected && autoJoin) {
        console.log('[useWebSocketRoom] leaving room:', room);
        leaveRoom(room);
      }
    };
  }, [room, isConnected, autoJoin, joinRoom, leaveRoom]);

  return {
    socket,
    isConnected,
    error,
    joinRoom,
    leaveRoom
  };
};