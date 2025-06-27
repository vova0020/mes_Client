
// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/hooks/useStreamsSocket.ts
// ================================================

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../../../../../contexts/SocketContext';
import {
  LineCreatedEvent,
  LineUpdatedEvent,
  LineDeletedEvent,
  StageLinkedToLineEvent,
  StageUnlinkedFromLineEvent,
  MaterialLinkedToLineEvent,
  MaterialUnlinkedFromLineEvent,
  LineMaterialsUpdatedEvent,
  LineStagesUpdatedEvent,
  StageLevel1CreatedEvent,
  StageLevel1UpdatedEvent,
  StageLevel1DeletedEvent,
  StageLevel2CreatedEvent,
  StageLevel2UpdatedEvent,
  StageLevel2DeletedEvent,
  SubstageLinkedToStageEvent
} from '../types/streams.types';

export const useStreamsSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // ====================================
    // ОБРАБОТЧИКИ СОБЫТИЙ ПОТОКОВ
    // ====================================

    // Создание потока
    const handleLineCreated = (data: LineCreatedEvent) => {
      console.log('🏭 Поток создан:', data);
      
      // Инвалидируем кеш списка потоков
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеш материалов и этапов нового потока
      queryClient.invalidateQueries({ queryKey: ['stream-materials', data.line.lineId] });
      queryClient.invalidateQueries({ queryKey: ['stream-stages', data.line.lineId] });
      
      console.log(`✅ Создан новый поток: ${data.line.lineName}`);
    };

    // Обновление потока
    const handleLineUpdated = (data: LineUpdatedEvent) => {
      console.log('📝 Поток обновлен:', data);
      
      // Инвалидируем кеш списка потоков и конкретного потока
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['stream', data.line.lineId] });
      
      // Инвалидируем кеш материалов и этапов потока
      queryClient.invalidateQueries({ queryKey: ['stream-materials', data.line.lineId] });
      queryClient.invalidateQueries({ queryKey: ['stream-stages', data.line.lineId] });
      
      console.log(`✅ Поток обновлен: ${data.line.lineName}`);
    };

    // Удаление потока
    const handleLineDeleted = (data: LineDeletedEvent) => {
      console.log('🗑️ Поток удален:', data);
      
      // Инвалидируем кеш списка потоков
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Удаляем кеш конкретного потока и связанных данных
      queryClient.removeQueries({ queryKey: ['stream', data.lineId] });
      queryClient.removeQueries({ queryKey: ['stream-materials', data.lineId] });
      queryClient.removeQueries({ queryKey: ['stream-stages', data.lineId] });
      
      console.log(`✅ Поток удален: ${data.lineName}`);
    };

    // Привязка этапа к потоку
    const handleStageLinkedToLine = (data: StageLinkedToLineEvent) => {
      console.log('🔗 Этап привязан к потоку:', data);
      
      // Инвалидируем кеш потока и списка потоков
      queryClient.invalidateQueries({ queryKey: ['stream', data.lineId] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеш этапов потока
      queryClient.invalidateQueries({ queryKey: ['stream-stages', data.lineId] });
      
      console.log(`✅ Этап "${data.stageName}" привязан к потоку`);
    };

    // Отвязка этапа от потока
    const handleStageUnlinkedFromLine = (data: StageUnlinkedFromLineEvent) => {
      console.log('🔓 Этап отвязан от потока:', data);
      
      // Инвалидируем кеш потока и списка потоков
      queryClient.invalidateQueries({ queryKey: ['stream', data.lineId] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеш этапов потока
      queryClient.invalidateQueries({ queryKey: ['stream-stages', data.lineId] });
      
      console.log(`✅ Этап отвязан от потока`);
    };

    // Привязка материала к потоку
    const handleMaterialLinkedToLine = (data: MaterialLinkedToLineEvent) => {
      console.log('🔗 Материал привязан к потоку:', data);
      
      // Инвалидируем кеш потока и списка потоков
      queryClient.invalidateQueries({ queryKey: ['stream', data.lineId] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеш материалов потока
      queryClient.invalidateQueries({ queryKey: ['stream-materials', data.lineId] });
      
      console.log(`✅ Материал "${data.materialName}" привязан к потоку`);
    };

    // Отвязка материала от потока
    const handleMaterialUnlinkedFromLine = (data: MaterialUnlinkedFromLineEvent) => {
      console.log('🔓 Материал отвязан от потока:', data);
      
      // Инвалидируем кеш потока и списка потоков
      queryClient.invalidateQueries({ queryKey: ['stream', data.lineId] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеш материалов потока
      queryClient.invalidateQueries({ queryKey: ['stream-materials', data.lineId] });
      
      console.log(`✅ Материал "${data.materialName}" отвязан от потока`);
    };

    // Обновление материалов потока
    const handleLineMaterialsUpdated = (data: LineMaterialsUpdatedEvent) => {
      console.log('📝 Материалы потока обновлены:', data);
      
      // Инвалидируем кеш потока и списка потоков
      queryClient.invalidateQueries({ queryKey: ['stream', data.lineId] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеш материалов потока
      queryClient.invalidateQueries({ queryKey: ['stream-materials', data.lineId] });
      
      console.log(`✅ Материалы потока обновлены (${data.materialIds.length} материалов)`);
    };

    // Обновление этапов потока
    const handleLineStagesUpdated = (data: LineStagesUpdatedEvent) => {
      console.log('📝 Этапы потока обновлены:', data);
      
      // Инвалидируем кеш потока и списка потоков
      queryClient.invalidateQueries({ queryKey: ['stream', data.lineId] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеш этапов потока
      queryClient.invalidateQueries({ queryKey: ['stream-stages', data.lineId] });
      
      console.log(`✅ Этапы потока обновлены (${data.stageIds.length} этапов)`);
    };

    // ====================================
    // ОБРАБОТЧИКИ СОБЫТИЙ ТЕХНОЛОГИЧЕСКИХ ЭТАПОВ 1 УРОВНЯ
    // ====================================

    // Создание этапа 1 уровня
    const handleStageLevel1Created = (data: StageLevel1CreatedEvent) => {
      console.log('⚙️ Этап 1 уровня создан:', data);
      
      // Инвалидируем кеш этапов (для формы)
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      
      // Инвалидируем кеш этапов для всех потоков
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'stream-stages' 
      });
      
      console.log(`✅ Создан этап: ${data.stage.stageName}`);
    };

    // Обновление этапа 1 уровня
    const handleStageLevel1Updated = (data: StageLevel1UpdatedEvent) => {
      console.log('📝 Этап 1 уровня обновлен:', data);
      
      // Инвалидируем кеш этапов и конкретного этапа
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      queryClient.invalidateQueries({ queryKey: ['production-stage-level1', data.stage.stageId] });
      
      // Инвалидируем кеш этапов для всех потоков
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'stream-stages' 
      });
      
      console.log(`✅ Этап обновлен: ${data.stage.stageName}`);
    };

    // Удаление этапа 1 уровня
    const handleStageLevel1Deleted = (data: StageLevel1DeletedEvent) => {
      console.log('🗑️ Этап 1 уровня удален:', data);
      
      // Инвалидируем кеш этапов
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      
      // Удаляем кеш конкретного этапа
      queryClient.removeQueries({ queryKey: ['production-stage-level1', data.stageId] });
      
      // Инвалидируем кеш этапов для всех потоков
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'stream-stages' 
      });
      
      console.log(`✅ Этап удален: ${data.stageName}`);
    };

    // ====================================
    // ОБРАБОТЧИКИ СОБЫТИЙ ТЕХНОЛОГИЧЕСКИХ ЭТАПОВ 2 УРОВНЯ
    // ====================================

    // Создание этапа 2 уровня
    const handleStageLevel2Created = (data: StageLevel2CreatedEvent) => {
      console.log('⚙️ Подэтап создан:', data);
      
      // Инвалидируем кеш подэтапов и родительского этапа
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      queryClient.invalidateQueries({ queryKey: ['production-stage-level1', data.substage.stageId] });
      
      // Обновляем кеш этапов 1 уровня (для обновления количества подэтапов)
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      
      console.log(`✅ Создан подэтап: ${data.substage.substageName}`);
    };

    // Обновление этапа 2 уровня
    const handleStageLevel2Updated = (data: StageLevel2UpdatedEvent) => {
      console.log('📝 Подэтап обновлен:', data);
      
      // Инвалидируем кеш подэтапов и конкретного подэтапа
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      queryClient.invalidateQueries({ queryKey: ['production-stage-level2', data.substage.substageId] });
      queryClient.invalidateQueries({ queryKey: ['production-stage-level1', data.substage.stageId] });
      
      // Обновляем кеш этапов 1 уровня
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      
      console.log(`✅ Подэтап обновлен: ${data.substage.substageName}`);
    };

    // Удаление этапа 2 уровня
    const handleStageLevel2Deleted = (data: StageLevel2DeletedEvent) => {
      console.log('🗑️ Подэтап удален:', data);
      
      // Инвалидируем кеш подэтапов
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      
      // Удаляем кеш конкретного подэтапа
      queryClient.removeQueries({ queryKey: ['production-stage-level2', data.substageId] });
      
      // Обновляем кеш этапов 1 уровня (для обновления количества подэтапов)
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      
      console.log(`✅ Подэтап удален: ${data.substageName}`);
    };

    // Привязка подэтапа к этапу
    const handleSubstageLinkedToStage = (data: SubstageLinkedToStageEvent) => {
      console.log('🔗 Подэтап привязан к этапу:', data);
      
      // Инвалидируем кеш этапа и подэтапов
      queryClient.invalidateQueries({ queryKey: ['production-stage-level1', data.stageId] });
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      
      // Обновляем кеш этапов 1 уровня
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      
      console.log(`✅ Подэтап "${data.substageName}" привязан к этапу`);
    };

    // ====================================
    // ОБРАБОТЧИКИ СОБЫТИЙ МАТЕРИАЛОВ (для формы)
    // ====================================
    
    // Обработчик создания материала
    const handleMaterialCreated = (data: any) => {
      console.log('📦 Материал создан:', data);
      
      // Инвалидируем кеш материалов для формы
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      
      console.log(`✅ Создан новый материал: ${data.material?.materialName || 'неизвестный'}`);
    };

    // Обработчик обновления материала
    const handleMaterialUpdated = (data: any) => {
      console.log('📝 Материал обновлен:', data);
      
      // Инвалидируем кеш материалов для формы
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material', data.material?.materialId] });
      
      console.log(`✅ Материал обновлен: ${data.material?.materialName || 'неизвестный'}`);
    };

    // Обработчик удаления материала
    const handleMaterialDeleted = (data: any) => {
      console.log('🗑️ Материал удален:', data);
      
      // Инвалидируем кеш материалов для формы
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      
      // Удаляем кеш конкретного материала
      queryClient.removeQueries({ queryKey: ['material', data.materialId] });
      
      // Инвалидируем кеш материалов для всех потоков
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'stream-materials' 
      });
      
      console.log(`✅ Материал удален: ${data.materialName || 'неизвестный'}`);
    };

    // Обработчик создания группы материалов
    const handleMaterialGroupCreated = (data: any) => {
      console.log('📁 Группа материалов создана:', data);
      
      // Инвалидируем кеш групп материалов
      queryClient.invalidateQueries({ queryKey: ['material-groups'] });
      
      console.log(`✅ Создана группа материалов: ${data.group?.groupName || 'неизвестная'}`);
    };

    // Обработчик обновления группы материалов
    const handleMaterialGroupUpdated = (data: any) => {
      console.log('📝 Группа материалов обновлена:', data);
      
      // Инвалидируем кеш групп материалов
      queryClient.invalidateQueries({ queryKey: ['material-groups'] });
      queryClient.invalidateQueries({ queryKey: ['material-group', data.group?.groupId] });
      
      console.log(`✅ Группа материалов обновлена: ${data.group?.groupName || 'неизвестная'}`);
    };

    // Обработчик удаления группы материалов
    const handleMaterialGroupDeleted = (data: any) => {
      console.log('🗑️ Группа материалов удалена:', data);
      
      // Инвалидируем кеш групп материалов
      queryClient.invalidateQueries({ queryKey: ['material-groups'] });
      
      // Удаляем кеш конкретной группы
      queryClient.removeQueries({ queryKey: ['material-group', data.groupId] });
      
      console.log(`✅ Группа материалов удалена: ${data.groupName || 'неизвестная'}`);
    };

    // ====================================
    // ПОДПИСКА НА СОБЫТИЯ
    // ====================================

    // События потоков
    socket.on('lineCreated', handleLineCreated);
    socket.on('lineUpdated', handleLineUpdated);
    socket.on('lineDeleted', handleLineDeleted);
    socket.on('stageLinkedToLine', handleStageLinkedToLine);
    socket.on('stageUnlinkedFromLine', handleStageUnlinkedFromLine);
    socket.on('materialLinkedToLine', handleMaterialLinkedToLine);
    socket.on('materialUnlinkedFromLine', handleMaterialUnlinkedFromLine);
    socket.on('lineMaterialsUpdated', handleLineMaterialsUpdated);
    socket.on('lineStagesUpdated', handleLineStagesUpdated);

    // События технологических этапов
    socket.on('stageLevel1Created', handleStageLevel1Created);
    socket.on('stageLevel1Updated', handleStageLevel1Updated);
    socket.on('stageLevel1Deleted', handleStageLevel1Deleted);
    socket.on('stageLevel2Created', handleStageLevel2Created);
    socket.on('stageLevel2Updated', handleStageLevel2Updated);
    socket.on('stageLevel2Deleted', handleStageLevel2Deleted);
    socket.on('substageLinkedToStage', handleSubstageLinkedToStage);

    // События материалов (для автообновления формы)
    socket.on('materialCreated', handleMaterialCreated);
    socket.on('materialUpdated', handleMaterialUpdated);
    socket.on('materialDeleted', handleMaterialDeleted);
    socket.on('materialGroupCreated', handleMaterialGroupCreated);
    socket.on('materialGroupUpdated', handleMaterialGroupUpdated);
    socket.on('materialGroupDeleted', handleMaterialGroupDeleted);

    // Подключение к комнатам согласно новой документации
    socket.emit('joinRoom', { room: 'settings-production-lines' });
    socket.emit('joinRoom', { room: 'settings-production-stages' });
    socket.emit('joinRoom', { room: 'settings-materials' });
    socket.emit('joinRoom', { room: 'settings-materialGroups' });

    console.log('🔌 Подключились к комнатам: settings-production-lines, settings-production-stages, settings-materials, settings-materialGroups');

    // Очистка при размонтировании
    return () => {
      // Отписываемся от событий потоков
      socket.off('lineCreated', handleLineCreated);
      socket.off('lineUpdated', handleLineUpdated);
      socket.off('lineDeleted', handleLineDeleted);
      socket.off('stageLinkedToLine', handleStageLinkedToLine);
      socket.off('stageUnlinkedFromLine', handleStageUnlinkedFromLine);
      socket.off('materialLinkedToLine', handleMaterialLinkedToLine);
      socket.off('materialUnlinkedFromLine', handleMaterialUnlinkedFromLine);
      socket.off('lineMaterialsUpdated', handleLineMaterialsUpdated);
      socket.off('lineStagesUpdated', handleLineStagesUpdated);

      // Отписываемся от событий технологических этапов
      socket.off('stageLevel1Created', handleStageLevel1Created);
      socket.off('stageLevel1Updated', handleStageLevel1Updated);
      socket.off('stageLevel1Deleted', handleStageLevel1Deleted);
      socket.off('stageLevel2Created', handleStageLevel2Created);
      socket.off('stageLevel2Updated', handleStageLevel2Updated);
      socket.off('stageLevel2Deleted', handleStageLevel2Deleted);
      socket.off('substageLinkedToStage', handleSubstageLinkedToStage);

      // Отписываемся от событий материалов
      socket.off('materialCreated', handleMaterialCreated);
      socket.off('materialUpdated', handleMaterialUpdated);
      socket.off('materialDeleted', handleMaterialDeleted);
      socket.off('materialGroupCreated', handleMaterialGroupCreated);
      socket.off('materialGroupUpdated', handleMaterialGroupUpdated);
      socket.off('materialGroupDeleted', handleMaterialGroupDeleted);

      console.log('🔌 Отключились от Socket.IO событий');
    };
  }, [socket, isConnected, queryClient]);

  return {
    isConnected,
  };
};
