import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Snackbar,
  Typography,
  Box
} from '@mui/material';
import { 
  useRouteManagement, 
  useRouteManagementWebSocket,
  PartRouteUpdatedEvent 
} from '../../../hooks';
import { 
  OrderForRoutesResponseDto, 
  PartForRouteManagementDto, 
  RouteInfoDto 
} from '../../../api/routeManagementApi';
import styles from './DetailRouteManagement.module.css';

const DetailRouteManagement: React.FC = () => {
  // Используем хук для управления маршрутами
  const {
    routes,
    orders,
    selectedOrderParts,
    routesLoading,
    ordersLoading,
    partsLoading,
    updatingRoute,
    routesError,
    ordersError,
    partsError,
    updateError,
    fetchOrderParts,
    updatePartRoute,
    clearOrderParts,
    clearErrors
  } = useRouteManagement();

  // Локальное состояние для выбранного заказа
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  // Состояние для уведомлений
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Обработчик выбора заказа
  const handleOrderSelect = async (order: OrderForRoutesResponseDto) => {
    try {
      setSelectedOrderId(order.orderId);
      await fetchOrderParts(order.orderId);
    } catch (error) {
      console.error('Ошибка при загрузке деталей заказа:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при загрузке деталей заказа',
        severity: 'error'
      });
    }
  };

  // Обработчик изменения технологического маршрута
  const handleTechRouteChange = async (partId: number, newRouteId: number) => {
    try {
      const result = await updatePartRoute(partId, newRouteId);
      setSnackbar({
        open: true,
        message: `Маршрут детали "${result.partCode}" успешно изменен на "${result.newRoute.routeName}"`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при изменении маршрута:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при изменении маршрута детали',
        severity: 'error'
      });
    }
  };

  // Обработчик кнопки "Баланс загрузки участков"
  const handleLoadBalance = (orderId: number) => {
    setSnackbar({
      open: true,
      message: `Баланс загрузки участков для заказа ${orderId} - функция в разработке`,
      severity: 'info'
    });
  };

  // Обработчик закрытия уведомления
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Обработчик WebSocket события обновления маршрута
  const handlePartRouteUpdated = (event: PartRouteUpdatedEvent) => {
    console.log('Получено WebSocket событие обновления маршрута:', event);
    
    // Показываем уведомление о том, что маршрут был изменен другим пользовател��м
    setSnackbar({
      open: true,
      message: `Маршрут детали "${event.partRouteUpdate.partCode}" был изменен другим пользователем на "${event.partRouteUpdate.newRoute.routeName}"`,
      severity: 'info'
    });

    // Если это заказ, который мы сейчас просматриваем, обновляем данные
    if (selectedOrderId === event.orderId && selectedOrderParts) {
      fetchOrderParts(event.orderId);
    }
  };

  // Подключаем WebSocket для получения обновлений в реальном времени
  useRouteManagementWebSocket(handlePartRouteUpdated, true);

  // Получить статус заказа на русском языке
  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'PRELIMINARY':
        return 'Предварительный';
      case 'APPROVED':
        return 'Утверждено';
      default:
        return status;
    }
  };

  // Очистка выбора при размонтировании компонента
  useEffect(() => {
    return () => {
      clearOrderParts();
      clearErrors();
    };
  }, [clearOrderParts, clearErrors]);

  // Отображение ошибок загрузки
  if (routesError || ordersError) {
    return (
      <div className={styles.container}>
        <Alert severity="error">
          Ошибка при загрузке данных: {routesError?.message || ordersError?.message}
        </Alert>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Управление маршрутами деталей</h2>
      </div>

      <div className={styles.content}>
        {/* Левая панель - список заказов */}
        <div className={styles.ordersPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Заказы</h3>
            {ordersLoading === 'loading' && (
              <CircularProgress size={20} />
            )}
          </div>
          
          <div className={styles.tableContainer}>
            {ordersLoading === 'loading' ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : orders.length === 0 ? (
              <Box p={3}>
                <Typography variant="body2" color="textSecondary">
                  Нет доступных заказов для управления маршрутами
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} className={styles.table}>
                <Table>
                  <TableHead>
                    <TableRow className={styles.tableHeader}>
                      <TableCell className={styles.headerCell}>Заказ</TableCell>
                      <TableCell className={styles.headerCell}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow 
                        key={order.orderId} 
                        className={`${styles.tableRow} ${selectedOrderId === order.orderId ? styles.selectedRow : ''}`}
                        onClick={() => handleOrderSelect(order)}
                        style={{ cursor: 'pointer' }}
                      >
                        <TableCell className={styles.cell}>
                          <div className={styles.orderInfo}>
                            <span className={styles.orderName}>
                              {order.orderName} (№{order.batchNumber})
                            </span>
                            <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                              {getOrderStatusText(order.status)}
                            </span>
                            <Typography variant="caption" color="textSecondary">
                              Деталей: {order.totalParts}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell className={styles.cell}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadBalance(order.orderId);
                            }}
                            className={styles.balanceButton}
                          >
                            Баланс загрузки участков
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </div>

        {/* Правая панель - детали выбранного заказа */}
        <div className={styles.detailsPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              {selectedOrderParts ? 
                `Детали заказа: ${selectedOrderParts.order.orderName}` : 
                'Выберите заказ'
              }
            </h3>
            {partsLoading === 'loading' && (
              <CircularProgress size={20} />
            )}
          </div>

          {partsError && (
            <Alert severity="error" sx={{ m: 2 }}>
              Ошибка при загрузке деталей: {partsError.message}
            </Alert>
          )}

          {selectedOrderParts ? (
            <div className={styles.tableContainer}>
              {partsLoading === 'loading' ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} className={styles.table}>
                  <Table>
                    <TableHead>
                      <TableRow className={styles.tableHeader}>
                        <TableCell className={styles.headerCell}>Код детали</TableCell>
                        <TableCell className={styles.headerCell}>Название детали</TableCell>
                        <TableCell className={styles.headerCell}>Материал</TableCell>
                        <TableCell className={styles.headerCell}>Размер</TableCell>
                        <TableCell className={styles.headerCell}>Количество</TableCell>
                        <TableCell className={styles.headerCell}>Тех. маршрут</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrderParts.parts.map((part) => (
                        <TableRow key={part.partId} className={styles.tableRow}>
                          <TableCell className={styles.cell}>{part.partCode}</TableCell>
                          <TableCell className={styles.cell}>{part.partName}</TableCell>
                          <TableCell className={styles.cell}>{part.materialName}</TableCell>
                          <TableCell className={styles.cell}>{part.size}</TableCell>
                          <TableCell className={styles.cell}>{part.totalQuantity}</TableCell>
                          <TableCell className={styles.cell}>
                            <FormControl size="small" className={styles.routeSelect}>
                              <Select
                                value={part.currentRoute.routeId}
                                onChange={(e: SelectChangeEvent<number>) => 
                                  handleTechRouteChange(part.partId, Number(e.target.value))
                                }
                                className={styles.selectInput}
                                disabled={updatingRoute}
                              >
                                {selectedOrderParts.availableRoutes.map((route) => (
                                  <MenuItem key={route.routeId} value={route.routeId}>
                                    {route.routeName}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Typography variant="body1" color="textSecondary">
                Выберите заказ из списка слева для просмотра деталей
              </Typography>
            </div>
          )}
        </div>
      </div>

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DetailRouteManagement;