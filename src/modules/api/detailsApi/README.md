# Details API

API для работы с деталями в системе MES.

## Структура

```
detailsApi/
├── detailsApi.ts    # Основной API сервис
├── index.ts         # Экспорты
└── README.md        # Документация
```

## Использование

### Импорт

```typescript
import { detailsApi, Detail, CreateDetailDto } from '../api/detailsApi';
```

### Основные методы

#### Получение деталей по упаковке

```typescript
const details = await detailsApi.getByPackageId(packageId);
```

#### Создание детали

```typescript
const newDetail = await detailsApi.create({
  partSku: 'PART-001',
  partName: 'Деталь 1',
  materialName: 'Алюминий',
  materialSku: 'AL-100',
  pf: false,
  sbPart: false,
  pfSb: false,
  // ... другие поля
});
```

#### Обновление детали

```typescript
const updatedDetail = await detailsApi.update(detailId, {
  partName: 'Новое название',
  packageConnections: [
    { packageId: 1, quantity: 2 }
  ]
});
```

#### Копирование детали

```typescript
const copiedDetail = await detailsApi.copy(detailId);
```

#### Удаление детали

```typescript
await detailsApi.remove(detailId);
```

## Типы данных

### Detail

Основной интерфейс детали с полным набором полей согласно API документации.

### CreateDetailDto

DTO для создания новой детали (без ID и связанных данных).

### UpdateDetailDto

DTO для обновления детали, включает поле `packageConnections` для управления связями с упаковками.

### PackageConnection

Интерфейс для связи детали с упаковкой:
```typescript
{
  packageId: number;
  quantity: number;
}
```

## Обработка ошибок

Все методы API могут выбрасывать ошибки. Рекомендуется использовать try-catch блоки:

```typescript
try {
  const detail = await detailsApi.create(createDto);
  console.log('Деталь создана:', detail);
} catch (error) {
  console.error('Ошибка создания детали:', error);
}
```

## Связь с хук��ми

Рекомендуется использовать API через хук `useDetails` для автоматического управления состоянием:

```typescript
import { useDetails } from '../hooks/detailsHook';

const { details, createDetail, loading } = useDetails(packageId);
```