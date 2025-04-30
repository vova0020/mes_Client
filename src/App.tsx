import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MesPage from './modules/machine_page/MesPage';
import AuthPage from './modules/auth/AuthPage';
import MasterPage from './modules/master_page/MasterPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './componentsGlobal/LoadingScreen';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Публичный маршрут для авторизации */}
          <Route path="/login" element={<AuthPage />} />
          
          {/* Защищенные маршруты для операторов */}
          <Route element={<ProtectedRoute requiredRole="operator" />}>
            <Route path="/machine" element={<MesPage />} />
          </Route>
          
          {/* Защищенные маршруты для мастеров */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/master" element={<MasterPage />} />
          </Route>
          {/* Защищенные маршруты для мастеров */}
          <Route element={<ProtectedRoute requiredRole="master" />}>
            <Route path="/master" element={<MasterPage />} />
          </Route>
          
          {/* Главная страница - редирект на нужный маршрут */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Обработка неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;