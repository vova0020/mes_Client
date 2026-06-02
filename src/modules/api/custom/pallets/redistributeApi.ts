import axios from 'axios';

import { API_URL } from '../../config';

export interface RedistributePart {
  customPartId: number;
  quantity: number;
}

export interface RedistributeRequest {
  fromPalletId: number;
  toPalletId?: number;
  newPalletName?: string;
  parts: RedistributePart[];
}

export interface RedistributeResponse {
  message: string;
  sourcePalletDeleted: boolean;
  targetPallet: {
    customPalletId: number;
    palletName: string;
    isActive: boolean;
    parts: {
      customPartId: number;
      partCode: string;
      partName: string;
      quantity: number;
    }[];
  };
}

export const redistributeApi = {
  redistributeParts: async (data: RedistributeRequest): Promise<RedistributeResponse> => {
    const response = await axios.put(`${API_URL}/custom-pallets/redistribute`, data);
    return response.data;
  }
};
