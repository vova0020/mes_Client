import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../../../../contexts/SocketContext';
import { QUERY_KEYS } from '../api';
import { Material, MaterialGroup } from '../types';

interface MaterialSocketEvent {
  material: Material;
  timestamp: string;
}

interface MaterialDeletedEvent {
  materialId: number;
  materialName: string;
  timestamp: string;
}

interface MaterialGroupLinkEvent {
  groupId: number;
  materialId: number;
  groupName: string;
  materialName: string;
  timestamp: string;
}

interface MaterialGroupSocketEvent {
  group: MaterialGroup;
  timestamp: string;
}

interface MaterialGroupDeletedEvent {
  groupId: number;
  groupName: string;
  timestamp: string;
}

export const useMaterialsSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔔 Настройка Socket.IO обработчиков для материалов');

    // =============== МАТЕРИАЛЫ ===============

    // Создание материала
    const handleMaterialCreated = (data: MaterialSocketEvent) => {
      console.log('📦 Socket: Создан новый материал:', data);
      
      // Обновляем все запросы материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      
      // Также обновляем группы, так как счетчики могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });

      // Показываем уведомление (опционально)
      // toast.success(`Создан новый материал: ${data.material.materialName}`);
    };

    // Обновление материала
    const handleMaterialUpdated = (data: MaterialSocketEvent) => {
      console.log('📝 Socket: Материал обновлен:', data);
      
      // Обновляем конкретный материал в кэше
      queryClient.setQueryData(
        QUERY_KEYS.material(data.material.materialId), 
        data.material
      );
      
      // Обновляем все списки материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      
      // Также обновляем группы, так как связи могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });

      // toast.info(`Материал обновлен: ${data.material.materialName}`);
    };

    // Удаление материала
    const handleMaterialDeleted = (data: MaterialDeletedEvent) => {
      console.log('🗑️ Socket: Материал удален:', data);
      
      // Удаляем материал из кэша
      queryClient.removeQueries({ queryKey: QUERY_KEYS.material(data.materialId) });
      
      // Обновляем все списки материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      
      // Также обновляем группы, так как счетчики могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });

      // toast.warning(`Материал удален: ${data.materialName}`);
    };

    // Привязка материала к группе
    const handleMaterialLinkedToGroup = (data: MaterialGroupLinkEvent) => {
      console.log('🔗 Socket: Материал привязан к группе:', data);
      
      // Обновляем данные материала
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.material(data.materialId) });
      
      // Обновляем списки материалов для конкретной группы
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialsByGroup(data.groupId) });
      
      // Обновляем общий список материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      
      // Обновляем группы (счетчики)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });

      // toast.success(`${data.materialName} привязан к группе ${data.groupName}`);
    };

    // Отвязка материала от группы
    const handleMaterialUnlinkedFromGroup = (data: MaterialGroupLinkEvent) => {
      console.log('🔓 Socket: Материал отвязан от группы:', data);
      
      // Аналогично привязке
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.material(data.materialId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialsByGroup(data.groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });

      // toast.info(`${data.materialName} отвязан от группы ${data.groupName}`);
    };

    // =============== ГРУППЫ МАТЕРИАЛОВ ===============

    // Создание группы
    const handleMaterialGroupCreated = (data: MaterialGroupSocketEvent) => {
      console.log('📁 Socket: Создана новая группа материалов:', data);
      
      // Обновляем список групп
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });

      // toast.success(`Создана новая группа: ${data.group.groupName}`);
    };

    // Обновление группы
    const handleMaterialGroupUpdated = (data: MaterialGroupSocketEvent) => {
      console.log('📝 Socket: Группа материалов обновлена:', data);
      
      // Обновляем список групп
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });

      // toast.info(`Группа обновлена: ${data.group.groupName}`);
    };

    // Удаление группы
    const handleMaterialGroupDeleted = (data: MaterialGroupDeletedEvent) => {
      console.log('🗑️ Socket: Группа материалов удалена:', data);
      
      // Обновляем список групп
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
      
      // Также обновляем материалы, так как связи могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });

      // toast.warning(`Группа удалена: ${data.groupName}`);
    };

    // Регистрируем обработчики событий
    socket.on('materialCreated', handleMaterialCreated);
    socket.on('materialUpdated', handleMaterialUpdated);
    socket.on('materialDeleted', handleMaterialDeleted);
    socket.on('materialLinkedToGroup', handleMaterialLinkedToGroup);
    socket.on('materialUnlinkedFromGroup', handleMaterialUnlinkedFromGroup);
    
    socket.on('materialGroupCreated', handleMaterialGroupCreated);
    socket.on('materialGroupUpdated', handleMaterialGroupUpdated);
    socket.on('materialGroupDeleted', handleMaterialGroupDeleted);

    // Очистка обработчиков при размонтировании
    return () => {
      console.log('🧹 Очистка Socket.IO обработчиков материалов');
      
      socket.off('materialCreated', handleMaterialCreated);
      socket.off('materialUpdated', handleMaterialUpdated);
      socket.off('materialDeleted', handleMaterialDeleted);
      socket.off('materialLinkedToGroup', handleMaterialLinkedToGroup);
      socket.off('materialUnlinkedFromGroup', handleMaterialUnlinkedFromGroup);
      
      socket.off('materialGroupCreated', handleMaterialGroupCreated);
      socket.off('materialGroupUpdated', handleMaterialGroupUpdated);
      socket.off('materialGroupDeleted', handleMaterialGroupDeleted);
    };
  }, [socket, isConnected, queryClient]);

  return {
    isConnected,
    socket,
  };
};