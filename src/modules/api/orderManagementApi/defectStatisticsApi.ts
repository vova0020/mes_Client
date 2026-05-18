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
  machineId?: number;
  stageId?: number;
}

// Интерфейсы для опций фильтров (соответствуют ответу GET /statistics/filter-options)
export interface OrderFilterOption {
  orderId: number;
  batchNumber: string;
  orderName: string;
}

export interface MaterialFilterOption {
  materialId: number;
  materialName: string;
  article: string;
}

export interface MachineFilterOption {
  machineId: number;
  machineName: string;
}

export interface StageFilterOption {
  stageId: number;
  stageName: string;
}

export interface FilterOptions {
  orders: OrderFilterOption[];
  materials: MaterialFilterOption[];
  machines: MachineFilterOption[];
  stages: StageFilterOption[];
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
    if (params.machineId) queryParams.append('machineId', params.machineId.toString());
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

// Функция для получения всех опций фильтров одним запросом
export const getFilterOptions = async (): Promise<FilterOptions> => {
  try {
    const response = await axios.get<FilterOptions>(
      `${API_URL}/statistics/filter-options`
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении опций фильтров:', error);
    throw error;
  }
};

// ─── Учёт выпуска продукции ──────────────────────────────────────────────────

// Информация об упаковке/заказе в записи выпуска
export interface ProductionPackageInfo {
  packageId: number;
  packageCode: string;
  packageName: string;
  orderId: number;
  orderBatchNumber: string;
  orderName: string;
}

// Одна запись журнала выпуска (операция на станке)
export interface MachineProductionRecord {
  operationId: number;
  machineId: number;
  machineName: string;
  machineLoadUnit: string;
  partId: number;
  partCode: string;
  partName: string;
  partSize: string;
  materialId: number | null;
  materialName: string | null;
  materialSku: string | null;
  palletId: number;
  palletName: string;
  routeStageId: number;
  stageId: number;
  stageName: string;
  quantityProcessed: number;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  operatorId: number | null;
  operatorName: string | null;
  packages: ProductionPackageInfo[];
}

// Параметры фильтрации учёта выпуска
export interface MachineProductionFilterParams {
  startDate?: string;
  endDate?: string;
  machineId?: number;
  stageId?: number;
  orderId?: number;
}

// Функция для получения журнала выпуска продукции
export const getMachineProduction = async (
  params: MachineProductionFilterParams
): Promise<MachineProductionRecord[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.machineId) queryParams.append('machineId', params.machineId.toString());
    if (params.stageId) queryParams.append('stageId', params.stageId.toString());
    if (params.orderId) queryParams.append('orderId', params.orderId.toString());

    const response = await axios.get<MachineProductionRecord[]>(
      `${API_URL}/statistics/machine-production?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении данных о выпуске продукции:', error);
    throw error;
  }
};
