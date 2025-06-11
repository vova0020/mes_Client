// ================================================
// src/modules/materials/types.ts
// ================================================
export interface MaterialGroup {
  groupId: number;           // ID группы
  groupName: string;         // Название группы
  materialsCount?: number;   // Опционально: количество материалов
}

export interface Material {
  materialId: number;
  materialName: string;
  unit: string;
  groups?: Array<{ groupId: number; groupName: string }>;
}

export interface CreateMaterialGroupDto {
  groupName: string;
}
export interface UpdateMaterialGroupDto {
  groupName?: string;
}
export interface CreateMaterialDto {
  materialName: string;
  unit: string;
  groupIds?: number[];
}
export interface UpdateMaterialDto {
  materialName?: string;
  unit?: string;
  groupIds?: number[];
}
export interface LinkMaterialToGroupDto {
  groupId: number;
  materialId: number;
}