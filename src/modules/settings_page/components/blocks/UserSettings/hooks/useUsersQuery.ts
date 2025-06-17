import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ContextPicker
} from '../services/usersApi';

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
};

// Хуки для CRUD операций с пользователями

// Получить всех пользователей
export const useUsers = () => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.lists(),
    queryFn: UsersApiService.getAllUsers,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

// Получить пользователя по ID
export const useUser = (id: number | undefined) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.detail(id!),
    queryFn: () => UsersApiService.getUserById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// Создать пользователя
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => UsersApiService.createUser(userData),
    onSuccess: (newUser) => {
      // Обновляем кэш со списком пользователей
      queryClient.setQueryData(
        USERS_QUERY_KEYS.lists(),
        (oldData: User[] | undefined) => {
          return oldData ? [...oldData, newUser] : [newUser];
        }
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
    },
  });
};

// Хуки для управления ролями

// Получить роли пользователя
export const useUserRoles = (userId: number | undefined) => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.userRoles(userId!),
    queryFn: () => UsersApiService.getUserRoles(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

// Получить доступные роли
export const useAvailableRoles = () => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.availableRoles(),
    queryFn: UsersApiService.getAvailableRoles,
    staleTime: 1000 * 60 * 10, // 10 минут (данные изменяются редко)
  });
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
  return useQuery({
    queryKey: USERS_QUERY_KEYS.contextMachines(),
    queryFn: UsersApiService.getContextMachines,
    staleTime: 1000 * 60 * 10, // 10 минут
  });
};

// Получить этапы для привязки
export const useContextStages = () => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.contextStages(),
    queryFn: UsersApiService.getContextStages,
    staleTime: 1000 * 60 * 10, // 10 минут
  });
};

// Получить комплектовщиков для привязки
export const useContextPickers = () => {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.contextPickers(),
    queryFn: UsersApiService.getContextPickers,
    staleTime: 1000 * 60 * 10, // 10 минут
  });
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