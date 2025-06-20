
# Справка по API управления пользователями
> **Базовый URL:** `http://localhost:5000` (или ваш сервер)
## Базовый URL
```
/settings/users
```

## 1. CRUD операции с пользователями

### 1.1 Создание пользователя
```http
POST /settings/users
```

**Тело запроса:**
```json
{
  "login": "string",          // min 3 символа
  "password": "string",       // min 6 символов
  "firstName": "string",
  "lastName": "string",
  "phone": "string",         // опционально
  "position": "string",      // опционально
  "salary": "number"         // опционально (Decimal)
}
```

**Ответ (201):**
```json
{
  "userId": 1,
  "login": "testuser",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "userDetail": {
    "firstName": "Иван",
    "lastName": "Иванов",
    "phone": "+7123456789",
    "position": "Оператор",
    "salary": 50000
  }
}
```

### 1.2 Получение всех пользователей
```http
GET /settings/users
```

**Ответ (200):** Массив объектов пользователей

### 1.3 Получение пользователя по ID
```http
GET /settings/users/:userId
```

**Ответ (200):** Объект пользователя

### 1.4 Обновление пользователя
```http
PUT /settings/users/:userId
```

**Тело запроса:** Все поля опциональны
```json
{
  "login": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "position": "string",
  "salary": "number"         // Decimal
}
```

### 1.5 Удаление пользователя
```http
DELETE /settings/users/:userId
```

**Ответ (204):** Пустой ответ

## 2. Управление глобальными ролями

### 2.1 Назначение глобальной роли
```http
POST /settings/users/roles/global
```

**Тело запроса:**
```json
{
  "userId": 1,
  "role": "admin"  // см. доступные роли ниже
}
```

### 2.2 Удаление глобальной роли
```http
DELETE /settings/users/roles/global/:userId/:role
```

## 3. Управление контекстными привязками

### 3.1 Создание контекстной привязки
```http
POST /settings/users/roles/bindings
```

**Тело запроса:**
```json
{
  "userId": 1,
  "role": "operator",
  "contextType": "STAGE_LEVEL1",  // MACHINE | STAGE_LEVEL1 | ORDER_PICKER
  "contextId": 5
}
```

### 3.2 Удаление контекстной привязки
```http
DELETE /settings/users/roles/bindings/:bindingId
```

## 4. Получение информации о ролях

### 4.1 Получение ролей пользователя
```http
GET /settings/users/:userId/roles
```

**Ответ (200):**
```json
{
  "userId": 1,
  "globalRoles": ["admin", "technologist"],
  "roleBindings": [
    {
      "id": 1,
      "role": "operator",
      "contextType": "STAGE_LEVEL1",
      "contextId": 5,
      "contextName": "Механическая обработка"
    }
  ]
}
```

### 4.2 Получение доступных ролей
```http
GET /settings/users/roles/available
```

**Ответ (200):**
```json
{
  "roles": [
    "admin",
    "management", 
    "technologist",
    "master",
    "operator",
    "orderPicker",
    "workplace"
  ]
}
```

## 5. Управление комплектовщиками (Pickers)

### 5.1 Создание комплектовщика
```http
POST /settings/users/pickers
```

**Тело запроса:**
```json
{
  "userId": 1
}
```

