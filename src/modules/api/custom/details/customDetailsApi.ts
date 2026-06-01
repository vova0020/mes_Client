import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface CustomPart {
  customPartId: number;
  customOrderId: number;
  partCode: string;
  partName: string;
  materialName: string;
  materialSku: string;
  thickness: number;
  thicknessWithEdging: number;
  quantity: number;
  distributedQuantity?: number;
  undistributedQuantity?: number;
  blankLength: number;
  blankWidth: number;
  finishedLength: number;
  finishedWidth: number;
  groove: string | null;
  edgingSkuL1: string | null;
  edgingNameL1: string | null;
  status: string;
  route: {
    routeId: number;
    routeName: string;
    routeStages: any[];
  };
  pallets: any[];
}

export interface OrderDetailsResponse {
  orderId: number;
  orderNumber: string;
  orderName: string;
  totalParts: number;
  parts: CustomPart[];
}

export const customDetailsApi = {
  getOrderDetails: async (orderId: number): Promise<OrderDetailsResponse> => {
    const response = await axios.get(`${API_URL}/custom-orders/${orderId}/details`);
    return response.data;
  }
};
