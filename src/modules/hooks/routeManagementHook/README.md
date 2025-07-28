# Хуки для управления маршрутами (Route Management Hooks)

Этот модуль предоставляет React хуки для работы с управлением маршрутами деталей в производственных заказах.

## Структура модуля

```
routeManagementHook/
├── useRouteManagement.tsx           # Основной хук для управления маршрутами
├── useRouteManagementWebSocket.tsx  # Хук для WebSocket событий
├── index.ts                        # Экспорты модуля
└── README.md                       # Документация
```

## useRouteManagement

Основной хук для работы с управлением маршрутами.

### Использование

```typescript
import { useRouteManagement } from '../../../hooks';

const MyComponent = () => {
  const {
    routes,
    orders,
    selectedOrderParts,
    routesLoading,
    ordersLoading,
    partsLoading,
    updatingRoute,
    routesError,
    ordersError,
    partsError,
    updateError,
    fetchOrderParts,
    updatePartRoute,
    clearOrderParts,
    clearErrors
  } = useRouteManagement();

  // Использование данных и методов...
};
```

### Параметры

- `autoFetchRoutes` (boolean, по умолчанию true) - Автоматически загружать маршруты при инициализации
- `autoFetchOrders` (boolean, по умолчанию true) - Автоматически загружать заказы при инициализации

### Возвращаемые данные

#### Данные
- `routes` - Массив доступных маршрутов
- `orders` - Массив заказов для управления маршрутами
- `selectedOrderParts` - Данные о деталях выбранного заказа

#### Состояния загрузки
- `routesLoading` - Состояние загрузки маршрутов
- `ordersLoading` - Состояние загрузки заказов
- `partsLoading` - Сост��яние загрузки деталей заказа
- `updatingRoute` - Состояние обновления маршрута

#### Ошибки
- `routesError` - Ошибка при загрузке маршрутов
- `ordersError` - Ошибка при загрузке заказов
- `partsError` - Ошибка при загрузке деталей
- `updateError` - Ошибка при обновлении маршрута

#### Методы
- `fetchRoutes()` - Загрузить маршруты
- `fetchOrders()` - Загрузить заказы
- `fetchOrderParts(orderId)` - Загрузить детали заказа
- `updatePartRoute(partId, routeId)` - Изменить маршрут детали
- `clearOrderParts()` - Очистить данные о деталях заказа
- `clearErrors()` - Очистить все ошибки

## useRouteManagementWebSocket

Хук для работы с WebSocket событиями обновления маршрутов.

### Использование

```typescript
import { useRouteManagementWebSocket, PartRouteUpdatedEvent } from '../../../hooks';

const MyComponent = () => {
  const handlePartRouteUpdated = (event: PartRouteUpdatedEvent) => {
    console.log('Маршрут детали обно��лен:', event);
    // Обработка события...
  };

  useRouteManagementWebSocket(handlePartRouteUpdated, true);

  // Остальная логика компонента...
};
```

### Параметры

- `onPartRouteUpdated` (PartRouteUpdatedHandler) - Обработчик события обновления маршрута
- `enabled` (boolean, по умолчанию true) - Включить/выключить подписку на события

### События

#### PartRouteUpdatedEvent
Событие обновления маршрута детали:
```typescript
interface PartRouteUpdatedEvent {
  orderId: number;
  batchNumber: string;
  partRouteUpdate: {
    partId: number;
    partCode: string;
    partName: string;
    previousRoute: RouteInfoDto;
    newRoute: RouteInfoDto;
    updatedAt: string;
  };
  timestamp: string;
}
```

## Пример полной интеграции

```typescript
import React, { useState } from 'react';
import { 
  useRouteManagement, 
  useRouteManagementWebSocket,
  PartRouteUpdatedEvent 
} from '../../../hooks';

const RouteManagementComponent = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const {
    orders,
    selectedOrderParts,
    ordersLoading,
    partsLoading,
    fetchOrderParts,
    updatePartRoute
  } = useRouteManagement();

  const handlePartRouteUpdated = (event: PartRouteUpdatedEvent) => {
    // Если обновлен заказ, который мы сейчас просматриваем
    if (selectedOrderId === event.orderId) {
      fetchOrderParts(event.orderId); // Обновляем данные
    }
  };

  useRouteManagementWebSocket(handlePartRouteUpdated, true);

  const handleOrderSelect = async (orderId: number) => {
    setSelectedOrderId(orderId);
    await fetchOrderParts(orderId);
  };

  const handleRouteChange = async (partId: number, routeId: number) => {
    try {
      await updatePartRoute(partId, routeId);
      console.log('Маршрут успешно изменен');
    } catch (error) {
      console.error('Ошибка при изменении маршрута:', error);
    }
  };

  return (
    <div>
      {/* UI компонента */}
    </div>
  );
};
```

## Зависимости

- React (useState, useEffect, useCallback)
- routeManagementApi - для API вызовов
- WebSocket API - для real-time обновлений