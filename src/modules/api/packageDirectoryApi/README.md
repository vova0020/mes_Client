# Package Directory API

Этот модуль предоставляет API для работы с справочником упаковок в соответствии с бэкенд документацией.

## Изменения

### Обновленные типы данных

Типы данных были обновлены в соответствии с API документацией:

**Было:**
```typescript
interface PackageDirectory {
  id: number;
  article: string;
  name: string;
  detailsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

**Стало:**
```typescript
interface PackageDirectory {
  packageId: number;
  packageCode: string;
  packageName: string;
  createdAt: string;
  updatedAt: string;
}
```

### Обновленные DTO

**CreatePackageDirectoryDto:**
- `article` → `packageCode`
- `name` → `packageName`

**UpdatePackageDirectoryDto:**
- `article?` → `packageCode?`
- `name?` → `packageName?`

### Новые ��ипы

Добавлен тип для ответа при удалении:
```typescript
interface DeletePackageDirectoryResponse {
  message: string;
}
```

## API Методы

### `create(createDto: CreatePackageDirectoryDto): Promise<PackageDirectory>`
Создает новую упаковку.

### `findAll(): Promise<PackageDirectory[]>`
Получает все упаковки.

### `findById(id: number): Promise<PackageDirectory>`
Получает упаковку по ID.

### `update(id: number, updateDto: UpdatePackageDirectoryDto): Promise<PackageDirectory>`
Обновляет упаковку.

### `remove(id: number): Promise<DeletePackageDirectoryResponse>`
Удаляет упаковку.

## Использование

```typescript
import { packageDirectoryApi } from './packageDirectoryApi';

// Создание упаковки
const newPackage = await packageDirectoryApi.create({
  packageCode: 'PKG001',
  packageName: 'Стандартная упаковка'
});

// Получение всех упаковок
const packages = await packageDirectoryApi.findAll();

// Обновление упаковки
const updated = await packageDirectoryApi.update(1, {
  packageName: 'Новое название'
});

// Удаление упаковки
const result = await packageDirectoryApi.remove(1);
console.log(result.message); // "Упаковка с ID 1 успешно удалена"
```

## Хук usePackageDirectory

Хук также был обновлен для работы с новыми типами данных:

- Все ссылки на `id` заменены на `packageId`
- Обновлены методы для работы с новыми полями
- Добавлена обработка ответа при удалении

## Компоненты

Компоненты обновлены для работы с новыми полями:
- `DetailsReferenceContainer` - обновлен маппинг данных
- `PackagingSection` - совместим с новыми типами

## Тестирование

Для тестирования API используйте файл `test.ts`:

```typescript
import { testPackageDirectoryApi } from './test';

// Запуск тестов
testPackageDirectoryApi();
```