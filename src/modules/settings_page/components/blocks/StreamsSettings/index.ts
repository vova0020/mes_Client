// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/index.ts
// ================================================

// Главный компонент
export { StreamsSettingsPage } from './StreamsSettingsPage';

// Компоненты потоков
export { StreamsList } from './components/StreamsList';
export { StreamForm } from './components/StreamForm';

// Компоненты этапов
export { 
  StagesManagement,
  StagesLevel1List,
  StagesLevel2List,
  StageLevel1Form,
  StageLevel2Form 
} from './components/stages';

// API
export { streamsApi } from './api/streamsApi';

// Типы
export type {
  // Типы потоков
  ProductionLine,
  ProductionLineDetail,
  CreateStreamData,
  UpdateStreamData,
  GetStreamsParams,
  StreamsResponse,
  LinkStageToLineData,
  LinkMaterialToLineData,
  UnlinkMaterialFromLineData,
  
  // Типы этапов уровня 1
  ProductionStageLevel1,
  ProductionStageLevel1Detail,
  CreateStageLevel1Data,
  UpdateStageLevel1Data,
  
  // Типы этапов уровня 2
  ProductionStageLevel2,
  CreateStageLevel2Data,
  UpdateStageLevel2Data,
  LinkSubstageData,
  GetStagesLevel2Params,
  
  // События WebSocket
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
} from './types/streams.types';

export type {
  // Типы материалов
  Material,
  MaterialGroup,
  GroupMaterial,
  GetMaterialsParams,
  MaterialsResponse,
  MaterialGroupsResponse,
  CreateMaterialData,
  UpdateMaterialData,
  CreateMaterialGroupData,
  UpdateMaterialGroupData,
  LinkMaterialToGroupData,
  UnlinkMaterialFromGroupData,
  
  // События материалов
  MaterialCreatedEvent,
  MaterialUpdatedEvent,
  MaterialDeletedEvent,
  MaterialLinkedToGroupEvent,
  MaterialUnlinkedFromGroupEvent,
  MaterialGroupCreatedEvent,
  MaterialGroupUpdatedEvent,
  MaterialGroupDeletedEvent,
  GroupMaterialsUpdatedEvent,
  
  // Фильтрация и сортировка
  MaterialSortField,
  SortDirection,
  MaterialSortParams,
  MaterialFilterParams,
  GetMaterialsExtendedParams,
  
  // Статистика
  MaterialsStatistics,
  MaterialGroupStatistics
} from './types/materials.types';

// Хуки
export { useStreamsSocket } from './hooks/useStreamsSocket';