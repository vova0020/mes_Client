# Рефакторинг модуля упаковки

## Обзор изменений

Модуль упаковки был полностью реорганизован для улучшения архитектуры, разделения ответственности и соответствия API документации.

## Структура до рефакторинга

```
src/modules/
├── api/ypakMasterApi/
│   └── packagingMasterApi.ts          # Один большой API файл
├── hooks/ypakMasterHook/
│   └── packagingMasterHook.tsx        # Один большой хук
└── master_ypak_page/components/
    ├── DetailsTable/
    │   └── MasterYpackDetailsYpackTable.tsx
    └── PalletsSidebar/
        └── PackagingDetailsSidebar.tsx # Использовал моковые данные
```

## Структура после рефакторинга

```
src/modules/
├── api/ypakMasterApi/
│   ├── packagingApi.ts                # API для упаковок
│   ├── partsApi.ts                    # API для деталей
│   ├── palletsApi.ts                  # API для поддонов
│   ├── index.ts                       # Экспорт всех API
│   ├── README.md                      # Документация API
│   └── packagingMasterApi.ts          # Старый API (для совместимости)
├── hooks/ypakMasterHook/
│   ├── usePackaging.ts                # Хук для упаковок
│   ├── useParts.ts                    # Хук для деталей
│   ├── usePallets.ts                  # Хук для поддонов
│   ├── index.ts                       # Экспорт всех хуков
│   ├── README.md                      # Документация хуков
│   └── packagingMasterHook.tsx        # Старый хук (для совместимости)
└── master_ypak_page/
    ├── components/
    │   ├── DetailsTable/
    │   │   └── MasterYpackDetailsYpackTable.tsx  # Обновлен для новых хуков
    │   └── PalletsSidebar/
    │       └── PackagingDetailsSidebar.tsx       # Использует реальные API
    └── MIGRATION_GUIDE.md             # Руководство по миграции
```

## Созданные ф��йлы

### API модули

1. **packagingApi.ts** - API для работы с упаковками
   - `getPackages()` - получение списка упаковок с фильтрами
   - `getPackagesByOrderId()` - получение упаковок по ID заказа
   - `getPackageById()` - получение упаковки по ID

2. **partsApi.ts** - API для работы с деталями упаковок
   - `getPartsByPackageId()` - получение всех деталей упаковки
   - `getPartFromPackage()` - получение конкретной детали из упаковки
   - `getPartsStatistics()` - получение статистики по деталям упаковки

3. **palletsApi.ts** - API для работы с поддонами
   - `getPalletsByPartId()` - получение всех поддонов детали
   - `getPalletByPartAndPalletId()` - получение конкретного поддона
   - `getPalletsStatistics()` - получение статистики по поддонам детали

### React хуки

1. **usePackaging.ts** - хук для управления состоянием упаковок
   - Загрузка упаковок с различными фильтрами
   - Управление состоянием загрузки и ошибок
   - Пагинация

2. **useParts.ts** - хук для управления состоянием деталей
   - Загрузка деталей по ID упаковки
   - Получение информации об упаковке
   - Статистика по деталям

3. **usePallets.ts** - хук для управления состоянием поддонов
   - Загрузка поддонов по ID детали
   - Получение информации о детали
   - Статистика по поддонам

### Обновленные компоненты

1. **MasterYpackDetailsYpackTable.tsx**
   - Использует новый хук `usePackaging`
   - Обновлены интерфейсы данных согласно API документации
   - Улучшена обработка ошибок

2. **PackagingDetailsSidebar.tsx**
   - Полностью переписан для использования реальных API
   - Использует хуки `useParts` и `usePallets`
   - Убраны моковые данные
   - Добавлена поддержка выбранной упаковки

## Ключевые улучшения

### 1. Разделение ответственности
- Каждый API модуль отвечает за свою область (упаковки, детали, поддоны)
- Хуки разделены по логическим группам
- Четкое разделение между API слоем и слоем состояния

### 2. Соответствие API документации
- Все интерфейсы данных соответствуют `API_Documentation_Frontend.md`
- Правильные эндпоинты и параметры запросов
- Корректная обработка ответов сервера

### 3. Улучшенная типизация
- Строгая типизация всех данных
- Интерфейсы для запросов и ответов
- TypeScript поддержка на всех уровнях

### 4. Переиспользование кода
- Хуки можно использовать независимо в разных компонентах
- API функции можно вызывать напрямую без хуков
- Модульная архитектура

### 5. Обратная совместимость
- Старые файлы оставлены для постепенной миграции
- Экспорт через индексные файлы
- Возможность использовать старые и новые API одновременно

## Миграция компонентов

### Основные изменения в MasterYpackDetailsYpackTable.tsx:

```typescript
// Было
import usePackagingDetails from '../../../hooks/ypakMasterHook/packagingMasterHook';
const { packagingItems, fetchPackagingItems } = usePackagingDetails();

// Стало
import { usePackaging } from '../../../hooks/ypakMasterHook';
const { packages, fetchPackagesByOrderId } = usePackaging();
```

### Основные изменения в PackagingDetailsSidebar.tsx:

```typescript
// Было - моковые данные
const [details] = useState<Detail[]>([...]);

// Стало - реальные API
import { useParts, usePallets } from '../../../hooks/ypakMasterHook';
const { parts, fetchPartsByPackageId } = useParts();
const { pallets, fetchPalletsByPartId } = usePallets();
```

## Следующие шаги

1. **Тестирование** - протестировать все новые функции
2. **Дополнительные API** - добавить недостающие функции (назначение упаковщиков, обновление статусов)
3. **Обработка ошибок** - улучшить обработку ошибок и валидацию
4. **Unit тесты** - написать тесты для новых моду��ей
5. **Полная миграция** - мигрировать все компоненты и удалить старые файлы

## Документация

- `src/modules/api/ypakMasterApi/README.md` - документация API модулей
- `src/modules/hooks/ypakMasterHook/README.md` - документация хуков
- `src/modules/master_ypak_page/MIGRATION_GUIDE.md` - руководство по миграции

## Заключение

Рефакторинг значительно улучшил архитектуру модуля упаковки:
- Код стал более модульным и переиспользуемым
- Улучшилась типизация и соответствие API
- Компоненты стали проще для понимания и поддержки
- Добавлена возможность постепенной миграции без поломки существующего функционала