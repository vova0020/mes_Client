import axios from 'axios';

import { API_URL } from '../../config';

export interface AssignmentDetail {
  assignmentPartId: number;
  customPartId: number;
  partCode: string;
  partName: string;
  materialName: string;
  size: string;
  plannedQuantity: number;
  processedQuantity: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_PROCESSED';
}

export interface AssignmentPallet {
  assignmentId: number;
  palletId: number;
  palletNumber: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_PROCESSED';
  priority: number;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  details: AssignmentDetail[];
}

export interface AssignmentOrder {
  orderId: number;
  orderName: string;
  totalPallets: number;
  totalDetails: number;
  pallets: AssignmentPallet[];
}

export interface MachineAssignmentsResponse {
  status: 'SUCCESS' | 'NO_ASSIGNMENTS';
  message: string;
  machineId: number;
  machineName: string;
  orders: AssignmentOrder[];
}

export interface CompleteDetailRequest {
  processedQuantity: number;
}

export interface ReassignRequest {
  newMachineId: number;
}

export const machineAssignmentsApi = {
  // Получить сменное задание для станка
  getMachineAssignments: async (machineId: number): Promise<MachineAssignmentsResponse> => {
    const response = await axios.get(`${API_URL}/custom/machines/${machineId}/assignments`);
    return response.data;
  },

  // Начать работу над поддоном
  startPallet: async (assignmentId: number) => {
    const response = await axios.post(`${API_URL}/custom/machines/assignments/${assignmentId}/start`);
    return response.data;
  },

  // Завершить работу над поддоном
  completePallet: async (assignmentId: number) => {
    const response = await axios.post(`${API_URL}/custom/machines/assignments/${assignmentId}/complete`);
    return response.data;
  },

  // Удалить задание
  deleteAssignment: async (assignmentId: number) => {
    const response = await axios.delete(`${API_URL}/custom/machines/assignments/${assignmentId}`);
    return response.data;
  },

  // Начать работу над деталью
  startDetail: async (assignmentPartId: number) => {
    const response = await axios.post(`${API_URL}/custom/machines/assignments/parts/${assignmentPartId}/start`);
    return response.data;
  },

  // Завершить работу над деталью
  completeDetail: async (assignmentPartId: number, data: CompleteDetailRequest) => {
    const response = await axios.post(`${API_URL}/custom/machines/assignments/parts/${assignmentPartId}/complete`, data);
    return response.data;
  },

  // Удалить деталь из задания
  deleteDetail: async (assignmentPartId: number) => {
    const response = await axios.delete(`${API_URL}/custom/machines/assignments/parts/${assignmentPartId}`);
    return response.data;
  },

  // Переназначить поддон на другой станок
  reassignPallet: async (assignmentId: number, data: ReassignRequest) => {
    const response = await axios.put(`${API_URL}/custom/machines/assignments/${assignmentId}/reassign`, data);
    return response.data;
  }
};
