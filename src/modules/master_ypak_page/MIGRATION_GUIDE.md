# Руководство по миграции модуля упаковки

Этот документ описывает изменения в архитектуре модуля упаковки и инструкции по миграции.

## Что изменилось

### Старая архитектура
- Один большой API файл `packagingMasterApi.ts`
- Один большой хук `packagingMasterHook.tsx`
- Смешанная логика для упаковок, деталей и поддонов

### Новая архитектура
- Разделенные API файлы по логическим группам:
  - `packagingApi.ts` - работа с упаковками
  - `partsApi.ts` - работа с деталями
  - `palletsApi.ts` - работа с поддонами
- Разделенные хуки по логическим группам:
  - `usePackaging.ts` - хук для упаковок
  - `useParts.ts` - хук для деталей
  - `usePallets.ts` - хук для поддонов
- Четкое разделени�� ответственности
- Соответствие API документации

## Преимущества новой архитектуры

1. **Модульность** - каждый модуль отвечает за свою область
2. **Переиспользование** - хуки можно использовать независимо
3. **Типизация** - улучшенная типизация согласно API документации
4. **Читаемость** - код легче понимать и поддерживать
5. **Тестируемость** - проще писать тесты для отдельных модулей

## Миграция компонентов

### MasterYpackDetailsYpackTable.tsx

#### Было:
```typescript
import usePackagingDetails from '../../../hooks/ypakMasterHook/packagingMasterHook';

const { 
  packagingItems, 
  workers, 
  loading, 
  error, 
  fetchPackagingItems,
  assignWorker,
  toggleAllowOutsidePacking,
  updateStatus
} = usePackagingDetails();

// Использование
fetchPackagingItems(selectedOrderId);
```

#### Стало:
```typescript
import { usePackaging } from '../../../hooks/ypakMasterHook';

const { 
  packages, 
  loading, 
  error, 
  fetchPackagesByOrderId,
  clearPackages
} = usePackaging();

// Использование
if (selectedOrderId !== null) {
  fetchPackagesByOrderId(selectedOrderId);
} else {
  clearPackages();
}
```

### PackagingDetailsSidebar.tsx

#### Было:
```typescript
// Моковые данные
const [details] = useState<Detail[]>([...]);
const [palletsForDetail, setPalletsForDetail] = useState<PalletForDetail[]>([]);

// Моковые функции
const getPalletsForDetail = (detailId: number) => { ... };
```

#### Стало:
```typescript
import { useParts, usePallets } from '../../../hooks/ypakMasterHook';

// Реальные данные из API
const {
  parts,
  packageInfo,
  loading: partsLoading,
  error: partsError,
  fetchPartsByPackageId,
  clearParts
} = useParts();

const {
  pallets,
  partInfo,
  loading: palletsLoading,
  error: palletsError,
  fetchPalletsByPartId,
  clearPallets
} = usePallets();

// Использование
useEffect(() => {
  if (isOpen && selectedPackageId) {
    fetchPartsByPackageId(selectedPackageId);
  }
}, [isOpen, selectedPackageId]);

const handleDetailClick = (partId: number) => {
  if (selectedDetailId === partId) {
    clearPallets();
  } else {
    fetchPalletsByPartId(partId);
  }
};
```

## Обновленные интерфейсы данных

### Упаковки
```typescript
// Старый интерфейс
interface PackagingDataDto {
  id: number;
  article: string;
  name: string;
  totalQuantity: number;
  // ...
}

// Новый интерфейс (согласно API документации)
interface PackageDto {
  id: number;
  orderId: number;
  packageCode: string;
  packageName: string;
  completionPercentage: number;
  order: {
    orderName: string;
    batchNumber: string;
    isCompleted?: boolean;
  };
  parts: PartInPackageDto[];
}
```

### Детали
```typescript
interface PartDto {
  partId: number;
  partCode: string;
  partName: string;
  status: string;
  totalQuantity: number;
  requiredQuantity: number;
  isSubassembly: boolean;
  readyForMainFlow: boolean;
  size: string;
  material: MaterialDto;
  route: RouteDto;
  pallets?: PalletInPartDto[];
  routeProgress?: RouteProgressDto[];
}
```

### Поддоны
```typescript
interface PalletDto {
  palletId: number;
  palletName: string;
  currentCell?: CellDto;
  placedAt?: Date;
  machineAssignments: MachineAssignmentDto[];
  stageProgress: StageProgressDto[];
}
```

## Пошаговая миграция

1. **Обновите импорты** в компонентах
2. **Замените старые хуки** на новые
3. **Обновите интерфейсы** данных
4. **Протестируйте** функциональность
5. **Удалите** старые файлы (после полной миграции)

## Обратная совместимость

Старые файлы оставлены для обратной совместимости:
- `packagingMasterApi.ts` - экспортируется через `index.ts`
- `packagingMasterHook.tsx` - экспортируется через `index.ts`

Это позволяет постепенно мигрировать компоненты без поломки существующего функционала.

## Следующие шаги

1. Протестировать новую архитектуру
2. Добавить недостающие API функции (назначение упаковщиков, обновление статусов)
3. Добавить обработку ошибок и валидацию
4. Написать unit тесты для новых модулей
5. Удалить старые файлы после полной миграции