# API индивидуального производства

## Обзор

API для работы с заказами индивидуального производства. В отличие от серийного производства, индивидуальное производство работает напрямую с деталями (`parts`), а не с пакетами из справочника.

## Основные отличия от серийного производства

| Характеристика | Серийное производство | Индивидуальное производство |
|----------------|----------------------|----------------------------|
| Базовый путь API | `/order-management` | `/custom-order-management` |
| Основная единица | `packages` (пакеты из справочника) | `parts` (детали напрямую) |
| Проверка справочника | Да, проверяет наличие в Package Directory | Нет, детали берутся из Excel |
| Структура данных | `{ packages: [...] }` | `{ parts: [...] }` |

## Endpoints

### 1. Загрузка и парсинг Excel файла

**POST** `/custom-order-management/upload`

Загружает Excel файл и парсит его содержимое для индивидуального производства.

#### Request

```typescript
FormData {
  file: File // Excel файл (.xlsx, .xls)
}
```

#### Response

```typescript
{
  success: boolean;
  data: {
    parts: Part[];
  };
  message?: string;
}

interface Part {
  code: string;      // Код детали
  name: string;      // Наименование детали
  quantity: number;  // Количество
}
```

#### Пример использования

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`${API_URL}/custom-order-management/upload`, {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// data.data.parts - массив деталей
```

### 2. Сохранение заказа из файла

**POST** `/custom-order-management/save-from-file`

Сохраняет заказ индивидуального производства с деталями из загруженного файла.

#### Request

```typescript
{
  orderNumber: string;    // Номер заказа
  orderName: string;      // Название заказа
  requiredDate: string;   // Требуемая дата (ISO 8601)
  parts: Part[];          // Массив деталей
  priority: number;       // Приоритет (1-10)
}
```

#### Response

```typescript
{
  success: boolean;
  data?: {
    orderId: number;  // ID созданного заказа
  };
  message?: string;
}
```

#### Пример использования

```typescript
const orderData = {
  orderNumber: "ИП-2024-001",
  orderName: "Индивидуальный заказ для клиента А",
  requiredDate: "2024-12-31",
  parts: [
    { code: "DET-001", name: "Деталь 1", quantity: 10 },
    { code: "DET-002", name: "Деталь 2", quantity: 5 }
  ],
  priority: 1
};

const response = await fetch(`${API_URL}/custom-order-management/save-from-file`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData),
});

const result = await response.json();
// result.data.orderId - ID созданного заказа
```

## Структура файлов

### API Layer

```
src/modules/api/custom/order-management/
└── customOrderManagementApi.ts  # API функции для индивидуального производства
```

### Hooks Layer

```
src/modules/hooks/custom/order-management/
└── useCustomOrderManagement.ts  # React хук для работы с API
```

### Components Layer

```
src/modules/order_management/custom/
├── CustomOrderCreation.tsx           # Форма создания заказа
├── CustomOrderCreation.module.css    # Стили формы
├── CustomOrderPreviewModal.tsx       # Модальное окно предпросмотра
├── CustomOrderPreviewModal.module.css # Стили модального окна
└── index.ts                          # Экспорты
```

## Использование в компонентах

### Пример с хуком

```typescript
import { useCustomOrderManagement } from '@/modules/hooks/custom/order-management/useCustomOrderManagement';

const MyComponent = () => {
  const { uploadFile, saveOrder, isLoading, error } = useCustomOrderManagement();

  const handleUpload = async (file: File) => {
    try {
      const parts = await uploadFile(file);
      console.log('Parsed parts:', parts);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSave = async () => {
    try {
      const orderId = await saveOrder({
        orderNumber: "ИП-001",
        orderName: "Test Order",
        requiredDate: "2024-12-31",
        parts: [...],
        priority: 1
      });
      console.log('Order created with ID:', orderId);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  return (
    <div>
      {isLoading && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {/* ... */}
    </div>
  );
};
```

### Пример прямого использования API

```typescript
import { uploadCustomOrderFile, saveCustomOrderFromFile } from '@/modules/api/custom/order-management/customOrderManagementApi';

// Загрузка файла
const uploadResponse = await uploadCustomOrderFile(file);
const parts = uploadResponse.data.parts;

// Сохранение заказа
const saveResponse = await saveCustomOrderFromFile({
  orderNumber: "ИП-001",
  orderName: "Test Order",
  requiredDate: "2024-12-31",
  parts: parts,
  priority: 1
});

const orderId = saveResponse.data?.orderId;
```

## Формат Excel файла

Excel файл должен содержать следующие колонки:

| Колонка | Описание | Тип |
|---------|----------|-----|
| Код детали | Уникальный код детали | string |
| Наименование | Название детали | string |
| Количество | Количество деталей | number |

Пример:

| Код детали | Наименование | Количество |
|-----------|--------------|------------|
| DET-001 | Деталь 1 | 10 |
| DET-002 | Деталь 2 | 5 |
| DET-003 | Деталь 3 | 15 |

## Обработка ошибок

Все API функции выбрасывают исключения при ошибках:

```typescript
try {
  const parts = await uploadCustomOrderFile(file);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  }
}
```

При использовании хука ошибки доступны через состояние:

```typescript
const { error, clearError } = useCustomOrderManagement();

if (error) {
  // Показать ошибку пользователю
  alert(error);
  clearError(); // Очистить ошибку
}
```

## Типы данных

```typescript
// Деталь
interface Part {
  code: string;
  name: string;
  quantity: number;
}

// Ответ при загрузке файла
interface UploadResponse {
  success: boolean;
  data: {
    parts: Part[];
  };
  message?: string;
}

// Запрос на сохранение заказа
interface SaveOrderRequest {
  orderNumber: string;
  orderName: string;
  requiredDate: string;
  parts: Part[];
  priority: number;
}

// Ответ при сохранении заказа
interface SaveOrderResponse {
  success: boolean;
  data?: {
    orderId: number;
  };
  message?: string;
}
```

## Переключение между типами производства

Используйте компонент [`ProductionTypeSwitch`](../src/modules/order_management/components/ProductionTypeSwitch/ProductionTypeSwitch.tsx) для переключения между серийным и индивидуальным производством:

```typescript
import { ProductionTypeSwitch, ProductionType } from '@/modules/order_management/components/ProductionTypeSwitch';

const [productionType, setProductionType] = useState<ProductionType>('series');

<ProductionTypeSwitch 
  value={productionType}
  onChange={setProductionType}
/>

{productionType === 'series' ? (
  <SeriesOrderCreation />
) : (
  <CustomOrderCreation />
)}
```
