import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useMemo } from 'react';
import { 
  UsersApiService, 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  UserRoles,
  AssignGlobalRoleDto,
  CreateRoleBindingDto,
  AvailableRoles,
  ContextMachine,
  ContextStage,
  ContextPicker,
  Picker,
  CreatePickerDto,
  CreatePickerWithRoleDto,
  UpdatePickerDto,
  CreatePickerWithRoleResponse
} from '../services/usersApi';
import { useWebSocketRoom } from '../../../../../../hooks/useWebSocketRoom';

// Ключи для кэширования запросов
export const USERS_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USERS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...USERS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...USERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...USERS_QUERY_KEYS.details(), id] as const,
  roles: () => [...USERS_QUERY_KEYS.all, 'roles'] as const,
  userRoles: (userId: number) => [...USERS_QUERY_KEYS.roles(), userId] as const,
  availableRoles: () => [...USERS_QUERY_KEYS.roles(), 'available'] as const,
  context: () => [...USERS_QUERY_KEYS.all, 'context'] as const,
  contextMachines: () => [...USERS_QUERY_KEYS.context(), 'machines'] as const,
  contextStages: () => [...USERS_QUERY_KEYS.context(), 'stages'] as const,
  contextPickers: () => [...USERS_QUERY_KEYS.context(), 'pickers'] as const,
  pickers: () => [...USERS_QUERY_KEYS.all, 'pickers'] as const,
  pickersList: () => [...USERS_QUERY_KEYS.pickers(), 'list'] as const,
  pickerDetail: (id: number) => [...USERS_QUERY_KEYS.pickers(), 'detail', id] as const,
  pickerByUser: (userId: number) => [...USERS_QUERY_KEYS.pickers(), 'by-user', userId] as const,
};

// === WebSocket ИНТЕГРАЦИЯ ===

// Хук для WebSocket интеграции с данными пользователей
export const useUsersWebSocket = () => {
  const queryClient = useQueryClient();
  const refreshTimeoutRef = useRef<number | null>(null);
  const REFRESH_DEBOUNCE_MS = 300;
  
  // Получаем комнату для WebSocket подключения
  const room = useMemo(() => 'room:technologist', []);
  
  // Инициализируем WebSocket подключение
  const { 
    socket, 
    isConnected: isWebSocketConnected, 
    error: webSocketError 
  } = useWebSocketRoom({ 
    room,
    autoJoin: true 
  });

  // Функция для обновления данных пользователей
  const refreshUserData = async (status: string) => {
    try {
      if (status !== 'updated') {
        console.warn('Игнорируем неожиданный status from socket для пользователей:', status);
        return;
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          // Инвалидируем все запросы пользователей для обновления
          queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
          console.log('Данные пользователей обновлены (debounced).');
        } catch (err) {
          console.error('Ошибка обновления данных пользователей:', err);
        }
      }, REFRESH_DEBOUNCE_MS);
    } catch (err) {
      console.error('Ошибка в refreshUserData:', err);
    }
  };

  // Настройка WebSocket обработчиков событий
  useEffect(() => {
    if (!socket || !isWebSocketConnected) return;

    console.log('Настройка WebSocket обработчиков для пользователей в комнате:', room);

    // Обработчик события изменения настроек пользователей
    const handleUserSettingsEvent = async (data: { status: string }) => {
      console.log('Получено WebSocket событие user_settings:event - status:', data.status);
      await refreshUserData(data.status);
    };

    // Регистрируем обработчик события
    socket.on('user_settings:event', handleUserSettingsEvent);

    // Cleanup функция
    return () => {
      socket.off('user_settings:event', handleUserSettingsEvent);

      // очистка debounce таймера при unmount/переподключении
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [socket, isWebSocketConnected, room, queryClient]);

  return {
    isWebSocketConnected,
    webSocketError
  };
};

// Хуки для CRUD операций с пользователями

// Получить всех пользователей
export const useUsers = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.lists(),
    queryFn: UsersApiService.getAllUsers,
    staleTime: 1000 * 60 * 5, // 5 минут
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить пользователя по ID
export const useUser = (id: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.detail(id!),
    queryFn: () => UsersApiService.getUserById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Создать пользователя
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => UsersApiService.createUser(userData),
    onSuccess: (newUser) => {
      // Обновляем кэш со списком пользователей (добавляем и сортируем по ID)
      queryClient.setQueryData(
        USERS_QUERY_KEYS.lists(),
        (oldData: User[] | undefined) => {
          const updatedData = oldData ? [...oldData, newUser] : [newUser];
          return updatedData.sort((a, b) => a.userId - b.userId);
        }
      );
      
      // Добавляем в кэш детали нового пользователя
      queryClient.setQueryData(
        USERS_QUERY_KEYS.detail(newUser.userId),
        newUser
      );
    },
  });
};

