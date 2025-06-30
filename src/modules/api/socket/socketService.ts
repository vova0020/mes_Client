import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { Machine } from '../machinNoSmenApi/machineApi';

// Типы событий сокета в соответствии с документацией
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'connect_error',
  // Системные события
  ROOMS_AVAILABLE = 'roomsAvailable',
  ROOM_JOINED = 'roomJoined',
  ROOM_LEFT = 'roomLeft',
  MY_ROOMS = 'myRooms',
  ROOM_STATS = 'roomStats',
  PONG = 'pong',
  // События машин
  MACHINE_STATUS_UPDATED = 'machineStatusUpdated'
}

// Комнаты для подключения согласно новой документации
export enum SocketRoom {
  SETTINGS_MACHINES = 'settings-machines',
  SETTINGS_MATERIALS = 'settings-materials',
  SETTINGS_MATERIAL_GROUPS = 'settings-materialGroups',
  SETTINGS_BUFFERS = 'settings-buffers',
  SETTINGS_PRODUCTION_LINES = 'settings-production-lines',
  SETTINGS_PRODUCTION_STAGES = 'settings-production-stages',
  SETTINGS_USER = 'settings-user',
  PRODUCT_MACHINES = 'product-machines',
  ROUTES = 'settings-routes',
  PALLETS = 'pallets'
}

// Интерфейс обработчика событий сокета
interface SocketHandlers {
  onMachineStatusUpdate?: (machine: Machine) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onRoomsAvailable?: (rooms: string[]) => void;
  onRoomJoined?: (room: string) => void;
  onRoomLeft?: (room: string) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private machineId: number | null = null;
  private handlers: SocketHandlers = {};
  private rooms: Set<string> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private verbose: boolean = true; // Расширенное логирование по умолчанию включено

  /**
   * Инициализирует соединение с сервером через Socket.IO
   * @returns Инстанс сокета
   */
  public initialize(): Socket {
    if (this.socket && this.socket.connected) {
      // console.log('Socket.IO соединение уже установлено');
      return this.socket;
    }

    // console.log('Инициализация Socket.IO соединения');

    // Закрываем существующее соединение, если оно есть
    if (this.socket) {
      // console.log('Закрытие существующего соединения Socket.IO');
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000, // Увеличиваем таймаут
      query: { timestamp: new Date().getTime() } // Добавляем уникальный параметр для предотвращения кэширования
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * Настраивает прослушивание событий сокета
   */
  private setupEventListeners(): void {
    if (!this.socket) {
      console.error('Не удалось настроить прослушивание событий: соединение не инициализировано');
      return;
    }

    // Настраиваем универсальный логгер для всех событий в режиме отладки
    if (this.verbose) {
      this.socket.onAny((event, ...args) => {
        // console.log(`🔄 Socket.IO получено событие: ${event}`, args);
      });
    }

    // Базовые события сокета
    this.socket.on(SocketEvent.CONNECT, () => {
      // console.log('Socket.IO соединение установлено');
      this.reconnectAttempts = 0;

      // При переподключении заново присоединяемся к комнатам
      this.rejoinRooms();

      if (this.handlers.onConnect) {
        this.handlers.onConnect();
      }
    });

    this.socket.on(SocketEvent.DISCONNECT, () => {
      // console.log('Socket.IO соединение разорвано');

      if (this.handlers.onDisconnect) {
        this.handlers.onDisconnect();
      }

      // Пытаемся переподключиться, если количество попыток не превышает максимум
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        // console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        setTimeout(() => {
          if (!this.socket?.connected) {
            this.initialize();
          }
        }, 2000);
      }
    });

    this.socket.on(SocketEvent.ERROR, (error) => {
      console.error('Socket.IO ошибка:', error);
      if (this.handlers.onError) {
        this.handlers.onError(new Error('Ошибка Socket.IO соединения'));
      }
    });

    // Системные события согласно новой документации
    this.socket.on(SocketEvent.ROOMS_AVAILABLE, (data) => {
      // console.log('🏠 Доступные комнаты:', data.rooms);
      if (this.handlers.onRoomsAvailable) {
        this.handlers.onRoomsAvailable(data.rooms);
      }
    });

    this.socket.on(SocketEvent.ROOM_JOINED, (data) => {
      // console.log(`✅ Присоединился к комнате: ${data.room}`);
      if (this.handlers.onRoomJoined) {
        this.handlers.onRoomJoined(data.room);
      }
    });

    this.socket.on(SocketEvent.ROOM_LEFT, (data) => {
      // console.log(`❌ Покинул комнату: ${data.room}`);
      if (this.handlers.onRoomLeft) {
        this.handlers.onRoomLeft(data.room);
      }
    });

