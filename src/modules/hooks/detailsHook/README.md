# useDetails Hook

React хук для работы с деталями в системе MES.

## Структура

```
detailsHook/
├── useDetails.tsx   # Основной хук
├── index.ts         # Экспорты
└── README.md        # Документация
```

## Использование

### Базовое использование

```typescript
import { useDetails } from '../hooks/detailsHook';

const MyComponent = () => {
  const packageId = 1;
  const {
    details,
    loading,
    error,
    createDetail,
    updateDetail,
    deleteDetail,
    copyDetail
  } = useDetails(packageId);

  if (loading === 'loading') return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  return (
    <div>
      {details.map(detail => (
        <div key={detail.id}>{detail.partName}</div>
      ))}
    </div>
  );
};
```

### Без автоматической загрузки

```typescript
const {
  details,
  fetchDetailsByPackage,
  createDetail
} = useDetails(); // бе�� packageId

// Загрузка по требованию
const handleLoadDetails = () => {
  fetchDetailsByPackage(packageId);
};
```

## API хука

### Состояние

- `details: Detail[]` - массив деталей
- `loading: LoadingState` - состояние загрузки ('idle' | 'loading' | 'success' | 'error')
- `error: Error | null` - ошибка, если есть
- `selectedDetail: Detail | null` - выбранная деталь

### Операции CRUD

- `createDetail(createDto: CreateDetailDto): Promise<Detail>` - создание детали
- `updateDetail(id: number, updateDto: UpdateDetailDto): Promise<Detail>` - обновление детали
- `deleteDetail(id: number): Promise<void>` - удаление детали
- `copyDetail(id: number): Promise<Detail>` - копирование детали
- `fetchDetailsByPackage(packageId: number): Promise<void>` - загрузка деталей по упаковке

### Управление выбором

- `selectDetail(detailId: number | null): void` - выбор детали
- `clearSelection(): void` - сброс выбора

### Состояния операций

- `isCreating: boolean` - идет создание детали
- `isUpdating: boolean` - идет обновление детали
- `isDeleting: boolean` - идет уда��ение детали
- `isCopying: boolean` - идет копирование детали

### Утилиты

- `clearDetails(): void` - очистка всех данных

## Примеры использования

### Создание детали

```typescript
const { createDetail, isCreating } = useDetails(packageId);

const handleCreate = async () => {
  try {
    const newDetail = await createDetail({
      partSku: 'NEW-001',
      partName: 'Новая деталь',
      materialName: 'Сталь',
      materialSku: 'ST-001',
      pf: false,
      sbPart: false,
      pfSb: false
    });
    console.log('Деталь создана:', newDetail);
  } catch (error) {
    console.error('Ошибка создания:', error);
  }
};

return (
  <button onClick={handleCreate} disabled={isCreating}>
    {isCreating ? 'Создание...' : 'Создать деталь'}
  </button>
);
```

### Копирование детали

```typescript
const { copyDetail, isCopying } = useDetails(packageId);

const handleCopy = async (detailId: number) => {
  try {
    const copiedDetail = await copyDetail(detailId);
    console.log('Деталь скопирована:', copiedDetail);
  } catch (error) {
    console.error('Ошибка копирования:', error);
  }
};
```

### Обновление с управлением связями

```typescript
const { updateDetail } = useDetails(packageId);

const handleUpdate = async (detailId: number) => {
  try {
    const updatedDetail = await updateDetail(detailId, {
      partName: 'Обновленное название',
      packageConnections: [
        { packageId: 1, quantity: 2 },
        { packageId: 2, quantity: 1 }
      ]
    });
    console.log('Деталь обновлена:', updatedDetail);
  } catch (error) {
    console.error('Ошибка обновления:', error);
  }
};
```

## Автоматическое управление состоянием

Хук автоматически:
- Загружает детали при изменении `packageId`
- Обновляет локальное состояние после операций CRUD
- Управляет состояниями загрузки для каждой операции
- Очищает данные при сбросе `packageId`

## Обработка ошибок

Все операции могут выбрасывать ошибки. Хук сохраняет последнюю ошибку в состоянии `error`, но также рекомендуется обрабатывать ошибки в компонентах:

```typescript
const { createDetail, error } = useDetails(packageId);

// Глобальная ошибка
if (error) {
  return <div>Ошибка: {error.message}</div>;
}

// Локальная обработка ошибок
const handleCreate = async () => {
  try {
    await createDetail(data);
  } catch (error) {
    // Показать уведомление пользователю
    showNotification('Ошибка создания детали');
  }
};
```