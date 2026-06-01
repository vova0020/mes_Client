import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface CreateAssignmentRequest {
  machineId: number;
  customPalletId: number;
  stageId: number;
  priority?: number;
}

export const machineAssignmentApi = {
  createAssignment: async (data: CreateAssignmentRequest) => {
    const response = await axios.post(`${API_URL}/custom/machines/assignments`, data);
    return response.data;
  }
};