// Обновить пользователя
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDto }) =>
      UsersApiService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      // Обновляем кэш со списком пользователей
      queryClient.setQueryData(
        USERS_QUERY_KEYS.lists(),
        (oldData: User[] | undefined) => {
          return oldData?.map(user =>
            user.userId === updatedUser.userId ? updatedUser : user
          ) || [];
        }
      );

      // Обновляем кэш с деталями пользователя
      queryClient.setQueryData(
        USERS_QUERY_KEYS.detail(updatedUser.userId),
        updatedUser
      );
    },
  });
};

// Удалить пользователя
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => UsersApiService.deleteUser(id),
    onSuccess: (_, deletedId) => {
      // Удаляем из кэша списка пользователей
      queryClient.setQueryData(
        USERS_QUERY_KEYS.lists(),
        (oldData: User[] | undefined) => {
          return oldData?.filter(user => user.userId !== deletedId) || [];
        }
      );

      // Удаляем из кэша детали пользователя
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.detail(deletedId) });
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.userRoles(deletedId) });
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.pickerByUser(deletedId) });
    },
  });
};

// Хуки для управления комплектовщиками

// Получить всех комплектовщиков
export const usePickers = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.pickersList(),
    queryFn: UsersApiService.getAllPickers,
    staleTime: 1000 * 60 * 5, // 5 минут
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить комплектовщика по ID
export const usePicker = (id: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.pickerDetail(id!),
    queryFn: () => UsersApiService.getPickerById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить комплектовщика по ID пользователя
export const usePickerByUserId = (userId: number | undefined) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.pickerByUser(userId!),
    queryFn: () => UsersApiService.getPickerByUserId(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: false, // Не повторяем запрос, если комплектовщика нет
  });
};

// Создать комплектовщика
export const useCreatePicker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePickerDto) => UsersApiService.createPicker(data),
    onSuccess: (newPicker) => {
      // Обновляем кэш со списком комплектовщиков
      queryClient.setQueryData(
        USERS_QUERY_KEYS.pickersList(),
        (oldData: Picker[] | undefined) => {
          return oldData ? [...oldData, newPicker] : [newPicker];
        }
      );

      // Обновляем кэш контекстных комплектовщиков
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contextPickers() });
    },
  });
};

// Создать комплектовщика с ролью
export const useCreatePickerWithRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePickerWithRoleDto) => UsersApiService.createPickerWithRole(data),
    onSuccess: (response: CreatePickerWithRoleResponse) => {
      // Обновляем кэш со списком комплектовщиков
      queryClient.setQueryData(
        USERS_QUERY_KEYS.pickersList(),
        (oldData: Picker[] | undefined) => {
          return oldData ? [...oldData, response.picker] : [response.picker];
        }
      );

      // Обновляем кэш контекстных комплектовщиков
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contextPickers() });

      // Если была назначена роль, обновляем роли пользователя
      if (response.roleBindingId) {
        queryClient.invalidateQueries({ 
          queryKey: USERS_QUERY_KEYS.userRoles(response.picker.userId) 
        });
      }
    },
  });
};

