
# Документация API для мастера упаковки

## Общее описание

API для мастера упаковки предоставляет доступ к данным об упаковках (УПАК) для конкретного производственного заказа. Это позволяет получить информацию о текущем состоянии упаковок, количестве деталей, готовых к упаковке, и другие метрики, необходимые для работы участка упаковки.

## Конечные точки (Endpoints)

### Получение списка упаковок для заказа

```
GET /ypak/packaging/order/:id
```

Где `:id` - идентификатор заказа.

#### Пример запроса

```
GET /ypak/packaging/order/123
```

#### Успешный ответ (200 OK)

```json
[
  {
    "article": "УП-001",
    "name": "Упаковка для стола",
    "totalQuantity": 120,
    "readyForPackaging": 80,
    "allocated": 1,
    "assembled": 2,
    "packed": 0
  },
  {
    "article": "УП-002",
    "name": "Упаковка для стульев",
    "totalQuantity": 240,
    "readyForPackaging": 150,
    "allocated": 1,
    "assembled": 2,
    "packed": 0
  }
]
```

#### Ответ при ошибке (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Упаковки для заказа с id 123 не найдены",
  "error": "Not Found"
}
```

## Структура данных

### PackagingDataDto

Объект `PackagingDataDto` содержит информацию об упаковке и связанных с ней метриках.

| Поле | Тип | Описание |
|------|-----|----------|
| `article` | string | Артикул упаковки. Если не указан, будет возвращено "Н/Д" |
| `name` | string | Название упаковки |
| `totalQuantity` | number | Общее количество деталей, входящих в упаковку (сумма количества всех деталей, связанных с этой упаковкой) |
| `readyForPackaging` | number | Количество деталей, готовых к упаковке (прошедших все предыдущие этапы обработки) |
| `allocated` | number | Количество распределенных деталей (в текущей версии - значение по умолчанию) |
| `assembled` | number | Количество скомплектованных деталей (в текущей версии - значение по умолчанию) |
| `packed` | number | Количество упакованных деталей (в текущей версии - значение по умолчанию) |

## Использование в интерфейсе мастера упаковки

### Использование данных

Полученные данные могут быть использованы для отображения таблицы или карточек упаковок с указанием следующей информации:

1. **Основная информация об упаковке**:
   - Артикул и название упаковки для идентификации
   
2. **Числовые показатели**:
   - Общее количество (`totalQuantity`) - используется для отображения общего числа деталей, которые должны быть упакованы
   - Готово к упаковке (`readyForPackaging`) - показывает, сколько деталей прошли все предыдущие этапы и готовы к упаковке
   - Распределено (`allocated`) - показывает, сколько деталей распределено между рабочими на участке упаковки
   - Скомплектовано (`assembled`) - показывает, сколько деталей уже скомплектовано (подготовлено к упаковке)
   - Упаковано (`packed`) - показывает, сколько деталей уже упаковано

3. **Индикаторы прогресса**:
   - Можно использовать отношение `readyForPackaging / totalQuantity` для отображения прогресса готовности к упаковке
   - Отношение `packed / totalQuantity` для отображения общего прогресса упаковки

### Пример отображения данных

Карточка упаковки может выглядеть следующим образом:

```
+---------------------------------------+
| Упаковка: УП-001 - Упаковка для стола |
+---------------------------------------+
| Всего деталей: 120                    |
| Готово к упаковке: 80 (66.7%)         |
| Распределено: 1                       |
| Скомплектовано: 2                     |
| Упаковано: 0 (0%)                     |
+---------------------------------------+
| [Прогресс: ■■■■■■■□□□] 66.7%          |
+---------------------------------------+
```

## Обновления в будущих версиях

В будущих версиях API планируется расширение функциональности:

1. Реализация логики расчёта для полей:
   - `allocated` (количество распределенных деталей)
   - `assembled` (количество скомплектованных деталей)
   - `packed` (количество упакованных деталей)

2. Добавление возможности обновления статусов упаковки через PUT/PATCH запросы
   - Изменение количества распределенных деталей
   - Изменение количества скомплектованных деталей
   - Изменение количества упакованных деталей

3. Добавление дополнительных метрик и фильтров для анализа процесса упаковки
