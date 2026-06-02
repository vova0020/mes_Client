import axios from 'axios';

import { API_URL } from '../../config';

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
