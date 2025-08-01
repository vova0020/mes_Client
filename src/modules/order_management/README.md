# Модуль управления заказами - Интеграция с API

## Обзор

Этот модуль обеспечивает интеграцию фронтенда с бекенд API для управления заказами. Включает в себя API клиент, хуки для React и утилиты для преобразования данных.

## Структура файлов

```
src/modules/order_management/
├── components/
│   └── blocks/
│       └── OrderPlanning.tsx          # Основной компонент планирования заказов
├── utils/
│   └── dataTransformers.ts           # Утилиты для преобразования данных
└── README.md                         # Этот файл

src/modules/api/
└── orderManagementApi/
    └── index.ts                      # API клиент для управления заказами

src/modules/hooks/
└── orderManagementHook/
    └── index.ts                      # React хуки для работы с API
```

## API Endpoints

Модуль работает с следующими эндпоинтами:

- `GET /order-management` - Получение списка всех заказов
- `GET /order-management/:id` - Получение детальной информации о заказе
- `PATCH /order-management/:id/status` - Изменение статуса заказа

## Использование

### 1. Базовое использование хука

```tsx
import { useOrderManagement } from '../../../hooks';

const MyComponent = () => {
  const {
    orders,
    loading,
    error,
    approveOrderForLaunch,
    refetchOrders
  } = useOrderManagement();

  const handleApprove = async (orderId: number) => {
    const result = await approveOrderForLaunch(orderId);
    if (result) {
      console.log('Заказ разрешен к запуску');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      {orders.map(order => (
        <div key={order.orderId}>
          <h3>{order.orderName}</h3>
          <p>Статус: {order.status}</p>
          {order.status === 'APPROVED' && (
            <button onClick={() => handleApprove(order.orderId)}>
              Разрешить к запуску
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

### 2. Работа с деталями заказа

```tsx
import { useOrderDetails } from '../../../hooks';