// Обновить комплектовщика
export const useUpdatePicker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePickerDto }) =>
      UsersApiService.updatePicker(id, data),
    onSuccess: (updatedPicker) => {
      // Обновляем кэш со списком комплектовщиков
      queryClient.setQueryData(
        USERS_QUERY_KEYS.pickersList(),
        (oldData: Picker[] | undefined) => {
          return oldData?.map(picker =>
            picker.pickerId === updatedPicker.pickerId ? updatedPicker : picker
          ) || [];
        }
      );

      // Обновляем кэш с деталями комплектовщика
      queryClient.setQueryData(
        USERS_QUERY_KEYS.pickerDetail(updatedPicker.pickerId),
        updatedPicker
      );

      // Обновляем кэш контекстных комплектовщиков
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contextPickers() });
    },
  });
};

// Удалить комплектовщика
export const useDeletePicker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => UsersApiService.deletePicker(id),
    onSuccess: (_, deletedId) => {
      // Удаляем из кэша списка комплектовщиков
      queryClient.setQueryData(
        USERS_QUERY_KEYS.pickersList(),
        (oldData: Picker[] | undefined) => {
          return oldData?.filter(picker => picker.pickerId !== deletedId) || [];
        }
      );

      // Удаляем из кэша детали комплектовщика
      queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.pickerDetail(deletedId) });

      // Обновляем кэш контекстных комплектовщиков
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.contextPickers() });
    },
  });
};

// Хуки для управления ролями

// Получить роли пользователя
export const useUserRoles = (userId: number | undefined) => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.userRoles(userId!),
    queryFn: () => UsersApiService.getUserRoles(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить доступные роли
export const useAvailableRoles = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.availableRoles(),
    queryFn: UsersApiService.getAvailableRoles,
    staleTime: 1000 * 60 * 10, // 10 минут (данные изменяются редко)
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Назначить глобальную роль
export const useAssignGlobalRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignGlobalRoleDto) => UsersApiService.assignGlobalRole(data),
    onSuccess: (_, { userId }) => {
      // Инвалидируем роли пользователя для обновления
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(userId) });
    },
  });
};

// Удалить глобальную роль
export const useRemoveGlobalRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      UsersApiService.removeGlobalRole(userId, role),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(userId) });
    },
  });
};

// Создать контекстную привязку
export const useCreateRoleBinding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleBindingDto) => UsersApiService.createRoleBinding(data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(userId) });
    },
  });
};

// Удалить контекстную привязку
export const useRemoveRoleBinding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bindingId, userId }: { bindingId: number; userId: number }) =>
      UsersApiService.removeRoleBinding(bindingId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.userRoles(userId) });
    },
  });
};

// Хуки для контекстных данных

// Получить станки для привязки
export const useContextMachines = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.contextMachines(),
    queryFn: UsersApiService.getContextMachines,
    staleTime: 1000 * 60 * 10, // 10 минут
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить этапы для привязки
export const useContextStages = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.contextStages(),
    queryFn: UsersApiService.getContextStages,
    staleTime: 1000 * 60 * 10, // 10 минут
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Получить комплектовщиков для привязки
export const useContextPickers = () => {
  // Инициализируем WebSocket интеграцию
  const { isWebSocketConnected, webSocketError } = useUsersWebSocket();
  
  const query = useQuery({
    queryKey: USERS_QUERY_KEYS.contextPickers(),
    queryFn: UsersApiService.getContextPickers,
    staleTime: 1000 * 60 * 10, // 10 минут
  });

  return {
    ...query,
    isWebSocketConnected,
    webSocketError
  };
};

// Хук для проверки доступности API
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: UsersApiService.healthCheck,
    refetchInterval: 1000 * 60, // Проверяем каждую минуту
    retry: 3,
  });
};