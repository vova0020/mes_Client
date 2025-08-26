import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MesPage from './modules/machineNoSmen_page/MachineNoSmen';
import AuthPage from './modules/auth/AuthPage';
import MasterPage from './modules/master_page/MasterPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './componentsGlobal/LoadingScreen';
import MachinePage from './modules/machine_page/MachinePage';
import MasterYpakPage from './modules/master_ypak_page/MasterYpakPage';
import YpakMachinePage from './modules/ypak_machin_page/YpakMachinePage';
import ComplectPage from './modules/complectPage/ComplectPage';
import SettingsPage from './modules/settings_page/SettingsPage';
import OrderManagementBlok from './modules/order_management/OrderManagementBlok';
import { WebSocketProvider } from './contexts/WebSocketContext';


function App() {
  return (
    <WebSocketProvider>
      <Router>
        <div className="App">
        <Routes>
          {/* Публичный маршрут для авторизации */}
          <Route path="/login" element={<AuthPage />} />
          
          {/* Защищенный маршрут для управления заказами */}
          <Route element={<ProtectedRoute requiredRoles={["admin", "management", "technologist"]} />}>
            <Route path="/order-management" element={<OrderManagementBlok />} />
          </Route>
          
          {/* Защищенные маршруты для операторов workplace БЕЗ финальных этапов - ОБНОВЛЕНО */}
          <Route element={<ProtectedRoute requiredRole="workplace" excludeFinalStage={true} />}>
            <Route path="/machine" element={<MachinePage />} />
          </Route>
          
          {/* Маршрут для workplace с noSmenTask */}
          <Route element={<ProtectedRoute requiredRole="workplace" requireNoSmenTask={true} />}>
            <Route path="/nosmenmachine" element={<MesPage />} />
          </Route>
          
          {/* Маршрут для роли nosmen */}
          <Route element={<ProtectedRoute requiredRole="nosmen" />}>
            <Route path="/nosmenmachine" element={<MesPage />} />
          </Route>
           
           <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route> 
          
          {/* Защищенные маршруты для обычных мастеров (без финальных этапов) и администраторов */}
           <Route element={<ProtectedRoute requiredRoles={["admin", "master"]} excludeFinalStage={true} />}>
            <Route path="/master" element={<MasterPage />} />
          </Route> 
          
          {/* Маршрут для мастеров упаковки (с финальными этапами) */}
           <Route element={<ProtectedRoute requiredRole="master" requireFinalStage={true} />}>
            <Route path="/ypak" element={<MasterYpakPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="workplace" requireFinalStage={true} />}>  
            <Route path="/ypakmachine" element={<YpakMachinePage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="complect" />}>
            <Route path="/complect" element={<ComplectPage />} />
          </Route> 
          


          
          {/* Главная страница - редирект на нужный маршрут */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
          
          {/* Обработка неизвестных маршрутов */}
           <Route path="*" element={<Navigate to="/login" replace />} /> 
        </Routes>
        </div>
      </Router>
    </WebSocketProvider>
  );
}

export default App;