// ================================================
// src/modules/materials/types.ts
// ================================================

export interface MaterialGroup {
  groupId: number;
  groupName: string;
  materialsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Material {
  materialId: number;
  materialName: string;
  article: string;
  unit: string;
  groups?: MaterialGroup[];
  createdAt?: string;
  updatedAt?: string;
}

// DTO для создания группы материалов
export interface CreateMaterialGroupDto {
  groupName: string;
}

// DTO для обновления группы материалов
export interface UpdateMaterialGroupDto {
  groupName: string;
}

// DTO для создания материала
export interface CreateMaterialDto {
  materialName: string;
  article: string;
  unit: string;
  groupIds?: number[];
}

// DTO для обновления материала
export interface UpdateMaterialDto {
  materialName: string;
  article: string;
  unit: string;
  groupIds?: number[];
}

// DTO для связи материала с группой
export interface LinkMaterialToGroupDto {
  materialId: number;
  groupId: number;
}

// DTO для загрузки материалов из Excel
export interface UploadMaterialFileDto {
  file: File;
  groupId: number;
}

export interface ParsedMaterialFromFile {
  code: string;
  name: string;
  exists?: boolean;
  existingMaterial?: {
    materialId: number;
    materialName: string;
    article: string;
    unit: string;
  };
}

export interface UploadMaterialFileResponse {
  message: string;
  filename: string;
  data: ParsedMaterialFromFile[];
  groupId: number;
}

export interface SaveMaterialsFromFileDto {
  groupId: number;
  materials: Array<{
    code: string;
    name: string;
    unit: string;
  }>;
}

export interface SaveMaterialsFromFileResponse {
  created: Array<{ code: string; name: string; materialId: number }>;
  updated: Array<{ code: string; name: string; materialId: number }>;
  errors: Array<{ code: string; message: string }>;
}