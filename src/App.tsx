import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MesPage from './modules/machineNoSmen_page/MasterPage';
import AuthPage from './modules/auth/AuthPage';
import MasterPage from './modules/master_page/MasterPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './componentsGlobal/LoadingScreen';
import MachinePage from './modules/machine_page/MachinePage';
import MasterYpakPage from './modules/master_ypak_page/MasterYpakPage';
import YpakMachinePage from './modules/ypak_machin_page/YpakMachinePage';
import ComplectPage from './modules/complectPage/ComplectPage';
import SettingsPage from './modules/settings_page/SettingsPage';
import DetailsReferencePage from './modules/detailsReference/DetailsReference';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Публичный маршрут для авторизации */}
          <Route path="/login" element={<AuthPage />} />
          
          {/* Защищенные маршруты для операторов */}
          <Route element={<ProtectedRoute requiredRole="workplace" />}>
            <Route path="/machine" element={<MachinePage />} />
          </Route>
          {/* <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/settings" element={<DetailsReferencePage />} />
          </Route> */}
          {/* 10 дешовая
          30 
          безлимит */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          
          {/* Защищенные маршруты для мастеров и администраторов */}
          <Route element={<ProtectedRoute requiredRoles={["admin", "master"]} />}>
            <Route path="/master" element={<MasterPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="nosmen" />}>
            <Route path="/nosmenmachine" element={<MesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="ypakmaster" />}>
            <Route path="/ypakmaster" element={<MasterYpakPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="ypakoperator" />}>
            <Route path="/ypakmachine" element={<YpakMachinePage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="complect" />}>
            <Route path="/complect" element={<ComplectPage />} />
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