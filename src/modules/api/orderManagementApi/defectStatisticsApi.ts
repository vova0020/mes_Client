import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Интерфейс для одного события возврата детали в производство
export interface DefectReturnEvent {
  movementId: number;
  returnedAt: string;
  returnedQuantity: number;
  returnToRouteStageId: number;
  returnToStageName: string | null;
  returnToMachineId: number | null;
  returnToMachineName: string | null;
  returnPalletId: number | null;
  returnPalletName: string | null;
  returnedByUserId: number | null;
}

// Интерфейс для информации об упаковке/заказе
export interface DefectPackageInfo {
  packageId: number;
  packageCode: string;
  packageName: string;
  orderId: number;
  orderBatchNumber: string;
  orderName: string;
}

// Интерфейс для детальной информации о браке
export interface DefectDetail {
  // Основная информация о рекламации
  reclamationId: number;
  partId: number;
  partCode: string;
  partName: string;
  defectQuantity: number;
  totalReturnedQuantity: number;
  defectTypes: string[];
  detectedAt: string;
  processedAt: string | null;
  status: string;
  qualityAction: string | null;
  note: string | null;
  
  // Информация о месте обнаружения брака
  stageId: number;
  stageName: string;
  machineId: number | null;
  machineName: string | null;
  palletId: number | null;
  palletName: string | null;
  
  // Все упаковки и заказы к которым привязана деталь
  packages: DefectPackageInfo[];
  
  // Информация о материале
  materialId: number | null;
  materialName: string | null;
  materialSku: string | null;
  
  // Информация о работниках
  reportedById: number | null;
  reportedByName: string | null;
  confirmedById: number | null;
  confirmedByName: string | null;
  
  // Все события возврата детали в производство
  returnEvents: DefectReturnEvent[];
}

// Интерфейс для параметров фильтрации
export interface DefectFilterParams {
  startDate?: string;
  endDate?: string;
  orderId?: number;
  materialId?: number;
  color?: string;
  workerId?: number;
  stageId?: number;
}

// Интерфейс для опций фильтров
export interface FilterOption {
  id: number;
  name: string;
}

export interface MaterialFilterOption extends FilterOption {
  sku: string;
}

export interface OrderFilterOption {
  id: number;
  name: string;
  batchNumber: string;
}

// Функция для получения детальной информации по браку с фильтрацией
export const getDefectStatistics = async (
  params: DefectFilterParams
): Promise<DefectDetail[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.orderId) queryParams.append('orderId', params.orderId.toString());
    if (params.materialId) queryParams.append('materialId', params.materialId.toString());
    if (params.color) queryParams.append('color', params.color);
    if (params.workerId) queryParams.append('workerId', params.workerId.toString());
    if (params.stageId) queryParams.append('stageId', params.stageId.toString());

    const response = await axios.get<DefectDetail[]>(
      `${API_URL}/statistics/defects?${queryParams.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статистики брака:', error);
    throw error;
  }
};

// Функция для получения списка заказов для фильтра
export const getOrdersForFilter = async (): Promise<OrderFilterOption[]> => {
  try {
    const response = await axios.get<OrderFilterOption[]>(
      `${API_URL}/order-management/orders/list`
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка заказов:', error);
    return [];
  }
};

// Функция для получения списка материалов для фильтра
export const getMaterialsForFilter = async (): Promise<MaterialFilterOption[]> => {
  try {
    const response = await axios.get<MaterialFilterOption[]>(
      `${API_URL}/materials/list`
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка материалов:', error);
    return [];
  }
};

// Функция для получения списка работников для фильтра
export const getWorkersForFilter = async (): Promise<FilterOption[]> => {
  try {
    const response = await axios.get<FilterOption[]>(
      `${API_URL}/users/workers`
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка работников:', error);
    return [];
  }
};

// Функция для получения списка этапов производства для фильтра
export const getStagesForFilter = async (): Promise<FilterOption[]> => {
  try {
    const response = await axios.get<FilterOption[]>(
      `${API_URL}/stages/list`
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка этапов:', error);
    return [];
  }
};

// Функция для получения уникальных цветов материалов
export const getColorsForFilter = async (): Promise<string[]> => {
  try {
    const response = await axios.get<string[]>(
      `${API_URL}/materials/colors`
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка цветов:', error);
    return [];
  }
};
