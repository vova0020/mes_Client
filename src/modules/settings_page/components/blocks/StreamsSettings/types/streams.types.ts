// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/types/streams.types.ts
// ================================================

import { Material } from './materials.types';

// ============================================
// ТИПЫ ДЛЯ ПРОИЗВОДСТВЕННЫХ ПОТОКОВ
// ============================================

// Основной тип производственной линии
export interface ProductionLine {
  lineId: number;
  lineName: string;
  lineType: string;
  stagesCount?: number;
  materialsCount?: number;
  
  // Связанные данные (при детальном получении)
  materials?: Material[];
  stages?: {
    lineStageId: number;
    lineId: number;
    stageId: number;
    stageName: string;
  }[];
  linesStages?: LineStage[]; // Для обратной совместимости
}

// Детальная информация о потоке
export interface ProductionLineDetail extends ProductionLine {
  materials: Material[];
  stages: {
    lineStageId: number;
    lineId: number;
    stageId: number;
    stageName: string;
  }[];
}

// Этапы линии
export interface LineStage {
  lineStageId: number;
  lineId: number;
  stageId: number;
  
  // Связанные данные
  line?: ProductionLine;
  stage?: ProductionStageLevel1;
}

// Данные для создания потока
export interface CreateStreamData {
  lineName: string;
  lineType: string;
  materialIds?: number[];
  stageIds?: number[];
}

// Данные для обновления потока
export interface UpdateStreamData {
  lineName?: string;
  lineType?: string;
  materialIds?: number[];
  stageIds?: number[];
}

// Связь линии с материалом
export interface LineMaterial {
  lineMaterialId: number;
  lineId: number;
  materialId: number;
  
  // Связанные данные
  line?: ProductionLine;
  material?: Material;
}

// Ответ API при получении потоков
export interface StreamsResponse {
  streams: ProductionLine[];
  total: number;
}

// Параметры запроса для получения пото��ов
export interface GetStreamsParams {
  page?: number;
  limit?: number;
  search?: string;
  lineType?: string;
}

// ============================================
// ТИПЫ ДЛЯ ТЕХНОЛОГИЧЕСКИХ ЭТАПОВ
// ============================================

// Этапы производства первого уровня
export interface ProductionStageLevel1 {
  stageId: number;
  stageName: string;
  description?: string;
  finalStage: boolean;
  createdAt: string;
  updatedAt: string;
  substagesCount?: number;
  
  // Связанные данные (при детальном получении)
  substages?: ProductionStageLevel2[];
}

// Детальная информация об этапе 1 уровня
export interface ProductionStageLevel1Detail extends ProductionStageLevel1 {
  substages: ProductionStageLevel2[];
}

// Этапы производства второго уровня
export interface ProductionStageLevel2 {
  substageId: number;
  stageId: number;
  stageName?: string; // Название родительского этапа
  substageName: string;
  description?: string;
  allowance: number;
}

// Данные для создания этапа 1 уровня
export interface CreateStageLevel1Data {
  stageName: string;
  description?: string;
  finalStage?: boolean;
}

// Данные для обновления этапа 1 уровня
export interface UpdateStageLevel1Data {
  stageName?: string;
  description?: string;
  finalStage?: boolean;
}

// Данные для создания этапа 2 уровня
export interface CreateStageLevel2Data {
  stageId: number;
  substageName: string;
  description?: string;
  allowance: number;
}

// Данные для обновления этапа 2 уровня
export interface UpdateStageLevel2Data {
  substageName?: string;
  description?: string;
  allowance?: number;
}

// Данные для перепривязки подэтапа к другому этапу 1 уровня
export interface RebindStageLevel2Data {
  newStageId: number;
}

// Данные для привязки подэтапа к этапу
export interface LinkSubstageData {
  stageId: number;
  substageName: string;
  description?: string;
  allowance: number;
}

// Данные для привязки этапа к потоку
export interface LinkStageToLineData {
  lineId: number;
  stageId: number;
}

// Данные для привязки материала к потоку
export interface LinkMaterialToLineData {
  lineId: number;
  materialId: number;
}

// Данные для отвязки материала от потока
export interface UnlinkMaterialFromLineData {
  lineId: number;
  materialId: number;
}

// Параметры для получения этапов 2 уровня
export interface GetStagesLevel2Params {
  stageId?: number;
}

// ============================================
// ТИПЫ ДЛЯ WEBSOCKET СОБЫТИЙ
// ============================================

// События потоков
export interface LineCreatedEvent {
  line: ProductionLine;
  timestamp: string;
}

export interface LineUpdatedEvent {
  line: ProductionLine;
  timestamp: string;
}

export interface LineDeletedEvent {
  lineId: number;
  lineName: string;
  timestamp: string;
}

export interface StageLinkedToLineEvent {
  lineId: number;
  stageId: number;
  stageName: string;
  timestamp: string;
}

export interface StageUnlinkedFromLineEvent {
  lineStageId: number;
  lineId: number;
  stageId: number;
  timestamp: string;
}

export interface MaterialLinkedToLineEvent {
  lineId: number;
  materialId: number;
  materialName: string;
  timestamp: string;
}

export interface MaterialUnlinkedFromLineEvent {
  lineId: number;
  materialId: number;
  materialName: string;
  timestamp: string;
}

export interface LineMaterialsUpdatedEvent {
  lineId: number;
  materialIds: number[];
  timestamp: string;
}

export interface LineStagesUpdatedEvent {
  lineId: number;
  stageIds: number[];
  timestamp: string;
}

// События технологических этапов
export interface StageLevel1CreatedEvent {
  stage: ProductionStageLevel1;
  timestamp: string;
}

export interface StageLevel1UpdatedEvent {
  stage: ProductionStageLevel1;
  timestamp: string;
}

export interface StageLevel1DeletedEvent {
  stageId: number;
  stageName: string;
  timestamp: string;
}

export interface StageLevel2CreatedEvent {
  substage: ProductionStageLevel2;
  timestamp: string;
}

export interface StageLevel2UpdatedEvent {
  substage: ProductionStageLevel2;
  timestamp: string;
}

export interface StageLevel2DeletedEvent {
  substageId: number;
  substageName: string;
  timestamp: string;
}

export interface StageLevel2ReboundEvent {
  substage: ProductionStageLevel2;
  oldStageId: number;
  oldStageName?: string;
  newStageId: number;
  newStageName?: string;
  timestamp: string;
}

export interface SubstageLinkedToStageEvent {
  stageId: number;
  substageId: number;
  substageName: string;
  timestamp: string;
}