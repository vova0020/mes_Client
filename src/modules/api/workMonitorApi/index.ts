import axios from 'axios';
import { API_URL } from '../config';

export interface StreamResponse {
  streamId: number;
  streamName: string;
}

export interface StageResponse {
  stageId: number;
  stageName: string;
  shiftNorm: number;
  completed: number;
  workplaceCount: number;
}

export interface WorkplaceResponse {
  machineId: number;
  machineName: string;
  norm: number;
  completed: number;
  planned: number;
}

class WorkMonitorApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/work-monitor`;
  }

  async getStreams(): Promise<StreamResponse[]> {
    const response = await axios.get<StreamResponse[]>(`${this.baseUrl}/streams`);
    return response.data;
  }

  async getStages(streamId: number): Promise<StageResponse[]> {
    const response = await axios.get<StageResponse[]>(`${this.baseUrl}/streams/${streamId}/stages`);
    return response.data;
  }

  async getWorkplaces(streamId: number, stageId: number): Promise<WorkplaceResponse[]> {
    const response = await axios.get<WorkplaceResponse[]>(`${this.baseUrl}/streams/${streamId}/stages/${stageId}/workplaces`);
    return response.data;
  }
}

export const workMonitorApi = new WorkMonitorApi();
