/**
 * API для работы с невозвращенными деталями из брака
 */

import { API_URL } from '../config';

const BASE_URL = `${API_URL}/statistics`;

// Типы данных

export interface OrderFilterOption {
  orderId: number;
  batchNumber: string;
  orderName: string;
}

export interface PackageFilterOption {
  packageId: number;
  packageCode: string;
  packageName: string;
  orderId: number;
}

export interface FilterOptions {
  orders: OrderFilterOption[];
  packages: PackageFilterOption[];
}

export interface UnreturnedDefectRecord {
  reclamationId: number;
  orderId: number;
  orderBatchNumber: string;
  orderName: string;
  packageId: number;
  packageCode: string;
  packageName: string;
  partId: number;
  partCode: string;
  partName: string;
  partSize: string;
  materialId: number | null;
  materialName: string | null;
  materialSku: string | null;
  defectQuantity: number;
  returnedQuantity: number;
  unreturnedQuantity: number;
  detectedAt: string;
  stageId: number;
  stageName: string;
  machineId: number | null;
  machineName: string | null;
  defectTypes: string[];
  status: string;
}

export interface UnreturnedDefectsParams {
  orderId?: number;
  packageId?: number;
}

/**
 * Получить опции фильтров (списки заказов и упаковок)
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  try {
    const response = await fetch(`${BASE_URL}/unreturned-defects/filter-options`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка при загрузке опций фильтров:', error);
    throw error;
  }
}

/**
 * Получить данные по невозвращенным деталям с фильтрацией
 */
export async function getUnreturnedDefects(
  params?: UnreturnedDefectsParams
): Promise<UnreturnedDefectRecord[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.orderId) {
      queryParams.append('orderId', params.orderId.toString());
    }
    
    if (params?.packageId) {
      queryParams.append('packageId', params.packageId.toString());
    }
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${BASE_URL}/unreturned-defects?${queryString}`
      : `${BASE_URL}/unreturned-defects`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка при загрузке данных о невозвращенных деталях:', error);
    throw error;
  }
}
