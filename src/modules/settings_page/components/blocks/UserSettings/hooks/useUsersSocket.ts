import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../../../../contexts/SocketContext';
import { USERS_QUERY_KEYS } from './useUsersQuery';
import { User } from '../services/usersApi';

interface SocketUserEvents {
  'user:created': (data: { userId: number; login: string; firstName: string; lastName: string }) => void;
  'user:updated': (data: { userId: number; login: string }) => void;
  'user:deleted': (data: { userId: number; login: string }) => void;
  'user:role:assigned': (data: { userId: number; role: string; type: string }) => void;
  'user:role:removed': (data: { userId: number; role: string; type: string }) => void;
  'user:role:binding:created': (data: { userId: number; role: string; contextType: string; contextId: number }) => void;
  'user:role:binding:removed': (data: { bindingId: number; userId: number; role: string; contextType: string; contextId: number }) => void;
}

export const useUsersSocket = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[useUsersSocket] Socket не подключен, ждем подключения...');
      return;
    }

    console.log('[useUsersSocket] Настройка обработчиков событий пользователей');

    // Присоединяемся к комнате пользователей
    joinRoom('joinUsersRoom');

    // Обработчик создания пользователя
    const handleUserCreated = (data: any) => {
      console.log('[useUsersSocket] Новый пользователь создан:', data);
      
      // Инвалидируем список пользователей для обновления
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() });
      
      // Можно также добавить пользователя напрямую в кеш, если есть полные данные
      if (data.user) {
        queryClient.setQueryData(
          USERS_QUERY_KEYS.lists(),
          (oldData: User[] | undefined) => {
            if (oldData && !oldData.find(u => u.userId === data.user.userId)) {
              return [...oldData, data.user];
            }
            return oldData;
          }
        );
      }
    };

    // Обработчик обновления пользователя
    const handleUserUpdated = (data: any) => {
      console.log('[useUsersSocket] Пользователь обновлен:', data);
      
      // Инвалидируем список пользователей и детали конкретного пользователя
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.detail(data.userId) });
      
      // Обновляем данные в кеше, если есть полная информация
      if (data.user) {
        queryClient.setQueryData(
          USERS_QUERY_KEYS.lists(),
          (oldData: User[] | undefined) => {
            return oldData?.map(user => 
              user.userId === data.user.userId ? data.user : user
            ) || [];
          }
        );
        
        queryClient.setQueryData(
          USERS_QUERY_KEYS.detail(data.userId),
          data.user
        );
      }
    };

    // Обработчик удаления пользователя
    const handleUserDeleted = (data: any) => {
      console.log('[useUsersSocket] Пользователь удален:', data);
      
      // Удаляем пользователя из кеша
      queryClient.setQueryData(
        USERS_QUERY_KEYS.lists(),
        (oldData: User[] | undefined) => {
          return oldData?.filter(user => user.userId !== data.userId) || [];
        }
      );

      // Удаляем связанные данные из кеша
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.detail(data.userId) });
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.userRoles(data.userId) });
    };

    // Обработчик назначения роли
    const handleRoleAssigned = (data: any) => {
      console.log('[useUsersSocket] Роль назначена:', data);
      
      // Инвалидируем роли пользователя
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(data.userId) });
    };

    // Обработчик удаления роли
    const handleRoleRemoved = (data: any) => {
      console.log('[useUsersSocket] Роль удалена:', data);
      
      // Инвалидируем роли пользователя
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(data.userId) });
    };

    // Обработчик создания контекстной привязки
    const handleBindingCreated = (data: any) => {
      console.log('[useUsersSocket] Контекстная привязка создана:', data);
      
      // Инвалидируем роли пользователя
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(data.userId) });
    };

    // Обработчик удаления контекстной привязки
    const handleBindingRemoved = (data: any) => {
      console.log('[useUsersSocket] Контекстная привязка удалена:', data);
      
      // Инвалидируем роли пользователя
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(data.userId) });
    };

    // Регистрируем обработчики событий
    socket.on('user:created', handleUserCreated);
    socket.on('user:updated', handleUserUpdated);
    socket.on('user:deleted', handleUserDeleted);
    socket.on('user:role:assigned', handleRoleAssigned);
    socket.on('user:role:removed', handleRoleRemoved);
    socket.on('user:role:binding:created', handleBindingCreated);
    socket.on('user:role:binding:removed', handleBindingRemoved);

    // Общие обработчики для отладки
    const handleConnect = () => {
      console.log('[useUsersSocket] Подключен к Socket.IO серверу');
      joinRoom('joinUsersRoom'); // Переподключаемся к комнате при восстановлении соединения
    };

    const handleDisconnect = (reason: string) => {
      console.log('[useUsersSocket] Отключен от Socket.IO сервера:', reason);
    };

    const handleConnectError = (error: any) => {
      console.error('[useUsersSocket] Ошибка подключения к Socket.IO:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Очистка при размонтировании компонента
    return () => {
      console.log('[useUsersSocket] Отключение обработчиков событий пользователей');
      
      // Отключаемся от комнаты
      leaveRoom('joinUsersRoom');
      
      // Удаляем обработчики событий
      socket.off('user:created', handleUserCreated);
      socket.off('user:updated', handleUserUpdated);
      socket.off('user:deleted', handleUserDeleted);
      socket.off('user:role:assigned', handleRoleAssigned);
      socket.off('user:role:removed', handleRoleRemoved);
      socket.off('user:role:binding:created', handleBindingCreated);
      socket.off('user:role:binding:removed', handleBindingRemoved);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket, isConnected, queryClient, joinRoom, leaveRoom]);

  // Возвращаем информацию о состоянии подключения для отладки
  return {
    isConnected,
    socketId: socket?.id
  };
};