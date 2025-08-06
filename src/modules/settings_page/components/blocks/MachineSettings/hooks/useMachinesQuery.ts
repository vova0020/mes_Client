import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MachinesApiService } from '../services/machinesApi';
import { Machine, CreateMachineDto, UpdateMachineDto } from '../MachineSettings';

// Ключи для кэширования запросов
export const MACHINES_QUERY_KEYS = {
  all: ['machines'] as const,
  lists: () => [...MACHINES_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...MACHINES_QUERY_KEYS.lists(), filters] as const,
  details: () => [...MACHINES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...MACHINES_QUERY_KEYS.details(), id] as const,
  stages: () => [...MACHINES_QUERY_KEYS.all, 'stages'] as const,
  stagesWithSubstages: () => [...MACHINES_QUERY_KEYS.stages(), 'with-substages'] as const,
  substagesGrouped: () => [...MACHINES_QUERY_KEYS.stages(), 'substages-grouped'] as const,
  statistics: () => [...MACHINES_QUERY_KEYS.all, 'statistics'] as const,
  machineStages: (machineId: number) => [...MACHINES_QUERY_KEYS.all, 'machine-stages', machineId] as const,
};

// Хук для получения всех станков
export const useMachines = () => {
  return useQuery({
    queryKey: MACHINES_QUERY_KEYS.lists(),
    queryFn: async () => {
      const machines = await MachinesApiService.getAllMachines();
      // Сортируем станки по ID по возрастанию
      return machines.sort((a, b) => a.machineId - b.machineId);
    },
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

// Хук для получения станка по ID
export const useMachine = (id: number | undefined) => {
  return useQuery({
    queryKey: MACHINES_QUERY_KEYS.detail(id!),
    queryFn: () => MachinesApiService.getMachineById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

// Хук для получения этапов с подэтапами
export const useStagesWithSubstages = () => {
  return useQuery({
    queryKey: MACHINES_QUERY_KEYS.stagesWithSubstages(),
    queryFn: MachinesApiService.getAvailableStagesWithSubstages,
    staleTime: 1000 * 60 * 10, // 10 минут (данные изменяются редко)
  });
};

// Хук для получения подэтапов сгруппированных по этапам
export const useSubstagesGrouped = () => {
  return useQuery({
    queryKey: MACHINES_QUERY_KEYS.substagesGrouped(),
    queryFn: MachinesApiService.getSubstagesGrouped,
    staleTime: 1000 * 60 * 10,
  });
};

// Хук для получения статистики
export const useStagesStatistics = () => {
  return useQuery({
    queryKey: MACHINES_QUERY_KEYS.statistics(),
    queryFn: MachinesApiService.getStagesStatistics,
    staleTime: 1000 * 60 * 2, // 2 минуты
  });
};

// Хук для получения этапов станка
export const useMachineStages = (machineId: number | undefined) => {
  return useQuery({
    queryKey: MACHINES_QUERY_KEYS.machineStages(machineId!),
    queryFn: () => MachinesApiService.getMachineStages(machineId!),
    enabled: !!machineId,
    staleTime: 1000 * 60 * 5,
  });
};

// Хук для создания станка
export const useCreateMachine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (machineData: CreateMachineDto) => 
      MachinesApiService.createMachine(machineData),
    onSuccess: (newMachine) => {
      // Обновляем кэш со списком станков
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.lists(),
        (oldData: Machine[] | undefined) => {
          if (!oldData) return [newMachine];
          
          // Проверяем, нет ли уже такого станка (предотвращаем дублирование)
          const existingMachine = oldData.find(machine => machine.machineId === newMachine.machineId);
          if (existingMachine) {
            console.log('[useCreateMachine] Станок уже существует, пропускаем добавление');
            return oldData;
          }
          
          // Добавляем новый станок и сортируем по ID
          const updatedData = [...oldData, newMachine];
          return updatedData.sort((a, b) => a.machineId - b.machineId);
        }
      );
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для обновления станка
export const useUpdateMachine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMachineDto }) =>
      MachinesApiService.updateMachine(id, data),
    onSuccess: (updatedMachine) => {
      // Обновляем кэш со списком станков
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.lists(),
        (oldData: Machine[] | undefined) => {
          return oldData?.map(machine =>
            machine.machineId === updatedMachine.machineId ? updatedMachine : machine
          ) || [];
        }
      );

      // Обновляем кэш с деталями станка
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.detail(updatedMachine.machineId),
        updatedMachine
      );
    },
  });
};

// Хук для удаления станка
export const useDeleteMachine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => MachinesApiService.deleteMachine(id),
    onSuccess: (_, deletedId) => {
      // Удаляем из кэша списка станков
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.lists(),
        (oldData: Machine[] | undefined) => {
          return oldData?.filter(machine => machine.machineId !== deletedId) || [];
        }
      );

      // Удаляем из кэша детали станка
      queryClient.removeQueries({ queryKey: MACHINES_QUERY_KEYS.detail(deletedId) });
      queryClient.removeQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(deletedId) });
      
      // Инвалидируем связанные запросы
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для добавления этапа к станку
export const useAddMachineStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ machineId, stageId }: { machineId: number; stageId: number }) =>
      MachinesApiService.addMachineStage(machineId, stageId),
    onSuccess: (_, { machineId }) => {
      // Инвалидируем данные станка для обновления
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для удаления этапа от станка
export const useRemoveMachineStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ machineId, stageId }: { machineId: number; stageId: number }) =>
      MachinesApiService.removeMachineStage(machineId, stageId),
    onSuccess: (_, { machineId }) => {
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для добавления подэтапа к станку
export const useAddMachineSubstage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ machineId, substageId }: { machineId: number; substageId: number }) =>
      MachinesApiService.addMachineSubstage(machineId, substageId),
    onSuccess: (_, { machineId }) => {
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    },
  });
};

// Хук для удаления подэтапа от станка
export const useRemoveMachineSubstage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ machineId, substageId }: { machineId: number; substageId: number }) =>
      MachinesApiService.removeMachineSubstage(machineId, substageId),
    onSuccess: (_, { machineId }) => {
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    },
  });
};