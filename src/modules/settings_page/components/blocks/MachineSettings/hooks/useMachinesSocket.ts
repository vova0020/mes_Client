import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../../../../contexts/SocketContext';
import { MACHINES_QUERY_KEYS } from './useMachinesQuery';
import { Machine } from '../MachineSettings';

interface MachineSocketEvents {
  machineCreated: {
    machine: Machine;
    message: string;
  };
  machineUpdated: {
    machine: Machine;
    message: string;
  };
  machineDeleted: {
    machineId: number;
    message: string;
  };
  machineStageAdded: {
    machineId: number;
    stageId: number;
    result: any;
    message: string;
  };
  machineStageRemoved: {
    machineId: number;
    stageId: number;
    message: string;
  };
  machineSubstageAdded: {
    machineId: number;
    substageId: number;
    result: any;
    message: string;
  };
  machineSubstageRemoved: {
    machineId: number;
    substageId: number;
    message: string;
  };
}

export const useMachinesSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('[MachinesSocket] Подключение к комнате станков...');
    
    // Присоединяемся к комнате станков согласно новой документации
    socket.emit('joinRoom', { room: 'settings-machines' });

    // Обработчик создания станка
    const handleMachineCreated = (data: MachineSocketEvents['machineCreated']) => {
      console.log('[MachinesSocket] Станок создан:', data);
      
      // Добавляем новый станок в кэш
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.lists(),
        (oldData: Machine[] | undefined) => {
          if (!oldData) return [data.machine];
          
          // Проверяем, нет ли уже такого станка (предотвращаем дублирование)
          const existingMachine = oldData.find(machine => machine.machineId === data.machine.machineId);
          if (existingMachine) {
            console.log('[MachinesSocket] Станок уже существует, пропускаем добавление');
            return oldData;
          }
          
          // Добавляем новый станок и сортируем по ID
          const updatedData = [...oldData, data.machine];
          return updatedData.sort((a, b) => a.machineId - b.machineId);
        }
      );
      
      // Инвалидируем статистику
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    };

    // Обработчик обновления станка
    const handleMachineUpdated = (data: MachineSocketEvents['machineUpdated']) => {
      console.log('[MachinesSocket] Станок обновлен:', data);
      
      // Обновляем станок в списке
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.lists(),
        (oldData: Machine[] | undefined) => {
          return oldData?.map(machine =>
            machine.machineId === data.machine.machineId ? data.machine : machine
          ) || [];
        }
      );

      // Обновляем детали станка
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.detail(data.machine.machineId),
        data.machine
      );
    };

    // Обработчик удаления станка
    const handleMachineDeleted = (data: MachineSocketEvents['machineDeleted']) => {
      console.log('[MachinesSocket] Станок удален:', data);
      
      // Удаляем станок из списка
      queryClient.setQueryData(
        MACHINES_QUERY_KEYS.lists(),
        (oldData: Machine[] | undefined) => {
          return oldData?.filter(machine => machine.machineId !== data.machineId) || [];
        }
      );

      // Удаляем из кэша детали станка
      queryClient.removeQueries({ queryKey: MACHINES_QUERY_KEYS.detail(data.machineId) });
      queryClient.removeQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(data.machineId) });
      
      // Инвалидируем статистику
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    };

    // Обработчик добавления этапа к станку
    const handleMachineStageAdded = (data: MachineSocketEvents['machineStageAdded']) => {
      console.log('[MachinesSocket] Этап добавлен к станку:', data);
      
      // Инвалидируем данные станка
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    };

    // Обработчик удаления этапа от станка
    const handleMachineStageRemoved = (data: MachineSocketEvents['machineStageRemoved']) => {
      console.log('[MachinesSocket] Этап удален от станка:', data);
      
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    };

    // Обработчик добавления подэтапа к станку
    const handleMachineSubstageAdded = (data: MachineSocketEvents['machineSubstageAdded']) => {
      console.log('[MachinesSocket] Подэтап добавлен к станку:', data);
      
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    };

    // Обработчик удаления подэтапа от станка
    const handleMachineSubstageRemoved = (data: MachineSocketEvents['machineSubstageRemoved']) => {
      console.log('[MachinesSocket] Подэтап удален от станка:', data);
      
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.detail(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.machineStages(data.machineId) });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEYS.statistics() });
    };

    // Регистрируем обработчики событий
    socket.on('machineCreated', handleMachineCreated);
    socket.on('machineUpdated', handleMachineUpdated);
    socket.on('machineDeleted', handleMachineDeleted);
    socket.on('machineStageAdded', handleMachineStageAdded);
    socket.on('machineStageRemoved', handleMachineStageRemoved);
    socket.on('machineSubstageAdded', handleMachineSubstageAdded);
    socket.on('machineSubstageRemoved', handleMachineSubstageRemoved);

    // Очистка при размонтировании компонента
    return () => {
      console.log('[MachinesSocket] Отключение от событий станков...');
      
      socket.off('machineCreated', handleMachineCreated);
      socket.off('machineUpdated', handleMachineUpdated);
      socket.off('machineDeleted', handleMachineDeleted);
      socket.off('machineStageAdded', handleMachineStageAdded);
      socket.off('machineStageRemoved', handleMachineStageRemoved);
      socket.off('machineSubstageAdded', handleMachineSubstageAdded);
      socket.off('machineSubstageRemoved', handleMachineSubstageRemoved);
    };
  }, [socket, isConnected, queryClient]);

  return {
    isConnected,
  };
};