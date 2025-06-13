# Socket.IO Интеграция для Материалов

## 📋 Обзор

Данная интеграция обеспечивает обновление данных в реальном времени между клиентами при работе с материалами и их группами. Когда один пользователь создает, обновляет или удаляет материал/группу, все остальные подключенные пользователи автоматически получают обновления.

## 🚀 Использование

### 1. Подключение SocketProvider

Оберните ваше приложение в `SocketProvider`:

```tsx
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider serverUrl="http://localhost:5000" autoConnect={true}>
      {/* Ваши компоненты */}
    </SocketProvider>
  );
}
```

### 2. Использовани�� в компонентах

```tsx
import { useSocket } from './contexts/SocketContext';
import { useMaterialsSocket } from './hooks/useMaterialsSocket';

function MyComponent() {
  const { isConnected, socket } = useSocket();
  
  // Автоматически настраивает обработчики событий
  useMaterialsSocket();

  return (
    <div>
      {isConnected ? '🟢 Подключено' : '🔴 Отключено'}
    </div>
  );
}
```

## 🎨 CSS Стили

Импортируйте стили для индикаторов подключения:

```tsx
import socketStyles from './styles/SocketStyles.module.css';

// Использование индикатора подключения
<span className={`${socketStyles.connectionDot} ${isConnected ? socketStyles.connected : socketStyles.disconnected}`} />

// Real-time бейдж
{isConnected && (
  <span className={socketStyles.realtimeBadge}>🔄</span>
)}
```

## 📡 События Socket.IO

### События материалов:
- `materialCreated` - создан новый материал
- `materialUpdated` - материал обновлен
- `materialDeleted` - материал удален
- `materialLinkedToGroup` - материал привязан к группе
- `materialUnlinkedFromGroup` - материал отвязан от группы

### События групп материалов:
- `materialGroupCreated` - создана новая группа
- `materialGroupUpdated` - группа обновлена  
- `materialGroupDeleted` - группа удалена

## 🏠 Комнаты (Rooms)

Клиент автоматически подключается к комнатам:
- `joinMaterialsRoom` - для событий материалов
- `joinMaterialGroupsRoom` - для событий групп

## 🔧 Компоненты

### SocketConnectionIndicator
Показывает статус подключения и позволяет управлять соединением:

```tsx
<SocketConnectionIndicator 
  position="bottom-right" 
  showDetails={true} 
/>
```

### Обновленные компоненты
Все компоненты обновлены для работы с Socket.IO:
- `MaterialSettingsPage` - обернут в SocketProvider
- `MaterialsList` - показывает статус подключения
- `MaterialGroups` - показывает статус подключения  
- `MaterialForm` - предупреждает о проблемах с подключением

## ⚙️ Конфигурация

### SocketProvider параметры:
- `serverUrl` - URL Socket.IO сервера (по умолчанию: http://localhost:5000)
- `autoConnect` - автоматическое подключение (по умолчанию: true)

### Переподключение:
- Максимум попыток: 5
- Задержка: 3000ms с экспоненциальным увеличением
- Автоматическое переподключение при разрыве соединения

## 🎯 Интеграция с React Query

Socket.IO события автоматически обновляют кэш React Query:

```tsx
// При получении события materialCreated
queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materialGroups });
```

## 🐛 Отладка

Включите логирование в консоли браузера:
- ✅ Socket.IO подключен
- ❌ Socket.IO отключен  
- 🔄 Переподключение
- 📦 События материалов
- 📁 События групп

## 📱 Адаптивность

Стили адаптированы для мобильных устройств:
- Скрытие текста на маленьких экранах
- Уменьшение размеров индикаторов
- Оптимизация для touch-устройств

## 🌓 Темная тема

Стили поддерживают темную тему и высокий контраст:
- Автоматическое определение темы системы
- Поддержка `prefers-color-scheme: dark`
- Режим высокого контраста

## ♿ Доступность

- Поддержка навигации с клавиатуры
- ARIA-метки для индикаторов
- Высокий контраст для индикаторов состояния
- Текстовые альтернативы для визуальных индикаторов