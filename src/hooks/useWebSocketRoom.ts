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
      joinRoom(room);
    }

    return () => {
      if (isConnected) {
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