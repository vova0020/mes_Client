// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const apiTarget = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const apiTargetWS = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

  // Проксируем API-запросы на ваш NestJS backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      ws: true, // Для WebSocket, если используете
    })
  );

  // Проксируем Socket.IO (если используете)
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      ws: true, // ОБЯЗАТЕЛЬНО для Socket.IO
    })
  );

  // ⚠️ УДАЛИТЕ этот блок - /sockjs-node должен оставаться локальным!
  // Это внутренний механизм React для hot reload
  // НЕ проксируйте его на внешний сервер!
};