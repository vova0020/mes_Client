
# Документация API поддонов

## Общая информация

API поддонов предоставляет возможность получать данные о поддонах по ID детали или по ID конкретного поддона. Для каждого поддона возвращается информация о его расположении в ячейке буфера (если поддон в буфере) и о привязке к станку (если поддон привязан к станку).

## Базовый URL

```
/pallets
```

## Доступные эндпоинты

### 1. Получение поддонов по ID детали

```
GET /pallets/detail/:detailId
```

#### Параметры запроса

| Параметр  | Тип    | Описание       | Обязательный |
|-----------|--------|----------------|--------------|
| detailId  | number | ID детали      | Да           |

#### Пример запроса

```
GET /pallets/detail/123
```

#### Структура ответа

```typescript
{
  "pallets": [
    {
      "id": number,
      "name": string,
      "quantity": number,
      "detailId": number,
      "bufferCell": {
        "id": number,
        "code": string,
        "bufferId": number,
        "bufferName": string
      } | null,
      "machine": {
        "id": number,
        "name": string,
        "status": string
      } | null
    }
  ],
  "total": number
}
```

#### Описание полей ответа

| Поле                    | Тип    | Описание                                          |
|-------------------------|--------|---------------------------------------------------|
| pallets                 | array  | Массив объектов с информацией о поддонах          |
| pallets[].id            | number | Уникальный идентификатор поддона                  |
| pallets[].name          | string | Название/номер поддона                            |
| pallets[].quantity      | number | Количество деталей на поддоне                     |
| pallets[].detailId      | number | ID детали, размещенной на поддоне                 |
| pallets[].bufferCell    | object | Информация о ячейке буфера или null               |
| bufferCell.id           | number | ID ячейки буфера                                  |
| bufferCell.code         | string | Код/номер ячейки буфера (например, "A1", "B2")   |
| bufferCell.bufferId     | number | ID буфера, которому принадлежит ячейка            |
| bufferCell.bufferName   | string | Название буфера                                   |
| pallets[].machine       | object | Информация о станке или null                      |
| machine.id              | number | ID станка                                         |
| machine.name            | string | Название/номер станка                             |
| machine.status          | string | Статус станка (ACTIVE, INACTIVE, MAINTENANCE)     |
| total                   | number | Общее количество поддонов в ответе                |

### 2. Получение поддона по ID

```
GET /pallets/:id
```

#### Параметры запроса

| Параметр | Тип    | Описание     | Обязательный |
|----------|--------|--------------|--------------|
| id       | number | ID поддона   | Да           |

#### Пример запроса

```
GET /pallets/456
```

#### Структура ответа

```typescript
{
  "id": number,
  "name": string,
  "quantity": number,
  "detailId": number,
  "bufferCell": {
    "id": number,
    "code": string,
    "bufferId": number,
    "bufferName": string
  } | null,
  "machine": {
    "id": number,
    "name": string,
    "status": string
  } | null
}
```

#### Описание полей ответа

Аналогично полям, описанным в ответе для эндпоинта получения поддонов по ID детали, но без обертки `pallets` и поля `total`.

## Примеры использования

### Пример 1: Получение всех поддонов для детали с ID 123

**Запрос:**
```javascript
fetch('/pallets/detail/123')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Ошибка:', error));
```

**Пример ответа:**
```json
{
  "pallets": [
    {
      "id": 1,
      "name": "Поддон-001",
      "quantity": 50,
      "detailId": 123,
      "bufferCell": {
        "id": 10,
        "code": "A5",
        "bufferId": 2,
        "bufferName": "Основной буфер"
      },
      "machine": null
    },
    {
      "id": 2,
      "name": "Поддон-002",
      "quantity": 30,
      "detailId": 123,
      "bufferCell": null,
      "machine": {
        "id": 5,
        "name": "Станок №3",
        "status": "ACTIVE"
      }
    }
  ],
  "total": 2
}
```

### Пример 2: Получение информации о поддоне с ID 456

**Запрос:**
```javascript
fetch('/pallets/456')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Ошибка:', error));
```

**Пример ответа:**
```json
{
  "id": 456,
  "name": "Поддон-124",
  "quantity": 75,
  "detailId": 789,
  "bufferCell": {
    "id": 22,
    "code": "C3",
    "bufferId": 3,
    "bufferName": "Буфер цеха №2"
  },
  "machine": null
}
```

