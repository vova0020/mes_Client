# API модуль управления маршрутами (Route Management API)

Этот модуль предоставляет интерфейс для работы с API управления маршрутами деталей в производственных заказах.

## Структура модуля

```
routeManagementApi/
├── routeManagementApi.ts  # Основной API модуль
├── index.ts              # Экспорты модуля
└── README.md            # Документация
```

## Основные функции

### 1. Получение маршрутов
```typescript
const routes = await routeManagementApi.getRoutes();
```

### 2. Получение заказов для управления маршрутами
```typescript
const orders = await routeManagementApi.getOrders();
```

### 3. Получение деталей заказ��
```typescript
const orderParts = await routeManagementApi.getOrderParts(orderId);
```

### 4. Изменение маршрута детали
```typescript
const result = await routeManagementApi.updatePartRoute(partId, { routeId: newRouteId });
```

## Типы данных

### RouteInfoDto
Информация о маршруте с этапами:
```typescript
interface RouteInfoDto {
  routeId: number;
  routeName: string;
  stages: {
    routeStageId: number;
    stageName: string;
    substageName?: string;
    sequenceNumber: number;
  }[];
}
```

### OrderForRoutesResponseDto
Информация о заказе для управления маршрутами:
```typescript
interface OrderForRoutesResponseDto {
  orderId: number;
  batchNumber: string;
  orderName: string;
  status: 'PRELIMINARY' | 'APPROVED';
  requiredDate: string;
  createdAt: string;
  totalParts: number;
}
```

### PartForRouteManagementDto
Информация о детали с текущим маршрутом:
```typescript
interface PartForRouteManagementDto {
  partId: number;
  partCode: string;
  partName: string;
  totalQuantity: number;
  status: string;
  currentRoute: RouteInfoDto;
  size: string;
  materialName: string;
  packages: PackageInfo[];
}
```

## Обработка ошибок

Все методы API могут выбрасывать исключения. Рекомендуется использовать try-catch блоки:

```typescript
try {
  const result = await routeManagementApi.updatePartRoute(partId, { routeId });
  console.log('Маршрут успешно изменен:', result);
} catch (error) {
  console.error('Ошибка при изменении маршрута:', error);
}
```

## Интеграция с хуками

Этот API модуль используется в хуке `useRouteManagement` для удобной работы с состоянием и данными в React компонентах.

## Зависимости

- axios - для HTTP запросов
- config.ts - для получения базового URL API