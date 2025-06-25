# Хуки модуля упаковки (Packaging Master Hooks)

Этот модуль содержит React хуки для работы с упаковками, деталями и поддонами в системе MES.

## Структура модуля

### 📦 usePackaging.ts
Хук для работы с упаковками:
- Управление состоянием списка упаковок
- Загрузка упаковок с фильтрами
- Получение упаковок по ID заказа
- Получение конкретной упаковки по ID

### 🔧 useParts.ts
Хук для работы с деталями упаковок:
- Управление состоянием деталей упаковки
- Загрузка деталей по ID упаковки
- Получение конкретной детали
- Статистика по деталям

### 🏗️ usePallets.ts
Хук для работы с поддонами:
- Управление состоянием поддонов детали
- Загрузка поддонов по ID детали
- Получение конкретного поддона
- Статистика по поддонам

### 📋 packagingMasterHook.tsx (устаревший)
Старый хук, оставлен для обратной совместимости. Рекомендуется использовать новые разделенные хуки.

## Использование

### usePackaging

```typescript
import { usePackaging } from '../hooks/ypakMasterHook';

const MyComponent = () => {
  const {
    packages,
    pagination,
    loading,
    error,
    fetchPackagesByOrderId,
    clearPackages
  } = usePackaging();

  useEffect(() => {
    if (orderId) {
      fetchPackagesByOrderId(orderId);
    }
  }, [orderId]);

  return (
    <div>
      {loading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error.message}</div>}
      {packages.map(pkg => (
        <div key={pkg.id}>{pkg.packageName}</div>
      ))}
    </div>
  );
};
```

### useParts

```typescript
import { useParts } from '../hooks/ypakMasterHook';

const PartsComponent = ({ packageId }) => {
  const {
    parts,
    packageInfo,
    partsCount,
    loading,
    error,
    fetchPartsByPackageId
  } = useParts();

  useEffect(() => {
    if (packageId) {
      fetchPartsByPackageId(packageId);
    }
  }, [packageId]);

  return (
    <div>
      <h2>{packageInfo?.packageName}</h2>
      <p>Деталей: {partsCount}</p>
      {parts.map(part => (
        <div key={part.partId}>{part.partName}</div>
      ))}
    </div>
  );
};
```

### usePallets

```typescript
import { usePallets } from '../hooks/ypakMasterHook';

const PalletsComponent = ({ partId }) => {
  const {
    pallets,
    partInfo,
    palletsCount,
    loading,
    error,
    fetchPalletsByPartId
  } = usePallets();

  useEffect(() => {
    if (partId) {
      fetchPalletsByPartId(partId);
    }
  }, [partId]);

  return (
    <div>
      <h2>Поддоны для {partInfo?.partName}</h2>
      <p>Поддонов: {palletsCount}</p>
      {pallets.map(pallet => (
        <div key={pallet.palletId}>{pallet.palletName}</div>
      ))}
    </div>
  );
};
```

## Возвращаемые значения

### usePackaging
- `packages` - массив упаковок
- `pagination` - информация о пагинации
- `loading` - состояние загрузки
- `error` - ошибка загрузки
- `fetchPackages()` - загрузка упаковок с фильтрами
- `fetchPackagesByOrderId()` - загрузка упаковок по ID заказа
- `fetchPackageById()` - загрузка конкретной упаковки
- `clearPackages()` - очистка списка упаковок

### useParts
- `parts` - массив деталей
- `packageInfo` - информация об упаковке
- `partsCount` - количество деталей
- `pagination` - информация о пагинации
- `statistics` - статистика по деталям
- `loading` - состояние загрузки
- `error` - ошибка загрузки
- `fetchPartsByPackageId()` - загрузка деталей упаковки
- `fetchPartFromPackage()` - загрузка конкретной детали
- `fetchPartsStatistics()` - загрузка статистики
- `clearParts()` - очистка данных о деталях

### usePallets
- `pallets` - массив поддонов
- `partInfo` - информация о детали
- `palletsCount` - количество поддонов
- `pagination` - информация о пагинации
- `statistics` - статистика по поддонам
- `loading` - состояние загрузки
- `error` - ошибка загрузки
- `fetchPalletsByPartId()` - загрузка поддонов детали
- `fetchPalletByPartAndPalletId()` - загрузка конкрет��ого поддона
- `fetchPalletsStatistics()` - загрузка статистики
- `clearPallets()` - очистка данных о поддонах

## Миграция

При переходе с старого хука на новые:

1. Замените импорты:
   ```typescript
   // Старый способ
   import usePackagingDetails from '../hooks/ypakMasterHook/packagingMasterHook';
   
   // Новый способ
   import { usePackaging } from '../hooks/ypakMasterHook';
   ```

2. Обновите использование:
   ```typescript
   // Старый способ
   const { packagingItems, fetchPackagingItems } = usePackagingDetails();
   
   // Новый способ
   const { packages, fetchPackagesByOrderId } = usePackaging();
   ```