    // События обновления статуса станка (согласно новой документации)
    this.socket.on(SocketEvent.MACHINE_STATUS_UPDATED, (data) => {
      // console.log(`🟢 Получено обновление статуса станка из комнаты product-machines:`, data);

      if (!data || typeof data !== 'object') {
        console.error('Недопустимые данные обновления статуса станка', data);
        return;
      }

      // Проверяем структуру данных согласно документации
      if (!data.machine || !data.machine.id) {
        console.error('Отсутствуют обязательные поля в данных станка', data);
        return;
      }

      // console.log(`📊 Детали обновления станка:
      //   - ID: ${data.machine.id}
      //   - Название: ${data.machine.name || 'Не указано'}
      //   - Статус: ${data.machine.status}
      //   - Сегмент ID: ${data.machine.segmentId || 'Не указан'}
      //   - Сегмент: ${data.machine.segmentName || 'Не указан'}
      //   - Время: ${data.timestamp || 'Не указано'}`);

      if (this.handlers.onMachineStatusUpdate) {
        this.handlers.onMachineStatusUpdate(data.machine);
      } else {
        console.warn('Обработчик onMachineStatusUpdate не установлен');
      }
    });
  }

  /**
   * Присоединяемся к комнате для событий о станках
   */
  public joinMachinesRoom(): void {
    if (!this.socket) {
      // console.log('Соединение не инициализировано, инициализируем...');
      this.initialize();
    }

    if (!this.socket) {
      console.error('Не удалось инициализировать соединение Socket.IO');
      return;
    }

    if (this.socket.connected) {
      // console.log('Подключение к комнате станков через событие:', SocketRoom.PRODUCT_MACHINES);
      this.socket.emit('joinRoom', { room: SocketRoom.PRODUCT_MACHINES });
      this.rooms.add(SocketRoom.PRODUCT_MACHINES);

      // console.log('Комната, к которой мы пытаемся присоединиться:', SocketRoom.PRODUCT_MACHINES);
    } else {
      // console.log('Socket.IO не подключен. Добавляем комнату в список для автоподключения после установления соединения');
      this.rooms.add(SocketRoom.PRODUCT_MACHINES);

      // Пытаемся подключиться, если соединение не установлено
      if (!this.socket.connected) {
        // console.log('Пытаемся установить соединение...');
        this.socket.connect();
      }
    }
  }

  /**
   * Присоединяемся к комнате согласно новой документации
   */
  public joinRoom(room: SocketRoom): void {
    if (!this.socket) {
      // console.log('Соединение не инициализировано, инициализируем...');
      this.initialize();
    }

    if (!this.socket) {
      console.error('Не удалось инициализировать соединение Socket.IO');
      return;
    }

    if (this.socket.connected) {
      // console.log(`Подключение к комнате: ${room}`);
      this.socket.emit('joinRoom', { room });
      this.rooms.add(room);
    } else {
      // console.log('Socket.IO не подключен. Добавляем комнату в список для автоподключения после установления соединения');
      this.rooms.add(room);

      // Пытаемся подключиться, если соединение не установлено
      if (!this.socket.connected) {
        // console.log('Пытаемся установить соединение...');
        this.socket.connect();
      }
    }
  }

  /**
   * Покидаем комнату согласно новой документации
   */
  public leaveRoom(room: SocketRoom): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Не удалось покинуть комнату: соединение не установлено');
      return;
    }

    // console.log(`Покидаем комнату: ${room}`);
    this.socket.emit('leaveRoom', { room });
    this.rooms.delete(room);
  }

  /**
   * Переподключение к ранее подключенным комнат��м
   */
  private rejoinRooms(): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Не удалось переподключиться к комнатам: соединение не установлено');
      return;
    }

    if (this.rooms.size === 0) {
      // console.log('Нет комнат для переподключения');
      return;
    }

    // console.log(`Переподключение к ${this.rooms.size} комнатам`);

    this.rooms.forEach(room => {
      // console.log(`Переподключение к комнате: ${room}`);
      this.socket?.emit('joinRoom', { room });
    });
  }

  /**
   * Устанавливает обработчики событий
   * @param handlers Объект с функциями-обработчиками
   */
  public setHandlers(handlers: SocketHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
    // console.log('Установлены новые обработчики:', Object.keys(handlers));
  }

  /**
   * Очищает обработчики событий
   */
  public clearHandlers(): void {
    // console.log('Очистка обработчиков событий');
    this.handlers = {};
  }

  /**
   * Закрывает соединение сокета
   */
  public disconnect(): void {
    if (!this.socket) {
      // console.log('Socket.IO соединение уже закрыто');
      return;
    }

    // console.log('Закрытие Socket.IO соединения');
    this.socket.disconnect();
    this.socket = null;
    this.rooms.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Проверяет, установлено ли соединение
   */
  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Проверяет состояние соединения и возвращает подробную информацию
   */
  public getStatus(): { connected: boolean, socket: boolean, rooms: string[] } {
    return {
      connected: this.isConnected(),
      socket: !!this.socket,
      rooms: Array.from(this.rooms)
    };
  }

  /**
   * Включает или отключает подробное логирование
   */
  public setVerboseLogging(enabled: boolean): void {
    this.verbose = enabled;
    // console.log(`Подробное логирование ${enabled ? 'включено' : 'отключено'}`);
  }

  /**
   * Принудительно переподключает клиент к серверу
   */
  public forceReconnect(): void {
    // console.log('Принудительное переподключение Socket.IO соединения');
    this.disconnect();
    this.initialize();
  }
}

// Экспортируем единственный экземпляр сервиса
export const socketService = new SocketService();