## Руководство по отображению данных на фронтенде

### 1. Отображение списка поддонов для детали

```typescript
interface PalletListProps {
  detailId: number;
}

const PalletList: React.FC<PalletListProps> = ({ detailId }) => {
  const [pallets, setPallets] = useState<PalletDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPallets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/pallets/detail/${detailId}`);
        if (!response.ok) {
          throw new Error('Не удалось получить данные о поддонах');
        }
        const data = await response.json();
        setPallets(data.pallets);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPallets();
  }, [detailId]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="pallets-list">
      <h2>Поддоны для детали #{detailId}</h2>
      <p>Всего поддонов: {pallets.length}</p>
      
      <table className="pallets-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Количество</th>
            <th>Расположение</th>
            <th>Станок</th>
          </tr>
        </thead>
        <tbody>
          {pallets.map(pallet => (
            <tr key={pallet.id}>
              <td>{pallet.id}</td>
              <td>{pallet.name}</td>
              <td>{pallet.quantity}</td>
              <td>
                {pallet.bufferCell 
                  ? `${pallet.bufferCell.bufferName} (Ячейка ${pallet.bufferCell.code})` 
                  : 'Не в буфере'}
              </td>
              <td>
                {pallet.machine 
                  ? `${pallet.machine.name} (${pallet.machine.status === 'ACTIVE' ? 'Активен' : 'Неактивен'})` 
                  : 'Не привязан к станку'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 2. Отображение детальной информации о поддоне

```typescript
interface PalletDetailProps {
  palletId: number;
}

const PalletDetail: React.FC<PalletDetailProps> = ({ palletId }) => {
  const [pallet, setPallet] = useState<PalletDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPalletDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/pallets/${palletId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Поддон не найден');
          }
          throw new Error('Не удалось получить данные о поддоне');
        }
        const data = await response.json();
        setPallet(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPalletDetail();
  }, [palletId]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!pallet) return <div>Поддон не найден</div>;

  return (
    <div className="pallet-detail">
      <h2>Информация о поддоне #{pallet.id}</h2>
      
      <div className="pallet-info">
        <div className="info-group">
          <h3>Основная информация</h3>
          <p><strong>Название:</strong> {pallet.name}</p>
          <p><strong>Количество деталей:</strong> {pallet.quantity}</p>
          <p><strong>ID детали:</strong> {pallet.detailId}</p>
        </div>

        <div className="info-group">
          <h3>Расположение в буфере</h3>
          {pallet.bufferCell ? (
            <>
              <p><strong>Буфер:</strong> {pallet.bufferCell.bufferName}</p>
              <p><strong>Ячейка:</strong> {pallet.bufferCell.code}</p>
            </>
          ) : (
            <p>Поддон не находится в буфере</p>
          )}
        </div>

        <div className="info-group">
          <h3>Привязка к станку</h3>
          {pallet.machine ? (
            <>
              <p><strong>Станок:</strong> {pallet.machine.name}</p>
              <p><strong>Статус станка:</strong> {
                pallet.machine.status === 'ACTIVE' ? 'Активен' : 
                pallet.machine.status === 'INACTIVE' ? 'Неактивен' : 'На обслуживании'
              }</p>
            </>
          ) : (
            <p>Поддон не привязан к станку</p>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Типы данных для TypeScript

Для удобства использования API на фронтенде, ниже приведены типы данных в формате TypeScript:

```typescript
// DTO для ячейки буфера
export interface BufferCellDto {
  id: number;
  code: string;
  bufferId: number;
  bufferName?: string;
}

// DTO для станка
export interface MachineDto {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

// DTO для поддона
export interface PalletDto {
  id: number;
  name: string;
  quantity: number;
  detailId: number;
  bufferCell?: BufferCellDto | null;
  machine?: MachineDto | null;
}

// DTO для ответа со списком поддонов
export interface PalletsResponseDto {
  pallets: PalletDto[];
  total: number;
}
```

## Возможные коды ошибок

| Код  | Описание                                   |
|------|-------------------------------------------|
| 400  | Некорректные параметры запроса            |
| 404  | Поддон или деталь не найдены              |
| 500  | Внутренняя ошибка сервера                 |

## Контактная информация

Если у вас возникли вопросы по использованию API, обратитесь к разработчикам бэкенда.
