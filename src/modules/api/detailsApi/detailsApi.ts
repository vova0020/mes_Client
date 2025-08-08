import axios from 'axios';
import { API_URL } from '../config';

// Типы данных для API деталей
export interface Detail {
  id: number;
  partSku: string;
  partName: string;
  materialName: string;
  materialSku: string;
  thickness?: number;
  thicknessWithEdging?: number;
  finishedLength?: number;
  finishedWidth?: number;
  groove?: string;
  edgingSkuL1?: string;
  edgingNameL1?: string;
  edgingSkuL2?: string;
  edgingNameL2?: string;
  edgingSkuW1?: string;
  edgingNameW1?: string;
  edgingSkuW2?: string;
  edgingNameW2?: string;
  plasticFace?: string;
  plasticFaceSku?: string;
  plasticBack?: string;
  plasticBackSku?: string;
  pf: boolean;
  pfSku?: string;
  sbPart: boolean;
  pfSb: boolean;
  sbPartSku?: string;
  conveyorPosition?: number;
  quantity: number;
  route?: {
    routeId: number;
    routeName: string;
    lineId: number;
  } | null;
  packageDetails?: PackageDetail[];
}

// Интерфейс для связи детали с упаковкой
export interface PackageDetail {
  package: {
    packageCode: string;
    packageName: string;
  };
}

// Интерфейс для связи уп��ковки при обновлении детали
export interface PackageConnection {
  packageId: number;
  quantity: number;
}

// DTO для создания детали
export interface CreateDetailDto {
  partSku: string;
  partName: string;
  materialName: string;
  materialSku: string;
  thickness?: number;
  thicknessWithEdging?: number;
  finishedLength?: number;
  finishedWidth?: number;
  groove?: string;
  edgingSkuL1?: string;
  edgingNameL1?: string;
  edgingSkuL2?: string;
  edgingNameL2?: string;
  edgingSkuW1?: string;
  edgingNameW1?: string;
  edgingSkuW2?: string;
  edgingNameW2?: string;
  plasticFace?: string;
  plasticFaceSku?: string;
  plasticBack?: string;
  plasticBackSku?: string;
  pf: boolean;
  pfSku?: string;
  sbPart: boolean;
  pfSb: boolean;
  sbPartSku?: string;
  conveyorPosition?: number;
  quantity: number;
  routeId: number;
}

// DTO для создания детали с упаковкой
export interface CreateDetailWithPackageDto extends CreateDetailDto {
  packageId: number;
}

// DTO для обновления детали
export interface UpdateDetailDto extends CreateDetailDto {
  packageConnections?: PackageConnection[];
}

// Ответ API при получении деталей по упаковке
export interface GetDetailsByPackageResponse {
  message: string;
  data: Detail[];
}

// Ответ API при создании/обновлении детали
export interface DetailResponse {
  message: string;
  data: Detail;
}

// Ответ API при удалении детали
export interface DeleteDetailResponse {
  message: string;
}

// DTO для сохранения деталей из файла
export interface SaveDetailsFromFileDto {
  packageId: number;
  details: CreateDetailDto[];
}

// Ответ API при сохранении деталей из файла
export interface SaveDetailsFromFileResponse {
  message: string;
  data: {
    created: number;
    updated: number;
    connected: number;
  };
}

// Интерфейс для маршрута
export interface Route {
  routeId: number;
  routeName: string;
}

// Ответ API при получении списка маршрутов
export interface GetRoutesResponse {
  message: string;
  data: Route[];
}

/**
 * Сервис для работы с API деталей
 */