const OrderDetailsComponent = ({ orderId }: { orderId: number }) => {
  const { orderDetails, loading, error } = useOrderDetails(orderId);

  if (loading) return <div>Загрузка деталей...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!orderDetails) return <div>Заказ не найден</div>;

  return (
    <div>
      <h2>{orderDetails.order.orderName}</h2>
      <p>Прогресс: {orderDetails.order.completionPercentage}%</p>
      
      <h3>Упаковки:</h3>
      {orderDetails.packages.map(pkg => (
        <div key={pkg.packageId}>
          <h4>{pkg.packageName}</h4>
          <p>Количество: {pkg.quantity}</p>
          
          <h5>Детали:</h5>
          {pkg.details.map(detail => (
            <div key={detail.partId}>
              <span>{detail.partName}: {detail.totalQuantity}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

### 3. Прямое использование API

```tsx
import { orderManagementApi } from '../../api/orderManagementApi';

// Получение списка заказов
const orders = await orderManagementApi.getOrders();

// Получение деталей заказа
const orderDetails = await orderManagementApi.getOrderDetails(1);

// Изменение статуса заказа
const result = await orderManagementApi.updateOrderStatus(1, 'LAUNCH_PERMITTED');

// Разрешение к запуску
const result = await orderManagementApi.approveOrderForLaunch(1);
```

## Типы данных

### Order (Заказ)
```typescript
interface Order {
  orderId: number;
  batchNumber: string;
  orderName: string;
  completionPercentage: number;
  createdAt: string;
  completedAt?: string;
  requiredDate: string;
  status: OrderStatus;
  launchPermission: boolean;
  isCompleted: boolean;
  packagesCount: number;
  totalPartsCount: number;
}
```

### OrderStatus (Статус заказа)
```typescript
type OrderStatus = 
  | 'PRELIMINARY'     // Предварительный
  | 'APPROVED'        // Утверждено
  | 'LAUNCH_PERMITTED' // Разрешено к запуску
  | 'IN_PROGRESS'     // В работе
  | 'COMPLETED';      // Завершен
```

### OrderDetailsResponse (Детали заказа)
```typescript
interface OrderDetailsResponse {
  order: {
    orderId: number;
    batchNumber: string;
    orderName: string;
    completionPercentage: number;
    createdAt: string;
    completedAt?: string;
    requiredDate: string;
    status: OrderStatus;
    launchPermission: boolean;
    isCompleted: boolean;
  };
  packages: OrderPackage[];
}
```

## Доступные хуки

### useOrders()
Получение списка всех заказов.

**Возвращает:**
- `orders: Order[]` - Массив заказов
- `loading: boolean` - Состояние загрузки
- `error: string | null` - Ошибка, если есть
- `refetch: () => Promise<void>` - Функция для повторной загрузки

### useOrderDetails(orderId: number | null)
Получение деталей конкретного заказа.

**Параметры:**
- `orderId` - ID заказа или null

**Возвращает:**
- `orderDetails: OrderDetailsResponse | null` - Детали заказа
- `loading: boolean` - Состояние загрузки
- `error: string | null` - Ошибка, если есть
- `refetch: (() => Promise<void>) | undefined` - Функция для повторной загрузки

### useOrderStatusUpdate()
Хук для изменения статуса заказов.

**Возвращает:**
- `updateStatus: (orderId: number, status: OrderStatus) => Promise<StatusUpdateResponse | null>`
- `approveForLaunch: (orderId: number) => Promise<StatusUpdateResponse | null>`
- `startProduction: (orderId: number) => Promise<StatusUpdateResponse | null>`
- `completeOrder: (orderId: number) => Promise<StatusUpdateResponse | null>`
- `loading: boolean` - Состояние загрузки
- `error: string | null` - Ошибка, если есть

### useOrderManagement()
Комплексный хук, объединяющий все функции управления заказами.

**Возвращает:**
- Все данные и функции из предыдущих хуков
- `selectedOrderId: number | null` - ID выбранного заказа
- `setSelectedOrderId: (id: number | null) => void` - Функция для выбора заказа

## Преобразование данных

Модуль включает утилиты для преобразования данных между форматами API и компонентов:

```typescript
import { 
  transformOrderToPlanning,
  transformOrderDetailsToPlanning,
  transformStatusToApi,
  getStatusText 
} from '../../utils/dataTransformers';

// Преобразование заказа из API в формат компонента
const planningOrder = transformOrderToPlanning(apiOrder);

// Преобразование деталей заказа
const planningDetails = transformOrderDetailsToPlanning(apiOrderDetails);

// Преобразование статуса компонента в статус API
const apiStatus = transformStatusToApi('allowedToStart'); // 'LAUNCH_PERMITTED'

// Получение текста статуса на русском
const statusText = getStatusText('approved'); // 'Утверждено'
```

## Обработка ошибок

Все API вызовы включают обработку ошибок:

```typescript
try {
  const result = await orderManagementApi.updateOrderStatus(1, 'LAUNCH_PERMITTED');
  console.log('Успешно обновлено:', result);
} catch (error) {
  if (error.message.includes('404')) {
    console.error('Заказ не найден');
  } else if (error.message.includes('400')) {
    console.error('Недопустимый переход статуса');
  } else {
    console.error('Неизвестная ошибка:', error.message);
  }
}
```

## Конфигурация

Убедитесь, что в файле `src/modules/api/config.ts` правильно настроен `API_URL`:

```typescript
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

И что в `.env` файле установлена переменная:
```
REACT_APP_API_URL=http://localhost:5000
```

## Примеры использования в компонентах

### Простой список заказов
```tsx
import React from 'react';
import { useOrders } from '../../../hooks';

const OrdersList = () => {
  const { orders, loading, error } = useOrders();

  if (loading) return <div>Загрузка заказов...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Номер партии</th>
          <th>Название</th>
          <th>Статус</th>
          <th>Прогресс</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.orderId}>
            <td>{order.batchNumber}</td>
            <td>{order.orderName}</td>
            <td>{order.status}</td>
            <td>{order.completionPercentage}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Управление статусом заказа
```tsx
import React from 'react';
import { useOrderStatusUpdate } from '../../../hooks';

const OrderStatusManager = ({ orderId, currentStatus }) => {
  const { approveForLaunch, startProduction, completeOrder, loading, error } = useOrderStatusUpdate();

  const handleApprove = async () => {
    const result = await approveForLaunch(orderId);
    if (result) {
      alert('Заказ разрешен к запуску!');
    }
  };

  const handleStart = async () => {
    const result = await startProduction(orderId);
    if (result) {
      alert('Заказ запущен в производство!');
    }
  };

  const handleComplete = async () => {
    const result = await completeOrder(orderId);
    if (result) {
      alert('Заказ завершен!');
    }
  };

  return (
    <div>
      {error && <div style={{ color: 'red' }}>Ошибка: {error}</div>}
      
      {currentStatus === 'APPROVED' && (
        <button onClick={handleApprove} disabled={loading}>
          {loading ? 'Обработка...' : 'Разрешить к запуску'}
        </button>
      )}
      
      {currentStatus === 'LAUNCH_PERMITTED' && (
        <button onClick={handleStart} disabled={loading}>
          {loading ? 'Обработка...' : 'Запустить производство'}
        </button>
      )}
      
      {currentStatus === 'IN_PROGRESS' && (
        <button onClick={handleComplete} disabled={loading}>
          {loading ? 'Обработка...' : 'Завершить заказ'}
        </button>
      )}
    </div>
  );
};
```

## Отладка

Для отладки API вызовов можно использовать консоль браузера. Все ошибки логируются в консоль с подробной информацией.

Также можно включить дополнительное логирование в хуках:

```typescript
useEffect(() => {
  console.log('Orders updated:', orders);
}, [orders]);

useEffect(() => {
  console.log('Order details updated:', orderDetails);
}, [orderDetails]);
```

## Дальнейшее развитие

1. **WebSocket интеграция** - Для получения обновлений в реальном времени
2. **Кэширование** - Для улучшения производительности
3. **Оптимистичные обновления** - Для лучшего UX
4. **Пагинация** - Для больших списков заказов
5. **Фильтрация и поиск** - Для удобства работы с заказами