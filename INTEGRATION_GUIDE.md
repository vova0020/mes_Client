# Руководство по интеграции API деталей

## Обзор

Создана полная интеграция для работы с деталями в системе MES, включающая:

1. **API сервисы** - для взаимодействия с бекендом
2. **React хуки** - для управления состоянием в компонентах
3. **Обновленные компоненты** - использующие новое API

## Созданные файлы

### API сервисы

```
src/modules/api/
├── detailsApi/
│   ├── detailsApi.ts     # Основной API для деталей
│   ├── index.ts          # Экспорты
│   └── README.md         # Документация
└── parserApi/
    ├── parserApi.ts      # API для парсера Excel
    ├── index.ts          # Экспорты
    └── README.md         # Документация (будет создан)
```

### React хуки

```
src/modules/hooks/
├── detailsHook/
│   ├── useDetails.tsx    # Хук для работы с деталями
│   ├── index.ts          # Экспорты
│   └── README.md         # Документация
└── parserHook/
    ├── useParser.tsx     # Хук для парсера Excel
    ├── index.ts          # Экспорты
    └── README.md         # Документация (будет создан)
```

### Обновленные компоненты

- `DetailsSection.tsx` - теперь использует реальное API вместо моковых данных

## Основные возможности

### 1. Получение деталей по упаковке

```typescript
// Автоматическая загрузка при изменении packageId
const { details, loading, error } = useDetails(packageId);
```

### 2. Создание новой детали

```typescript
const { createDetail, isCreating } = useDetails(packageId);

const newDetail = await createDetail({
  partSku: 'PART-001',
  partName: 'Новая деталь',
  materialName: 'Алюминий',
  materialSku: 'AL-100',
  pf: false,
  sbPart: false,
  pfSb: false
});
```

### 3. Копирование детали

```typescript
const { copyDetail, isCopying } = useDetails(packageId);

const copiedDetail = await copyDetail(originalDetailId);
```

### 4. Обновление детали с управлением связями

```typescript
const { updateDetail } = useDetails(packageId);

await updateDetail(detailId, {
  partName: 'Обновленное название',
  packageConnections: [
    { packageId: 1, quantity: 2 }
  ]
});
```

### 5. Удаление детали

```typescript
const { deleteDetail } = useDetails(packageId);

await deleteDetail(detailId);
```

### 6. Парсинг Excel файлов

```typescript
const { uploadFile, parsedData, isUploading } = useParser();

const result = await uploadFile(excelFile);
```

## Интеграция с существующими компонентами

### DetailsSection

Компонент обновлен для использования реального API:

- Автоматическая загрузка деталей при выборе упаковки
- Реальное копирование деталей с обновлением спис��а
- Обработка состояний загрузки и ошибок
- Отображение всех полей согласно API документации

### Изменения в интерфейсе

1. **Добавлены новые колонки** в таблицу деталей согласно API
2. **Обновлена логика копирования** - теперь использует реальное API
3. **Добавлена обработка ошибок** с отображением пользователю
4. **Состояния загрузки** для всех операций

## Настройка окружения

### Переменные окружения

Убедитесь, что в `.env` файле указан правильный URL API:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

### Зависимости

Проект использует уже установленные зависимости:
- `axios` - для HTTP запросов
- `react` - для хуков и компонентов

## Соответствие API документации

Реализация полностью соответствует предоставленной API документации:

### Эндпоинты деталей

- ✅ `GET /details/package/:packageId` - получение деталей по упаковке
- ✅ `POST /details` - создание детали
- ✅ `PUT /details/:id` - обновление детали
- ✅ `DELETE /details/:id` - удаление детали

### Эндпоинты парсера

- ✅ `POST /parser/upload` - загрузка и парсинг Excel файла

### Типы данных

Все интерфейсы TypeScript соответствуют схемам из API документации.

## Следующие шаги

1. **Тестирование** - проверить работу с реальным бекендом
2. **Обработка ошибок** - добавить пользовательские уведомления
3. **Валидация** - добавить клиентскую валидацию форм
4. **Оптимизация** - добавить кеширование и оптимистичные обновления

## Примеры использования

### В функциональном компоненте

```typescript
import React from 'react';
import { useDetails } from '../hooks/detailsHook';

const DetailsComponent: React.FC<{ packageId: number }> = ({ packageId }) => {
  const {
    details,
    loading,
    error,
    createDetail,
    copyDetail,
    deleteDetail
  } = useDetails(packageId);

  if (loading === 'loading') return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  return (
    <div>
      {details.map(detail => (
        <div key={detail.id}>
          <h3>{detail.partName}</h3>
          <button onClick={() => copyDetail(detail.id)}>
            Копировать
          </button>
          <button onClick={() => deleteDetail(detail.id)}>
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
};
```

### Прямое использование API

```typescript
import { detailsApi } from '../api/detailsApi';

// Получение деталей
const details = await detailsApi.getByPackageId(1);

// Создание детали
const newDetail = await detailsApi.create({
  partSku: 'TEST-001',
  partName: 'Тестовая деталь',
  // ... другие поля
});
```

## Поддержка

При возникновении вопросов или проблем:

1. Проверьте документацию в README файлах
2. Убедитесь в правильности настройки API_URL
3. Проверьте консоль браузера на наличие ошибок
4. Убедитесь, что бекенд API доступен и работает корректно