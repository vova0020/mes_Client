/**
 * API для управления индивидуальным производством
 */

interface Part {
  partSku: number | null;
  partName: string;
  partCode: string;
  materialName: string;
  materialSku: number | string;
  thickness: number | null;
  thicknessWithEdging: number | null;
  quantity: number;
  blankLength: number | null;
  blankWidth: number | null;
  finishedLength: number | null;
  finishedWidth: number | null;
  groove: string | null;
  edgingSkuL1: number | string | null;
  edgingNameL1: string | null;
  edgingSkuL2: number | string | null;
  edgingNameL2: string | null;
  edgingSkuW1: number | string | null;
  edgingNameW1: string | null;
  edgingSkuW2: number | string | null;
  edgingNameW2: string | null;
  plasticFace: string | null;
  plasticFaceSku: number | null;
  plasticBack: string | null;
  plasticBackSku: number | null;
  additionalMaterial: string | null;
  pf: string | null;
  pfSku: number | null;
  sbPart: string | null;
  pfSb: string | null;
  sbPartSku: number | null;
  conveyorPosition: number | null;
}

interface UploadResponse {
  success: boolean;
  data: {
    parts: Part[];
  };
  message?: string;
}

interface SaveOrderRequest {
  orderNumber: string;
  orderName: string;
  requiredDate: string;
  parts: (Part & { routeId?: number })[];
  priority: number;
}

interface SavePartRequest {
  partCode: string;
  partName: string;
  quantity: number;
  materialSku: number | string;
  thickness?: number | null;
  blankLength?: number | null;
  blankWidth?: number | null;
  finishedLength?: number | null;
  finishedWidth?: number | null;
  edgingSkuL1?: number | string | null;
  edgingSkuL2?: number | string | null;
  edgingSkuW1?: number | string | null;
  edgingSkuW2?: number | string | null;
}

interface SaveOrderResponse {
  success: boolean;
  data?: {
    orderId: number;
  };
  message?: string;
}

/**
 * Загрузка и парсинг Excel файла для индивидуального производства
 */
export const uploadCustomOrderFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${import.meta.env.VITE_API_URL}/custom-order-management/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ошибка при загрузке файла');
  }

  const result = await response.json();
  
  // Если сервер не возвращает поле success, добавляем его
  if (result.data && result.data.parts) {
    return {
      success: true,
      data: result.data,
      message: result.message
    };
  }
  
  return result;
};

/**
 * Сохранение заказа индивидуального производства из файла
 */
export const saveCustomOrderFromFile = async (orderData: SaveOrderRequest): Promise<SaveOrderResponse> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/custom-order-management/save-from-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ошибка при сохранении заказа');
  }

  return response.json();
};

export type { Part, UploadResponse, SaveOrderRequest, SaveOrderResponse };
