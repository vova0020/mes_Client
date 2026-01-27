import { 
  ProductionLine, 
  StageStats, 
  MachineStats, 
  LineStatsParams, 
  StageStatsParams,
  UnitOfMeasurement,
  DateRangeType,
  StageInfo,
  MachineUptimeStats,
  MachineUptimeResponse,
  GetMachineUptimeParams
} from './types';


import { API_URL } from '../config';
const BASE_URL = `${ API_URL }/statistics`;

export const statisticsApi = {
  async getProductionLines(): Promise<ProductionLine[]> {
    const response = await fetch(`${BASE_URL}/production-lines`);
    if (!response.ok) throw new Error('Failed to fetch production lines');
    return response.json();
  },

  async getLineStats(params: LineStatsParams): Promise<StageStats[]> {
    const searchParams = new URLSearchParams({
      lineId: params.lineId.toString(),
      dateRangeType: params.dateRangeType,
      unit: params.unit || UnitOfMeasurement.PIECES
    });

    if (params.dateRangeType === DateRangeType.CUSTOM) {
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
    } else if (params.date) {
      searchParams.append('date', params.date);
    }

    const response = await fetch(`${BASE_URL}/production-line?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch line stats');
    return response.json();
  },

  async getStageStats(params: StageStatsParams): Promise<MachineStats[]> {
    const searchParams = new URLSearchParams({
      lineId: params.lineId.toString(),
      stageId: params.stageId.toString(),
      dateRangeType: params.dateRangeType
    });

    if (params.dateRangeType === DateRangeType.CUSTOM) {
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
    } else if (params.date) {
      searchParams.append('date', params.date);
    }

    const response = await fetch(`${BASE_URL}/stage?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch stage stats');
    return response.json();
  },

  async getMachineUptimeStages(): Promise<StageInfo[]> {
    const response = await fetch(`${BASE_URL}/machine-uptime/stages`);
    if (!response.ok) throw new Error('Failed to fetch machine uptime stages');
    return response.json();
  },

  async getMachineUptimeStats(params: GetMachineUptimeParams): Promise<MachineUptimeResponse> {
    const searchParams = new URLSearchParams({
      dateRangeType: params.dateRangeType
    });

    if (params.stageId) searchParams.append('stageId', params.stageId.toString());
    if (params.dateRangeType === DateRangeType.CUSTOM) {
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
    }

    const response = await fetch(`${BASE_URL}/machine-uptime?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch machine uptime stats');
    return response.json();
  }
};
