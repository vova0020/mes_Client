// ================================================
// src/modules/materials/api.ts
// ================================================
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ============= Query Keys =============
export const QUERY_KEYS = {
  materialGroups: ['material-groups'] as const,
  materials: ['materials'] as const,
  materialsByGroup: (groupId: number) => ['materials', 'by-group', groupId] as const,
  material: (id: number) => ['materials', id] as const,
} as const;

// ============= API Functions =============
// --- Material Groups ---
const fetchMaterialGroups = () =>
  api.get<MaterialGroup[]>('/settings/material-groups').then(res => res.data);

const createMaterialGroupApi = (dto: CreateMaterialGroupDto) =>
  api.post<MaterialGroup>('/settings/material-groups', dto).then(res => res.data);

const updateMaterialGroupApi = (id: number, dto: UpdateMaterialGroupDto) =>
  api.patch<MaterialGroup>(`/settings/material-groups/${id}`, dto).then(res => res.data);

const deleteMaterialGroupApi = (id: number) =>
  api.delete<void>(`/settings/material-groups/${id}`);

const linkMaterialToGroupApi = (dto: LinkMaterialToGroupDto) =>
  api.post<void>('/settings/material-groups/link', dto);

const unlinkMaterialFromGroupApi = (dto: LinkMaterialToGroupDto) =>
  api.post<void>('/settings/material-groups/unlink', dto);

// --- Materials ---
const fetchMaterials = (groupId?: number) => {
  const url = groupId ? `/settings/materials?groupId=${groupId}` : '/settings/materials';
  return api.get<Material[]>(url).then(res => res.data);
};

const fetchMaterialById = (id: number) =>
  api.get<Material>(`/settings/materials/${id}`).then(res => res.data);

const createMaterialApi = (dto: CreateMaterialDto) =>
  api.post<Material>('/settings/materials', dto).then(res => res.data);

const updateMaterialApi = (id: number, dto: UpdateMaterialDto) =>
  api.patch<Material>(`/settings/materials/${id}`, dto).then(res => res.data);

const deleteMaterialApi = (id: number) =>
  api.delete<void>(`/settings/materials/${id}`);

// --- Material Upload from Excel ---
const uploadMaterialFileApi = (file: File, groupId: number) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('groupId', groupId.toString());
  return api.post('/settings/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
};

const saveMaterialsFromFileApi = (groupId: number, materials: Array<{ code: string; name: string; unit: string }>) =>
  api.post('/settings/materials/save-from-file', { groupId, materials }).then(res => res.data);

const getMaterialUnitsApi = () =>
  api.get<string[]>('/settings/materials/units').then(res => res.data);

// ============= React Query Hooks =============

// --- Material Groups Hooks ---
export const useMaterialGroups = () => {
  return useQuery({
    queryKey: QUERY_KEYS.materialGroups,
    queryFn: fetchMaterialGroups,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

export const useCreateMaterialGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMaterialGroupApi,
    onSuccess: () => {
      // Обновляем кэш групп материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
    },
    onError: (error) => {
      console.error('Ошибка создания группы материалов:', error);
    }
  });
};

export const useUpdateMaterialGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateMaterialGroupDto }) =>
      updateMaterialGroupApi(id, dto),
    onSuccess: () => {
      // Обновляем кэш групп материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
    },
    onError: (error) => {
      console.error('Ошибка обновления группы материалов:', error);
    }
  });
};

export const useDeleteMaterialGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMaterialGroupApi,
    onSuccess: () => {
      // Обновляем кэш групп материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
      // Также обновляем материалы, так как связи могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
    },
    onError: (error) => {
      console.error('Ошибка удаления группы материалов:', error);
    }
  });
};

// --- Materials Hooks ---
export const useMaterials = (groupId?: number) => {
  return useQuery({
    queryKey: groupId 
      ? QUERY_KEYS.materialsByGroup(groupId)
      : QUERY_KEYS.materials,
    queryFn: () => fetchMaterials(groupId),
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

export const useMaterial = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.material(id),
    queryFn: () => fetchMaterialById(id),
    enabled: !!id, // Выполнить запрос только если id существует
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMaterialApi,
    onSuccess: () => {
      // Обновляем все запросы материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      // Также обновляем группы, так как счетчики могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
    },
    onError: (error) => {
      console.error('Ошибка создания материала:', error);
    }
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateMaterialDto }) =>
      updateMaterialApi(id, dto),
    onSuccess: (updatedMaterial, { id }) => {
      // Обновляем конкретный материал в кэше
      queryClient.setQueryData(QUERY_KEYS.material(id), updatedMaterial);
      // Обновляем все списк�� материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      // Также обновляем группы, так как связи могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
    },
    onError: (error) => {
      console.error('Ошибка обновления материала:', error);
    }
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMaterialApi,
    onSuccess: () => {
      // Обновляем все запросы материалов
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      // Также обновляем группы, так как счетчики могли измениться
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
    },
    onError: (error) => {
      console.error('Ошибка удаления материала:', error);
    }
  });
};

// --- Legacy API exports (для обратной совместимости) ---
export const getMaterialGroups = fetchMaterialGroups;
export const getMaterials = fetchMaterials;
export const getMaterialById = fetchMaterialById;
export const createMaterialGroup = createMaterialGroupApi;
export const updateMaterialGroup = updateMaterialGroupApi;
export const deleteMaterialGroup = deleteMaterialGroupApi;
export const createMaterial = createMaterialApi;
export const updateMaterial = updateMaterialApi;
export const deleteMaterial = deleteMaterialApi;
export const linkMaterialToGroup = linkMaterialToGroupApi;
export const unlinkMaterialFromGroup = unlinkMaterialFromGroupApi;
export const uploadMaterialFile = uploadMaterialFileApi;
export const saveMaterialsFromFile = saveMaterialsFromFileApi;
export const getMaterialUnits = getMaterialUnitsApi;