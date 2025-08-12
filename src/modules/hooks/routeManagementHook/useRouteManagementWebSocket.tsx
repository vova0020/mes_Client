import { useEffect, useCallback } from 'react';
import { RouteInfoDto } from '../../api/routeManagementApi';

// Интерфейс для WebSocket события обновления маршрута детали
export interface PartRouteUpdatedEvent {
  orderId: number;
  batchNumber: string;
  partRouteUpdate: {
    partId: number;
    partCode: string;
    partName: string;
    previousRoute: RouteInfoDto;
    newRoute: RouteInfoDto;
    updatedAt: string;
  };
  timestamp: string;
}

// Тип для обработчика события
export type PartRouteUpdatedHandler = (event: PartRouteUpdatedEvent) => void;

/**
 * Хук для работы с WebSocket событиями управления маршрутами
 * @param onPartRouteUpdated - Обработчик события обновления маршрута детали
 * @param enabled - Включить/выключить подписку на события (по умолчанию true)
 * @returns Объект с методами управления подпиской
 */
export const useRouteManagementWebSocket = (
  onPartRouteUpdated?: PartRouteUpdatedHandler,
  enabled: boolean = true
) => {
  // Обработчик WebSocket сообщений
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Проверяем, что это событие обновления маршрута детали
      if (data.type === 'partRouteUpdated' && onPartRouteUpdated) {
        console.log('Получено WebSocket событие обновления маршрута детали:', data);
        onPartRouteUpdated(data.payload as PartRouteUpdatedEvent);
      }
    } catch (error) {
      console.error('Ошибка при обработке WebSocket сообщения:', error);
    }
  }, [onPartRouteUpdated]);

  // Подключение к WebSocket
  useEffect(() => {
    if (!enabled || !onPartRouteUpdated) {
      return;
    }

    // Здесь должна быть логика подключения к WebSocket
    // Пример реализации (нужно адаптировать под вашу WebSocket инфраструктуру):
    
    let websocket: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        // Замените на ваш WebSocket URL
        const wsUrl = process.env.REACT_APP_API_URL || "" ;
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
          console.log('WebSocket подключен для управления маршрутами');
          
          // Подписываемся на события управления маршрутами
          websocket?.send(JSON.stringify({
            type: 'subscribe',
            channel: 'route-management'
          }));
        };
        
        websocket.onmessage = handleWebSocketMessage;
        
        websocket.onclose = (event) => {
          console.log('WebSocket отключен:', event.reason);
          
          // Переподключение через 5 секунд
          if (enabled) {
            setTimeout(connectWebSocket, 5000);
          }
        };
        
        websocket.onerror = (error) => {
          console.error('Ошибка WebSocket:', error);
        };
        
      } catch (error) {
        console.error('Ошибка при подключении к WebSocket:', error);
      }
    };
    
    connectWebSocket();
    
    // Очистка при размонтировании
    return () => {
      if (websocket) {
        websocket.close();
        websocket = null;
      }
    };
  }, [enabled, onPartRouteUpdated, handleWebSocketMessage]);

  return {
    // Здесь можно добавить дополнительные методы для управления WebSocket соединением
    // например, методы для ручного переподключения, отправки сообщений и т.д.
  };
};