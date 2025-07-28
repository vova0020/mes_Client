# Интеграция модуля управления маршрутами с бекендом

Этот документ описывает интеграцию модуля управления маршрутами деталей с бекендом API.

## Обзор изменений

Модуль `DetailRouteManagement` был полностью переработан для работы с реальным API вместо моковых данных.

### Созданные файлы

#### API модуль
- `src/modules/api/routeManagementApi/routeManagementApi.ts` - Основной API модуль
- `src/modules/api/routeManagementApi/index.ts` - Экспорты API модуля
- `src/modules/api/routeManagementApi/README.md` - Документация API

#### Хуки
- `src/modules/hooks/routeManagementHook/useRouteManagement.tsx` - Основной хук
- `src/modules/hooks/routeManagementHook/useRouteManagementWebSocket.tsx` - WebSocket хук
- `src/modules/hooks/routeManagementHook/index.ts` - Экспорты хуков
- `src/modules/hooks/routeManagementHook/README.md` - Документация хуков

#### Обновленные файлы
- `src/modules/hooks/index.ts` - Добавлены экспорты новых хуков
- `src/modules/order_management/components/blocks/DetailRouteManagement.tsx` - Полностью переработан

## Функциональность

### 1. Загрузка данных
- **Маршруты**: Автоматическая загрузка всех доступных маршрутов при инициализации
- **Заказы**: Загрузка заказов со статусами "Предварительный" и "Утверждено"
- **Детали заказа**: Загрузка деталей выбранного заказа с текущими маршрутами

### 2. Изменение маршрутов
- Выбор нового маршрута из выпадающего списка
- Валидация и отправка изменений на сервер
- Обновление локального состояния после успешного изменения

### 3. Real-time обновления
- WebSocket подключение для получения уведомлений об изменениях
- Автоматическое обновление данных при изменениях другими пользователями
- Уведомления о внешних изменениях

### 4. Обработка ошибок
- Централизованная обработка ошибок API
- Пользовательские уведомления об ошибках
- Состояния загрузки для улучшения UX

## API Endpoints

Модуль использует следующие endpoints согласно документации:

### GET /route-management/routes
Получение всех доступных маршрутов
```typescript
Response: RouteInfoDto[]
```

### GET /route-management/orders
Получение заказов для управления маршрутами
```typescript
Response: OrderForRoutesResponseDto[]
```

### GET /route-management/orders/:orderId/parts
Получение деталей заказа
```typescript
Response: OrderPartsResponseDto
```

### PATCH /route-management/parts/:partId/route
Изменение маршрута детали
```typescript
Body: { routeId: number }
Response: UpdatePartRouteResponseDto
```

## WebSocket события

### partRouteUpdated
Событие изменения маршрута детали:
```typescript
{
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

## Конфигурация

### Переменные окружения
Убедитесь, что настроены следующие переменные:

```env
REACT_APP_API_URL=http://localhost:3000  # URL вашего API сервера
REACT_APP_WS_URL=ws://localhost:3001     # URL WebSocket сервера (опционально)
```

### Настройка WebSocket
WebSocket хук автоматически подключается к серверу и переподключается при разрыве соединения. Если WebSocket не используется, можно отключить его передав `false` в качестве второго параметра:

```typescript
useRouteManagementWebSocket(handlePartRouteUpdated, false);
```

## Использование в компонентах

### Базовое использование
```typescript
import { useRouteManagement } from '../../../hooks';

const MyComponent = () => {
  const {
    orders,
    selectedOrderParts,
    fetchOrderParts,
    updatePartRoute
  } = useRouteManagement();

  // Логика компонента...
};
```

### С WebSocket
```typescript
import { 
  useRouteManagement, 
  useRouteManagementWebSocket,
  PartRouteUpdatedEvent 
} from '../../../hooks';

const MyComponent = () => {
  const { /* ... */ } = useRouteManagement();
  
  const handlePartRouteUpdated = (event: PartRouteUpdatedEvent) => {
    // Обработка real-time обновлений
  };
  
  useRouteManagementWebSocket(handlePartRouteUpdated, true);
};
```

## Типы данных

Все типы данных соответствуют спецификации API и включают:

- `RouteInfoDto` - Информация о маршруте
- `OrderForRoutesResponseDto` - Данные заказа
- `PartForRouteManagementDto` - Данные детали
- `UpdatePartRouteDto` - DTO для изменения маршрута
- `UpdatePartRouteResponseDto` - Ответ при изменении маршрута

## Обработка состояний

Хук предоставляет детальную информацию о состояниях:

- **Загрузка**: `routesLoading`, `ordersLoading`, `partsLoading`, `updatingRoute`
- **Ошибки**: `routesError`, `ordersError`, `partsError`, `updateError`
- **Данные**: `routes`, `orders`, `selectedOrderParts`

## Тестирование

Для тестирования интеграции:

1. Убедитесь, что API сервер запущен и доступен
2. Проверьте правильность URL в переменных окружения
3. Откройте компонент управления маршрутами
4. Проверьте загрузку заказов и маршрутов
5. Выберите заказ и проверьте загрузку деталей
6. Попробуйте изменить маршрут детали
7. Проверьте WebSocket уведомления (если используются)

## Возможные проблемы

### CORS ошибки
Убедитесь, что CORS настроен на сервере для разрешения запросов с фронтенда.

### WebSocket подключение
Если WebSocket не подключается, проверьте:
- Правильность URL WebSocket сервера
- Настройки файрвола
- Поддержку WebSocket на сервере

### Ошибки API
Проверьте:
- Доступность API endpoints
- Правильность структуры данных
- Аутентификацию (если требуется)

## Дальнейшее развитие

Модуль готов для расширения следующими функциями:
- Массовое изменение маршрутов
- Фильтрация и поиск заказов
- Экспорт данных
- Аудит изменений маршрутов
- Уведомления по email/SMS