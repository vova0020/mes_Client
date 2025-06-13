// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/types/materials.types.ts
// ================================================

// ============================================
// ТИПЫ ДЛЯ МАТЕРИАЛОВ
// ============================================

// Основной тип материала
export interface Material {
  materialId: number;
  materialName: string;
  article: string;
  unit: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // Связанные данные (при детальном получении)
  groups?: MaterialGroup[];
  groupsMaterials?: GroupMaterial[];
}

// Группа материалов
export interface MaterialGroup {
  groupId: number;
  groupName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  materialsCount?: number;
  
  // Связанные данные (при детальном получении)
  materials?: Material[];
  groupsMaterials?: GroupMaterial[];
}

// Связь между группой и материалом
export interface GroupMaterial {
  groupMaterialId: number;
  groupId: number;
  materialId: number;
  
  // Связанные данные
  group?: MaterialGroup;
  material?: Material;
}

// ============================================
// ТИПЫ ДЛЯ API ЗАПРОСОВ И ОТВЕТОВ
// ============================================

// Параметры для получения материалов
export interface GetMaterialsParams {
  page?: number;
  limit?: number;
  search?: string;
  groupId?: number;
}

// Ответ API при получении материалов
export interface MaterialsResponse {
  materials: Material[];
  total: number;
  page: number;
  limit: number;
}

// Ответ API при получении групп материалов
export interface MaterialGroupsResponse {
  groups: MaterialGroup[];
  total: number;
}

// Данные для создания матер��ала
export interface CreateMaterialData {
  materialName: string;
  article: string;
  unit: string;
  description?: string;
  groupIds?: number[];
}

// Данные для обновления материала
export interface UpdateMaterialData {
  materialName?: string;
  article?: string;
  unit?: string;
  description?: string;
  groupIds?: number[];
}

// Данные для создания группы материалов
export interface CreateMaterialGroupData {
  groupName: string;
  description?: string;
  materialIds?: number[];
}

// Данные для обновления группы материалов
export interface UpdateMaterialGroupData {
  groupName?: string;
  description?: string;
  materialIds?: number[];
}

// Данные для привязки материала к группе
export interface LinkMaterialToGroupData {
  groupId: number;
  materialId: number;
}

// Данные для отвязки материала от группы
export interface UnlinkMaterialFromGroupData {
  groupId: number;
  materialId: number;
}

// ============================================
// ТИПЫ ДЛЯ WEBSOCKET СОБЫТИЙ
// ============================================

// События материалов
export interface MaterialCreatedEvent {
  material: Material;
  timestamp: string;
}

export interface MaterialUpdatedEvent {
  material: Material;
  timestamp: string;
}

export interface MaterialDeletedEvent {
  materialId: number;
  materialName: string;
  timestamp: string;
}

export interface MaterialLinkedToGroupEvent {
  groupId: number;
  materialId: number;
  groupName: string;
  materialName: string;
  timestamp: string;
}

export interface MaterialUnlinkedFromGroupEvent {
  groupId: number;
  materialId: number;
  groupName: string;
  materialName: string;
  timestamp: string;
}

// События групп материалов
export interface MaterialGroupCreatedEvent {
  group: MaterialGroup;
  timestamp: string;
}

export interface MaterialGroupUpdatedEvent {
  group: MaterialGroup;
  timestamp: string;
}

export interface MaterialGroupDeletedEvent {
  groupId: number;
  groupName: string;
  timestamp: string;
}

export interface GroupMaterialsUpdatedEvent {
  groupId: number;
  materialIds: number[];
  timestamp: string;
}

// ============================================
// ТИПЫ ДЛЯ ФИЛЬТРАЦИИ И ��ОРТИРОВКИ
// ============================================

// Варианты сортировки материалов
export type MaterialSortField = 'materialName' | 'article' | 'unit' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

// Параметры сортировки
export interface MaterialSortParams {
  field: MaterialSortField;
  direction: SortDirection;
}

// Варианты фильтрации материалов
export interface MaterialFilterParams {
  groupIds?: number[];
  units?: string[];
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
}

// Расширенные параметры запроса материалов
export interface GetMaterialsExtendedParams extends GetMaterialsParams {
  sort?: MaterialSortParams;
  filter?: MaterialFilterParams;
  includeGroups?: boolean;
}

// ============================================
// ТИПЫ ДЛЯ СТАТИСТИКИ
// ============================================

// Статистика материалов
export interface MaterialsStatistics {
  totalMaterials: number;
  totalGroups: number;
  materialsWithoutGroups: number;
  mostUsedUnits: Array<{
    unit: string;
    count: number;
  }>;
  topGroups: Array<{
    groupId: number;
    groupName: string;
    materialsCount: number;
  }>;
}

// Статистика группы материалов
export interface MaterialGroupStatistics {
  groupId: number;
  groupName: string;
  materialsCount: number;
  recentlyAddedMaterials: Material[];
  unitDistribution: Array<{
    unit: string;
    count: number;
  }>;
}