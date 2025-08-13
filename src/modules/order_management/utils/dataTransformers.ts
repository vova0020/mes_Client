// src/modules/order_management/utils/dataTransformers.ts
import { Order, OrderDetailsResponse, OrderPackage, OrderDetail } from '../../api/orderManagementApi';

// Типы для компонента OrderPlanning
export interface OrderPlanningData {
  id: string;
  name: string;
  requiredDate: string;
  status: 'preliminary' | 'approved' | 'allowedToStart' | 'inProgress' | 'completed';
  mainFlowId: string;
  secondaryFlowCompletionDate: string;
  startDate: string;
  plannedStartDate: string;
  actualStartDate: string;
  plannedReleaseDate: string;
  actualReleaseDate: string;
  packages: Package[];
  priority?: number;
}

export interface Package {
  id: string;
  name: string;
  quantity: number;
  details: Detail[];
  articleNumber: string;
}

export interface Detail {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  articleNumber: string;
}

// Маппинг статусов API к статусам компонента
const statusMapping: Record<string, 'preliminary' | 'approved' | 'allowedToStart' | 'inProgress' | 'completed'> = {
  'PRELIMINARY': 'preliminary',
  'APPROVED': 'approved',
  'LAUNCH_PERMITTED': 'allowedToStart',
  'IN_PROGRESS': 'inProgress',
  'COMPLETED': 'completed',
  'POSTPONED': 'preliminary',
};

// Обратный маппинг статусов компонента к статусам API
const reverseStatusMapping = {
  'preliminary': 'PRELIMINARY' as const,
  'approved': 'APPROVED' as const,
  'allowedToStart': 'LAUNCH_PERMITTED' as const,
  'inProgress': 'IN_PROGRESS' as const,
  'completed': 'COMPLETED' as const,
};

// Преобразование заказа из API в формат компонента
export const transformOrderToPlanning = (order: Order): OrderPlanningData => {
  const result = {
    id: order.orderId.toString(),
    name: order.orderName,
    requiredDate: order.requiredDate.split('T')[0], // Преобразуем ISO дату в YYYY-MM-DD
    status: statusMapping[order.status] || 'preliminary',
    mainFlowId: '1', // По умолчанию, можно настроить логику
    secondaryFlowCompletionDate: '', // Нужно добавить в API или вычислить
    startDate: order.createdAt.split('T')[0],
    plannedStartDate: order.createdAt.split('T')[0],
    actualStartDate: order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' ? order.createdAt.split('T')[0] : '',
    plannedReleaseDate: order.requiredDate.split('T')[0],
    actualReleaseDate: order.completedAt ? order.completedAt.split('T')[0] : '',
    packages: [], // Будет заполнено при получении деталей
    priority: order.priority,
  };
  
  console.log(`Transform order ${order.orderId}: priority ${order.priority} -> ${result.priority}`);
  return result;
};

// Преобразование деталей заказа из API в формат компонента
export const transformOrderDetailsToPlanning = (orderDetails: OrderDetailsResponse): OrderPlanningData => {
  const baseOrder = transformOrderToPlanning({
    orderId: orderDetails.order.orderId,
    batchNumber: orderDetails.order.batchNumber,
    orderName: orderDetails.order.orderName,
    completionPercentage: orderDetails.order.completionPercentage,
    createdAt: orderDetails.order.createdAt,
    completedAt: orderDetails.order.completedAt,
    requiredDate: orderDetails.order.requiredDate,
    status: orderDetails.order.status,
    launchPermission: orderDetails.order.launchPermission,
    isCompleted: orderDetails.order.isCompleted,
    packagesCount: orderDetails.packages.length,
    totalPartsCount: orderDetails.packages.reduce((total, pkg) => total + pkg.details.length, 0),
    priority: (orderDetails.order as any).priority,
  });

  // Преобразуем упаковки
  const packages: Package[] = orderDetails.packages.map(pkg => ({
    id: pkg.packageId.toString(),
    name: pkg.packageName,
    quantity: pkg.quantity,
    articleNumber: `PKG-${pkg.packageId.toString().padStart(3, '0')}`,
    details: pkg.details.map(detail => ({
      id: detail.partId.toString(),
      name: detail.partName,
      quantity: detail.totalQuantity,
      unit: 'шт', // По умолчанию, можно добавить в API
      articleNumber: `ART-${detail.partId.toString().padStart(3, '0')}`,
    })),
  }));

  return {
    ...baseOrder,
    packages,
    priority: baseOrder.priority,
  };
};

// Преобразование статуса компонента в статус API
export const transformStatusToApi = (status: OrderPlanningData['status']) => {
  return reverseStatusMapping[status];
};

// Получение текста статуса на русском
export const getStatusText = (status: OrderPlanningData['status']) => {
  switch (status) {
    case 'preliminary': return 'Предварительный';
    case 'approved': return 'Утверждено';
    case 'allowedToStart': return 'Разрешено к запуску';
    case 'inProgress': return 'В работе';
    case 'completed': return 'Завершен';
    default: return status;
  }
};

// Проверка возможности разрешения к запуску
export const canApproveForLaunch = (status: OrderPlanningData['status']) => {
  return status === 'approved';
};

// Проверка возможности запуска производства
export const canStartProduction = (status: OrderPlanningData['status']) => {
  return status === 'allowedToStart';
};

// Проверка возможности завершения
export const canComplete = (status: OrderPlanningData['status']) => {
  return status === 'inProgress';
};