**Ответ (201):**
```json
{
  "pickerId": 1,
  "userId": 1,
  "user": {
    "userId": 1,
    "login": "picker_user",
    "userDetail": {
      "firstName": "Иван",
      "lastName": "Комплектовщиков",
      "phone": "+7123456789",
      "position": "Комплектовщик"
    }
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 5.2 Создание комплектовщика с ролью
```http
POST /settings/users/pickers/with-role
```

**Тело запроса:**
```json
{
  "userId": 1,
  "assignRole": true  // опционально, по умолчанию true
}
```

**Ответ (201):**
```json
{
  "picker": {
    "pickerId": 1,
    "userId": 1,
    "user": {
      "userId": 1,
      "login": "picker_user",
      "userDetail": {
        "firstName": "Иван",
        "lastName": "Комплектовщиков",
        "phone": "+7123456789",
        "position": "Комплектовщик"
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "roleBindingId": 5,
  "message": "Комплектовщик создан с назначенной ролью"
}
```

### 5.3 Получение всех комплектовщиков
```http
GET /settings/users/pickers
```

**Ответ (200):** Массив объектов комплектовщиков

### 5.4 Получение комплектовщика по ID
```http
GET /settings/users/pickers/:pickerId
```

**Ответ (200):** Объект комплектовщика

### 5.5 Получение комплектовщика по ID пользователя
```http
GET /settings/users/pickers/by-user/:userId
```

**Ответ (200):** Объект комплектовщика

### 5.6 Обновление комплектовщика
```http
PUT /settings/users/pickers/:pickerId
```

**Тело запроса:**
```json
{
  "userId": 2  // опционально - новый пользователь для комплектовщика
}
```

**Ответ (200):** Обновленный объект комплектовщика

### 5.7 Удаление комплектовщика
```http
DELETE /settings/users/pickers/:pickerId
```

**Ответ (204):** Пустой ответ

## 6. Вспомогательные эндпоинты

### 6.1 Получение станков для привязки
```http
GET /settings/users/context/machines
```

**Ответ (200):**
```json
{
  "machines": [
    {
      "machineId": 1,
      "machineName": "Станок ЧПУ-001"
    }
  ]
}
```

### 6.2 Получение этапов для привязки
```http
GET /settings/users/context/stages
```

**Ответ (200):**
```json
{
  "stages": [
    {
      "stageId": 1,
      "stageName": "Механическая обработка"
    }
  ]
}
```

### 6.3 Получение комплектовщиков для привязки
```http
GET /settings/users/context/pickers
```

**Ответ (200):**
```json
{
  "pickers": [
    {
      "pickerId": 1,
      "pickerName": "Иван Иванов"
    }
  ]
}
```

## 7. Типы ролей и контекстов

### Типы ролей (UserRoleType)
- `admin` - Администратор
- `management` - Менеджмент  
- `technologist` - Технолог
- `master` - Мастер
- `operator` - Оператор
- `orderPicker` - Комплектовщик заказов
- `workplace` - Рабочее место

### Типы контекстов (RoleContextType)
- `MACHINE` - Станок (для роли `workplace`)
- `STAGE_LEVEL1` - Этап 1-го уровня (для ролей `master`, `operator`)
- `ORDER_PICKER` - Комплектовщик (для роли `orderPicker`)

## 8. Socket.IO обновления

### Подключение к Socket.IO
```javascript
import io from 'socket.io-client';
const socket = io('ws://localhost:3000');
```

### События пользователей

#### 8.1 Создание пользователя
```javascript
socket.on('user:created', (data) => {
  console.log('Новый пользователь создан:', data);
  // data: { userId, login, firstName, lastName }
});
```

#### 8.2 Обновление пользователя
```javascript
socket.on('user:updated', (data) => {
  console.log('Пользователь обновлен:', data);
  // data: { userId, login }
});
```

#### 8.3 Удаление пользователя
```javascript
socket.on('user:deleted', (data) => {
  console.log('Пользователь удален:', data);
  // data: { userId, login }
});
```

#### 8.4 Назначение глобальной роли
```javascript
socket.on('user:role:assigned', (data) => {
  console.log('Роль назначена:', data);
  // data: { userId, role, type: 'global' }
});
```

#### 8.5 Удаление глобальной роли
```javascript
socket.on('user:role:removed', (data) => {
  console.log('Роль удалена:', data);
  // data: { userId, role, type: 'global' }
});
```

#### 8.6 Создание контекстной привязки
```javascript
socket.on('user:role:binding:created', (data) => {
  console.log('Контекстная привязка создана:', data);
  // data: { userId, role, contextType, contextId }
});
```

#### 8.7 Удаление контекстной привязки
```javascript
socket.on('user:role:binding:removed', (data) => {
  console.log('Контекстная привязка удалена:', data);
  // data: { bindingId, userId, role, contextType, contextId }
});
```

### События комплектовщиков

#### 8.8 Создание комплектовщика
```javascript
socket.on('picker:created', (data) => {
  console.log('Комплектовщик создан:', data);
  // data: { pickerId, userId, userName }
});
```

#### 8.9 Обновление комплектовщика
```javascript
socket.on('picker:updated', (data) => {
  console.log('Комплектовщик обновлен:', data);
  // data: { pickerId, userId }
});
```

#### 8.10 Удаление комплектовщика
```javascript
socket.on('picker:deleted', (data) => {
  console.log('Комплектовщик удален:', data);
  // data: { pickerId, userId }
});
```

## 9. Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверные данные в запросе |
| 404 | Пользователь/роль/привязка/комплектовщик не найдены |
| 409 | Конфликт (логин занят, роль уже назначена, комплектовщик уже существует) |
| 500 | Внутренняя ошибка сервера |

## 10. Примеры использования

### 10.1 Создание пользователя и назначение роли комплектовщика
```javascript
// 1. Создаем пользователя
const user = await fetch('/settings/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    login: 'picker001',
    password: 'secure123',
    firstName: 'Иван',
    lastName: 'Комплектовщиков',
    position: 'Комплектовщик'
  })
});

// 2. Создаем комплектовщика с автоматическим назначением роли
const picker = await fetch('/settings/users/pickers/with-role', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.userId,
    assignRole: true
  })
});
```

### 10.2 Назначение контекстной роли оператора
```javascript
// Назначаем роль оператора для конкретного этапа
await fetch('/settings/users/roles/bindings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 1,
    role: 'operator',
    contextType: 'STAGE_LEVEL1',
    contextId: 5
  })
});
```
