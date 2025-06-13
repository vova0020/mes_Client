// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/api/streamsApi.ts
// ================================================

import { 
  ProductionLine,
  ProductionLineDetail,
  CreateStreamData, 
  UpdateStreamData,
  GetStreamsParams,
  StreamsResponse,
  LinkStageToLineData,
  LinkMaterialToLineData,
  UnlinkMaterialFromLineData,
  ProductionStageLevel1,
  ProductionStageLevel1Detail,
  ProductionStageLevel2,
  CreateStageLevel1Data,
  UpdateStageLevel1Data,
  CreateStageLevel2Data,
  UpdateStageLevel2Data,
  RebindStageLevel2Data,
  LinkSubstageData,
  GetStagesLevel2Params
} from '../types/streams.types';

import {
  Material,
  MaterialGroup,
  GetMaterialsParams,
  MaterialsResponse,
  MaterialGroupsResponse
} from '../types/materials.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class StreamsApi {
  // ====================================
  // API ДЛЯ ПРОИЗВОДСТВЕННЫХ ПОТОКОВ
  // ====================================

  // Получить все потоки
  async getStreams(params?: GetStreamsParams): Promise<ProductionLine[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.lineType) searchParams.append('lineType', params.lineType);

    const url = `${API_BASE_URL}/settings/production-lines${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения потоков: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Возвращаем массив потоков
  }

  // Получить поток по ID
  async getStream(id: number): Promise<ProductionLineDetail> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения потока: ${response.statusText}`);
    }

    return response.json();
  }

  // Создать новый поток
  async createStream(data: CreateStreamData): Promise<ProductionLine> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка создания потока: ${response.statusText}`);
    }

    return response.json();
  }

  // Обновить поток
  async updateStream(id: number, data: UpdateStreamData): Promise<ProductionLine> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка обновления потока: ${response.statusText}`);
    }

    return response.json();
  }

  // Удалить поток
  async deleteStream(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка удаления потока: ${response.statusText}`);
    }
  }

  // Получить этапы в потоке
  async getStreamStages(streamId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/${streamId}/stages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения этапов потока: ${response.statusText}`);
    }

    return response.json();
  }

  // Обновить этапы потока
  async updateStreamStages(streamId: number, stageIds: number[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/${streamId}/stages`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stageIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка обновления этапов потока: ${response.statusText}`);
    }
  }

  // Получить материалы потока
  async getStreamMaterials(streamId: number): Promise<Material[]> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/${streamId}/materials`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения материалов потока: ${response.statusText}`);
    }

    return response.json();
  }

  // Обновить материалы потока
  async updateStreamMaterials(streamId: number, materialIds: number[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/${streamId}/materials`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ materialIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка обновления материалов потока: ${response.statusText}`);
    }
  }

  // Привязать этап к потоку
  async linkStageToLine(data: LinkStageToLineData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/link-stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка привязки этапа к потоку: ${response.statusText}`);
    }
  }

  // Отвязать этап от потока
  async unlinkStageFromLine(lineStageId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/line-stage/${lineStageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка отвязки этапа от потока: ${response.statusText}`);
    }
  }

  // Привязать материал к потоку
  async linkMaterialToLine(data: LinkMaterialToLineData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/link-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка привязки материала к потоку: ${response.statusText}`);
    }
  }

  // Отвязать материал от потока
  async unlinkMaterialFromLine(data: UnlinkMaterialFromLineData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-lines/unlink-material`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка отвязки материала от потока: ${response.statusText}`);
    }
  }

  // ====================================
  // API ДЛЯ ТЕХНОЛОГИЧЕСКИХ ЭТАПОВ 1 УРОВНЯ
  // ====================================

  // Получить все операции 1 уровня
  async getProductionStagesLevel1(): Promise<ProductionStageLevel1[]> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения технологических операций: ${response.statusText}`);
    }

    return response.json();
  }

  // Получить операцию 1 уровня по ID
  async getProductionStageLevel1(id: number): Promise<ProductionStageLevel1Detail> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level1/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения технологической операции: ${response.statusText}`);
    }

    return response.json();
  }

  // Создать операцию 1 уровня
  async createProductionStageLevel1(data: CreateStageLevel1Data): Promise<ProductionStageLevel1> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка создания технологической операции: ${response.statusText}`);
    }

    return response.json();
  }

  // Обновить операцию 1 уровня
  async updateProductionStageLevel1(id: number, data: UpdateStageLevel1Data): Promise<ProductionStageLevel1> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level1/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка обновления технологической операции: ${response.statusText}`);
    }

    return response.json();
  }

  // Удалить операцию 1 уровня
  async deleteProductionStageLevel1(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level1/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка удаления технологической опер��ции: ${response.statusText}`);
    }
  }

  // ====================================
  // API ДЛЯ ТЕХНОЛОГИЧЕСКИХ ЭТАПОВ 2 УРОВНЯ
  // ====================================

  // Получить все подэтапы
  async getProductionStagesLevel2(params?: GetStagesLevel2Params): Promise<ProductionStageLevel2[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.stageId) searchParams.append('stageId', params.stageId.toString());

    const url = `${API_BASE_URL}/settings/production-stages-level2${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения подэтапов: ${response.statusText}`);
    }

    return response.json();
  }

  // Получить подэтап по ID
  async getProductionStageLevel2(id: number): Promise<ProductionStageLevel2> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level2/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения подэтапа: ${response.statusText}`);
    }

    return response.json();
  }

  // Создать подэтап
  async createProductionStageLevel2(data: CreateStageLevel2Data): Promise<ProductionStageLevel2> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка создания подэтапа: ${response.statusText}`);
    }

    return response.json();
  }

  // Обновить подэтап
  async updateProductionStageLevel2(id: number, data: UpdateStageLevel2Data): Promise<ProductionStageLevel2> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level2/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка обновления подэтапа: ${response.statusText}`);
    }

    return response.json();
  }

  // Перепривязать подэтап к другому этапу 1 уровня
  async rebindProductionStageLevel2(id: number, data: RebindStageLevel2Data): Promise<ProductionStageLevel2> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level2/${id}/rebind`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка перепривязки подэтапа: ${response.statusText}`);
    }

    return response.json();
  }

  // Удалить подэтап
  async deleteProductionStageLevel2(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level2/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка удаления подэтапа: ${response.statusText}`);
    }
  }

  // Привязать подэтап к операции
  async linkSubstageToStage(data: LinkSubstageData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/production-stages-level2/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка привязки подэтапа к операции: ${response.statusText}`);
    }
  }

  // ====================================
  // API ДЛЯ МАТЕРИАЛОВ (без изменений)
  // ====================================

  // Получить все материалы
  async getMaterials(params?: GetMaterialsParams): Promise<Material[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.groupId) searchParams.append('groupId', params.groupId.toString());
    if (params?.search) searchParams.append('search', params.search);

    const url = `${API_BASE_URL}/settings/materials${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения материалов: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Возвращаем массив материалов
  }

  // Получить материал по ID
  async getMaterial(id: number): Promise<Material> {
    const response = await fetch(`${API_BASE_URL}/settings/materials/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения материала: ${response.statusText}`);
    }

    return response.json();
  }

  // ====================================
  // API ДЛЯ ГРУПП МАТЕРИАЛОВ (без изменений)
  // ====================================

  // Получить все группы материалов
  async getMaterialGroups(): Promise<MaterialGroup[]> {
    const response = await fetch(`${API_BASE_URL}/settings/material-groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения групп материалов: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Возвращаем массив групп
  }

  // Получить группу по ID
  async getMaterialGroup(id: number): Promise<MaterialGroup> {
    const response = await fetch(`${API_BASE_URL}/settings/material-groups/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения группы материалов: ${response.statusText}`);
    }

    return response.json();
  }

  // Получить материалы группы
  async getGroupMaterials(groupId: number): Promise<Material[]> {
    const response = await fetch(`${API_BASE_URL}/settings/material-groups/${groupId}/materials`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения материалов группы: ${response.statusText}`);
    }

    return response.json();
  }
}

export const streamsApi = new StreamsApi();