export const detailsApi = {
  /**
   * Получение всех деталей связанных с упаковкой
   * @param packageId - ID упаковки
   * @returns Promise с массивом деталей
   */
  getByPackageId: async (packageId: number): Promise<Detail[]> => {
    try {
      console.log(`Получение деталей для упаковки с ID=${packageId}`);
      const response = await axios.get<GetDetailsByPackageResponse>(`${API_URL}/details/package/${packageId}`);
      return response.data.data;
    } catch (error) {
      console.error('Ошибка при получении деталей:', error);
      throw error;
    }
  },

  /**
   * Создание новой детали
   * @param createDto - Данные для создания детали
   * @returns Promise с созданной деталью
   */
  create: async (createDto: CreateDetailDto): Promise<Detail> => {
    try {
      console.log('Создание новой детали:', createDto);
      const response = await axios.post<DetailResponse>(`${API_URL}/details`, createDto);
      return response.data.data;
    } catch (error) {
      console.error('Ошибка при создании детали:', error);
      throw error;
    }
  },

  /**
   * Обновление детали по ID
   * @param id - Идентификатор детали
   * @param updateDto - Данные для обновления
   * @returns Promise с обновленной деталью
   */
  update: async (id: number, updateDto: UpdateDetailDto): Promise<Detail> => {
    try {
      console.log(`Обновление детали с ID=${id}:`, updateDto);
      const response = await axios.put<DetailResponse>(`${API_URL}/details/${id}`, updateDto);
      return response.data.data;
    } catch (error) {
      console.error('Ошибка при обновлении детали:', error);
      throw error;
    }
  },

  /**
   * Удаление детали по ID
   * @param id - Идентификатор детали
   * @returns Promise с результатом удаления
   */
  remove: async (id: number, packageId?: number): Promise<DeleteDetailResponse> => {
    try {
      const url = packageId 
        ? `${API_URL}/details/${id}/package/${packageId}`
        : `${API_URL}/details/${id}`;
      console.log(`Удаление детали с ID=${id}${packageId ? ` из упаковки с ID=${packageId}` : ''}`);
      const response = await axios.delete<DeleteDetailResponse>(url);
      return response.data;
    } catch (error) {
      console.error('Ошибка п��и удалении детали:', error);
      throw error;
    }
  },

  /**
   * Копирование детали (создание копии существующей детали)
   * @param id - Идентификатор детали для копирования
   * @returns Promise с новой деталью
   */
  copy: async (id: number): Promise<Detail> => {
    try {
      console.log(`Копирование детали с ID=${id}`);
      // Сначала получаем данные детали, затем создаем новую с измененным артикулом
      const response = await axios.get<DetailResponse>(`${API_URL}/details/${id}`);
      const originalDetail = response.data.data;
      
      // Создаем копию с новым артикулом
      const copyDto: CreateDetailDto = {
        ...originalDetail,
        partSku: `${originalDetail.partSku}_copy_${Date.now()}`, // Добавляем суффикс для уникальности
        quantity: originalDetail.quantity || 1, // Устанавливаем количество по умолчанию
        routeId: originalDetail.route?.routeId || 1, // Используем routeId из маршрута или 1 по умолчанию
      };
      
      return await detailsApi.create(copyDto);
    } catch (error) {
      console.error('Ошибка при копировании детали:', error);
      throw error;
    }
  },

  /**
   * Создание новой детали с привязкой к упаковке
   * @param createDto - Данные для создания детали с упаковкой
   * @returns Promise с созданной деталью
   */
  createWithPackage: async (createDto: CreateDetailWithPackageDto): Promise<Detail> => {
    try {
      console.log('Создание новой детали с упаковкой:', createDto);
      const response = await axios.post<DetailResponse>(`${API_URL}/details/with-package`, createDto);
      return response.data.data;
    } catch (error) {
      console.error('Ошибка при создании детали с упаковкой:', error);
      throw error;
    }
  },

  /**
   * Сохранение деталей из файла с привязкой к упаковкам
   * @param saveDto - Данные для сохранения деталей из файла
   * @returns Promise с результатом сохранения
   */
  saveFromFile: async (saveDto: SaveDetailsFromFileDto): Promise<SaveDetailsFromFileResponse> => {
    try {
      console.log('Сохранение деталей из файла:', saveDto);
      const response = await axios.post<SaveDetailsFromFileResponse>(`${API_URL}/details/save-from-file`, saveDto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при сохранении деталей из файла:', error);
      throw error;
    }
  },

  /**
   * Получение списка всех маршрутов
   * @returns Promise с массивом маршрутов
   */
  getRoutes: async (): Promise<Route[]> => {
    try {
      console.log('Получение списка маршрутов');
      const response = await axios.get<GetRoutesResponse>(`${API_URL}/details/routes`);
      return response.data.data;
    } catch (error) {
      console.error('Ошибка при получении списка маршрутов:', error);
      throw error;
    }
  }
};