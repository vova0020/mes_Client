// ================================================
// src/modules/materials/api.ts
// ================================================
import axios from 'axios';
import {
  MaterialGroup,
  Material,
  CreateMaterialGroupDto,
  UpdateMaterialGroupDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  LinkMaterialToGroupDto,
} from './types';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});

// --- Material Groups ---
export const getMaterialGroups = () =>
  api.get<MaterialGroup[]>('/settings/material-groups');
export const createMaterialGroup = (dto: CreateMaterialGroupDto) =>
  api.post<MaterialGroup>('/settings/material-groups', dto);
export const updateMaterialGroup = (id: number, dto: UpdateMaterialGroupDto) =>
  api.patch<MaterialGroup>(`/settings/material-groups/${id}`, dto);
export const deleteMaterialGroup = (id: number) =>
  api.delete<void>(`/settings/material-groups/${id}`);
export const linkMaterialToGroup = (dto: LinkMaterialToGroupDto) =>
  api.post<void>('/settings/material-groups/link', dto);
export const unlinkMaterialFromGroup = (dto: LinkMaterialToGroupDto) =>
  api.post<void>('/settings/material-groups/unlink', dto);

// --- Materials ---
export const getMaterials = (groupId?: number) => {
  const url = groupId ? `/settings/materials?groupId=${groupId}` : '/settings/materials';
  return api.get<Material[]>(url);
};
export const getMaterialById = (id: number) =>
  api.get<Material>(`/settings/materials/${id}`);
export const createMaterial = (dto: CreateMaterialDto) =>
  api.post<Material>('/settings/materials', dto);
export const updateMaterial = (id: number, dto: UpdateMaterialDto) =>
  api.patch<Material>(`/settings/materials/${id}`, dto);
export const deleteMaterial = (id: number) =>
  api.delete<void>(`/settings/materials/${id}`);