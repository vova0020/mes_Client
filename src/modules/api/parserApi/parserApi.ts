import axios from 'axios';
import { API_URL } from '../config';

// Интерфейс для различий между БД и парсированными данными
export interface DataDiff {
  field: string;
  dbValue: any;
  parsedValue: any;
}

// Интерфейс для информации об упаковке
export interface PackageInfo {
  packageCode: string;
  packageName: string;
  quantity: number;
}

// Интерфейс для маршрута
export interface RouteInfo {
  routeId: number;
  routeName: string;
}

// Интерфейс для парсированной детали
export interface ParsedDetail {
  partSku: string;
  partName: string;
  materialName: string;
  materialSku: string;
  thickness?: number;
  thicknessWithEdging?: number;
  quantity: number;
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
  packaging?: string;
  packagingSku?: string;
  conveyorPosition?: number;
  routeId: number;
  detailExists: boolean;
  packages: PackageInfo[];
  diffs: DataDiff[];
  packageId?: number;
  hasPackageConnection?: boolean;
  availableRoutes?: RouteInfo[];
  currentRouteId?: number;
}

// Ответ API при парсинге файла
export interface ParseFileResponse {
  message: string;
  filename: string;
  data: ParsedDetail[];
  packageId?: number;
  quantity?: number;
}

/**
 * Сервис для работы с API парсера Excel файлов
 */
export const parserApi = {
  /**
   * Загрузка и парсинг Excel файла
   * @param file - Excel файл (.xls или .xlsx), максимум 10MB
   * @param packageId - ID упаковки для проверки связей (опционально)
   * @param quantity - Количество деталей в упаковке (опционально)
   * @returns Promise с результатом парсинга
   */
  uploadFile: async (file: File, packageId?: number, quantity?: number): Promise<ParseFileResponse> => {
    try {
      console.log('Загрузка и парсинг файла:', file.name, { packageId, quantity });
      
      // Проверяем размер файла (максимум 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB в байтах
      if (file.size > maxSize) {
        throw new Error('Размер файла превышает 10MB');
      }
      
      // Проверяем формат файла
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Неподдерживаемый формат файла. Поддерживаются только .xls и .xlsx');
      }
      
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('file', file);
      
      // Добавляем опциональные параметры
      if (packageId !== undefined && packageId >= 1) {
        formData.append('packageId', packageId.toString());
      }
      if (quantity !== undefined && quantity >= 1) {
        formData.append('quantity', quantity.toString());
      }
      
      const response = await axios.post<ParseFileResponse>(
        `${API_URL}/parser/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('Файл успешно обработан:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      throw error;
    }
  }
};