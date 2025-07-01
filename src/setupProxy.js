// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Проксируем API‑запросы на ваш NestJS
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://85.198.83.197:5000',
      changeOrigin: true,
      ws: true,            // <— включаем поддержку WebSocket для /api, если там нужны WS
    })
  );

  // Проксируем HMR‑сокеты CRA DevServer
  app.use(
    '/sockjs-node',       // CRA по умолчанию использует SockJS для HMR
    createProxyMiddleware({
      target: 'http://85.198.83.197:3000',
      changeOrigin: true,
      ws: true,            // <— обязательно, чтобы проксировать Upgrade/Connection
    })
  );
};
