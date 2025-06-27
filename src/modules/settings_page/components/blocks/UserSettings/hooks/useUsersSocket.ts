import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../../../../contexts/SocketContext';
import { USERS_QUERY_KEYS } from './useUsersQuery';
import { User, Picker } from '../services/usersApi';

interface SocketUserEvents {
  'userCreated': (data: { userId: number; login: string; firstName: string; lastName: string }) => void;
  'userUpdated': (data: { userId: number; login: string }) => void;
  'userDeleted': (data: { userId: number; login: string }) => void;
  'userRoleAssigned': (data: { userId: number; role: string; type: string }) => void;
  'userRoleRemoved': (data: { userId: number; role: string; type: string }) => void;
  'userRoleBindingCreated': (data: { userId: number; role: string; contextType: string; contextId: number }) => void;
  'userRoleBindingRemoved': (data: { bindingId: number; userId: number; role: string; contextType: string; contextId: number }) => void;
  'pickerCreated': (data: { pickerId: number; userId: number; userName: string }) => void;
  'pickerUpdated': (data: { pickerId: number; userId: number }) => void;
  'pickerDeleted': (data: { pickerId: number; userId: number }) => void;
}

export const useUsersSocket = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[useUsersSocket] Socket не подключен, ждем подключения...');
      return;
    }

    console.log('[useUsersSocket] Настройка обработчиков событий пользователей и комплектовщиков');

    // Присоединяемся к комнатам
    joinRoom('settings-user');

    // Обработчики событий пользователей

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
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.pickerByUser(data.userId) });
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

    // Обработчики событий комплектовщиков

    // Обработчик создания комплектовщика
    const handlePickerCreated = (data: any) => {
      console.log('[useUsersSocket] Комплектовщик создан:', data);
      
      // Инвалидируем список комплектовщиков для обновления
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.pickersList() });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contextPickers() });
      
      // Можно также добавить комплектовщика напрямую в кеш, если есть полные данные
      if (data.picker) {
        queryClient.setQueryData(
          USERS_QUERY_KEYS.pickersList(),
          (oldData: Picker[] | undefined) => {
            if (oldData && !oldData.find(p => p.pickerId === data.picker.pickerId)) {
              return [...oldData, data.picker];
            }
            return oldData;
          }
        );
      }
    };

    // Обработчик обновления комплектовщика
    const handlePickerUpdated = (data: any) => {
      console.log('[useUsersSocket] Комплектовщ��к обновлен:', data);
      
      // Инвалидируем список комплектовщиков и детали конкретного комплектовщика
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.pickersList() });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.pickerDetail(data.pickerId) });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contextPickers() });
      
      // Обновляем данные в кеше, если есть полная информация
      if (data.picker) {
        queryClient.setQueryData(
          USERS_QUERY_KEYS.pickersList(),
          (oldData: Picker[] | undefined) => {
            return oldData?.map(picker => 
              picker.pickerId === data.picker.pickerId ? data.picker : picker
            ) || [];
          }
        );
        
        queryClient.setQueryData(
          USERS_QUERY_KEYS.pickerDetail(data.pickerId),
          data.picker
        );
      }
    };

    // Обработчик удаления комплектовщика
    const handlePickerDeleted = (data: any) => {
      console.log('[useUsersSocket] Комплектовщик удален:', data);
      
      // Уда��яем комплектовщика из кеша
      queryClient.setQueryData(
        USERS_QUERY_KEYS.pickersList(),
        (oldData: Picker[] | undefined) => {
          return oldData?.filter(picker => picker.pickerId !== data.pickerId) || [];
        }
      );

      // Удаляем связанные данные из кеша
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.pickerDetail(data.pickerId) });
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.pickerByUser(data.userId) });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contextPickers() });
    };

    // Регистрируем обработчики событий пользователей (согласно новой документации)
    socket.on('userCreated', handleUserCreated);
    socket.on('userUpdated', handleUserUpdated);
    socket.on('userDeleted', handleUserDeleted);
    socket.on('userRoleAssigned', handleRoleAssigned);
    socket.on('userRoleRemoved', handleRoleRemoved);
    socket.on('userRoleBindingCreated', handleBindingCreated);
    socket.on('userRoleBindingRemoved', handleBindingRemoved);

    // Регистрируем обработчики событий комплектовщиков (согласно новой документации)
    socket.on('pickerCreated', handlePickerCreated);
    socket.on('pickerUpdated', handlePickerUpdated);
    socket.on('pickerDeleted', handlePickerDeleted);

    // Общие обработчики для отладки
    const handleConnect = () => {
      console.log('[useUsersSocket] Подключен к Socket.IO серверу');
      joinRoom('settings-user'); // Переподключаемся к комнате при восстановлении соединения
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
      console.log('[useUsersSocket] Отключение обработчиков событий пользователей и комплектовщиков');
      
      // Отключаемся от комнат
      leaveRoom('settings-user');
      
      // Удаляем обработчики событий пользователей
      socket.off('userCreated', handleUserCreated);
      socket.off('userUpdated', handleUserUpdated);
      socket.off('userDeleted', handleUserDeleted);
      socket.off('userRoleAssigned', handleRoleAssigned);
      socket.off('userRoleRemoved', handleRoleRemoved);
      socket.off('userRoleBindingCreated', handleBindingCreated);
      socket.off('userRoleBindingRemoved', handleBindingRemoved);
      
      // Удаляем обра��отчики событий комплектовщиков
      socket.off('pickerCreated', handlePickerCreated);
      socket.off('pickerUpdated', handlePickerUpdated);
      socket.off('pickerDeleted', handlePickerDeleted);
      
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