import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для запросов
axiosInstance.interceptors.request.use(
  (config) => {
    // Здесь можно добавить токен авторизации если нужно
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для ответов
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Здесь можно добавить обработку ошибок
    if (error.response?.status === 401) {
      // Обработка ошибки авторизации
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);