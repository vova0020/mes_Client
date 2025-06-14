
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, Alert, Snackbar } from '@mui/material';
import RouteList from './components/RouteList';
import RouteForm from './components/RouteForm';
import RouteDetails from './components/RouteDetails';
import { 
  useRoutes, 
  useCreateRoute, 
  useUpdateRouteComplete, 
  useDeleteRoute, 
  useAvailableStagesLevel1,
  UpdateRouteCompleteDto
} from './hooks/useRoutes';
import { Route, CreateRouteDto } from './api/routes.api';

// Создаем QueryClient локально для этого компонента
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Внутренний компонент с логикой маршрутов
const RouteSettingsContent: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Запросы
  const { data: routes = [], isLoading: routesLoading, error: routesError } = useRoutes();
  const { data: availableStages = [] } = useAvailableStagesLevel1();

  // Мутации
  const createRouteMutation = useCreateRoute();
  const updateRouteCompleteMutation = useUpdateRouteComplete();
  const deleteRouteMutation = useDeleteRoute();

  // Обработчики
  const handleOpenForm = (route?: Route) => {
    setEditingRoute(route || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRoute(null);
  };

  const handleSaveRoute = async (routeData: CreateRouteDto) => {
    try {
      if (editingRoute) {
        // Редактирование существующего маршрута
        // Преобразуем данные для UpdateRouteCompleteDto, устанавливая sequenceNumber
        const updateData: UpdateRouteCompleteDto = {
          routeName: routeData.routeName,
          stages: (routeData.stages || []).map((stage, index) => ({
            stageId: stage.stageId,
            substageId: stage.substageId,
            sequenceNumber: stage.sequenceNumber ?? index + 1 // Используем переданное значение или индекс + 1
          }))
        };

        const updatedRoute = await updateRouteCompleteMutation.mutateAsync({
          id: editingRoute.routeId,
          data: updateData
        });

        setNotification({
          open: true,
          message: 'Маршрут успешно обновлен',
          severity: 'success'
        });

        // Обновляем выбранный маршрут если он был отредактирован
        if (selectedRoute?.routeId === editingRoute.routeId) {
          setSelectedRoute(updatedRoute);
        }
      } else {
        // Создание нового маршрута
        const newRoute = await createRouteMutation.mutateAsync(routeData);
        
        setNotification({
          open: true,
          message: 'Маршрут успешно создан',
          severity: 'success'
        });

        // Выбираем новосозданный маршрут
        setSelectedRoute(newRoute);
      }

      handleCloseForm();
    } catch (error: any) {
      console.error('Ошибка при сохранении маршрута:', error);
      
      let errorMessage = 'Ошибка при сохранении маршрута';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleDeleteRoute = async (routeId: number) => {
    const routeToDelete = routes.find(r => r.routeId === routeId);
    const routeName = routeToDelete?.routeName || 'маршрут';
    
    if (!window.confirm(`Вы уверены, что хотите удалить "${routeName}"?`)) {
      return;
    }

    try {
      await deleteRouteMutation.mutateAsync(routeId);
      
      // Если удаленный маршрут был выбран, сбрасываем выбор
      if (selectedRoute?.routeId === routeId) {
        setSelectedRoute(null);
      }

      setNotification({
        open: true,
        message: `Маршрут "${routeName}" успешно удален`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Ошибка при удалении маршрута:', error);
      
      let errorMessage = 'Ошибка при удалении маршрута';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (routesError) {
    return (
      <Alert severity="error">
        Ошибка при загрузке маршрутов: {routesError.message}
      </Alert>
    );
  }

  const isFormLoading = createRouteMutation.isPending || updateRouteCompleteMutation.isPending;

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      {/* Список маршрутов */}
      <Box sx={{ flex: '0 0 400px' }}>
        <RouteList
          routes={routes}
          selectedRoute={selectedRoute}
          setSelectedRoute={setSelectedRoute}
          onEdit={handleOpenForm}
          onDelete={handleDeleteRoute}
          isDeleting={deleteRouteMutation.isPending}
        />
      </Box>

      {/* Детали маршрута */}
      <Box sx={{ flex: 1 }}>
        <RouteDetails selectedRoute={selectedRoute} />
      </Box>

      {/* Форма создания/редактирования */}
      <RouteForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveRoute}
        route={editingRoute}
        availableStages={availableStages}
        isEditing={!!editingRoute}
        isLoading={isFormLoading}
      />

      {/* Уведомления */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Основной компонент с QueryClientProvider
const RouteSettings: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouteSettingsContent />
    </QueryClientProvider>
  );
};

export default RouteSettings;
