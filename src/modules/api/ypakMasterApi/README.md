# API модуля упаковки (Packaging Master API)

Этот модуль содержит API функции для работы с упаковками, деталями и поддонами в системе MES.

## Структура модуля

### 📦 packagingApi.ts
Содержит функции для работы с упаковками:
- `getPackages()` - получение списка упаковок с фильтрами
- `getPackagesByOrderId()` - получение упаковок по ID заказа
- `getPackageById()` - получение упаковки по ID

### 🔧 partsApi.ts
Содержит функции для работы с деталями упаковок:
- `getPartsByPackageId()` - получение всех деталей упаковки
- `getPartFromPackage()` - получение конкретной детали из упаковки
- `getPartsStatistics()` - получение статистики по деталям упаковки

### 🏗️ palletsApi.ts
Содержит функции для работы с по��донами:
- `getPalletsByPartId()` - получение всех поддонов детали
- `getPalletByPartAndPalletId()` - получение конкретного поддона
- `getPalletsStatistics()` - получение статистики по поддонам детали

### 📋 packagingMasterApi.ts (устаревший)
Старый API файл, оставлен для обратной совместимости. Рекомендуется использовать новые разделенные API.

## Использование

```typescript
import { packagingApi, partsApi, palletsApi } from '../api/ypakMasterApi';

// Получение упаковок по заказу
const packages = await packagingApi.getPackagesByOrderId(123);

// Получение деталей упаковки
const parts = await partsApi.getPartsByPackageId(456);

// Получение поддонов детали
const pallets = await palletsApi.getPalletsByPartId(789);
```

## Типы данных

Все интерфейсы и типы данных определены в соответствующих API файлах и соответствуют документации API в `docs/API_Documentation_Frontend.md`.

## Миграция

При переходе с старого API на новый:

1. Замени��е импорты:
   ```typescript
   // Старый способ
   import { fetchPackagingByOrderId } from '../api/ypakMasterApi/packagingMasterApi';
   
   // Новый способ
   import { packagingApi } from '../api/ypakMasterApi';
   ```

2. Обновите вызовы функций:
   ```typescript
   // Старый способ
   const data = await fetchPackagingByOrderId(orderId);
   
   // Новый способ
   const response = await packagingApi.getPackagesByOrderId(orderId);
   const data = response.packages;
   ```