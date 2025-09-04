import React, { useState, useEffect, useMemo } from 'react';
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
  Box,
  TextField,
  InputAdornment,
  IconButton,
  TableSortLabel
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';
import { 
  useRouteManagement
} from '../../../hooks';
import { 
  OrderForRoutesResponseDto, 
  PartForRouteManagementDto, 
  RouteInfoDto 
} from '../../../api/routeManagementApi';
import styles from './DetailRouteManagement.module.css';

interface Props {
  onBack?: () => void;
}

const DetailRouteManagement: React.FC<Props> = ({ onBack }) => {
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
  
  // Состояние для фильтрации и сортировки заказов
  const [orderFilter, setOrderFilter] = useState('');
  const [orderSort, setOrderSort] = useState<{
    field: 'orderName' | 'batchNumber' | 'status' | 'totalParts' | null;
    direction: 'asc' | 'desc';
  }>({ field: null, direction: 'asc' });
  
  // Состояние для фильтрации и сортировки деталей
  const [partFilter, setPartFilter] = useState('');
  const [partSort, setPartSort] = useState<{
    field: 'partCode' | 'partName' | 'materialName' | 'size' | 'totalQuantity' | 'routeName' | null;
    direction: 'asc' | 'desc';
  }>({ field: null, direction: 'asc' });
  
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

  

  // WebSocket интеграция уже встроена в useRouteManagement

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

  // Фильтрация и сортировка заказов
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const searchTerm = orderFilter.toLowerCase().trim();
      if (!searchTerm) return true;
      
      return order.orderName.toLowerCase().includes(searchTerm) ||
             order.batchNumber.toString().includes(searchTerm) ||
             getOrderStatusText(order.status).toLowerCase().includes(searchTerm) ||
             `№${order.batchNumber}`.toLowerCase().includes(searchTerm);
    });

    if (!orderSort.field) return filtered;

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (orderSort.field) {
        case 'orderName':
          aValue = a.orderName;
          bValue = b.orderName;
          break;
        case 'batchNumber':
          aValue = a.batchNumber;
          bValue = b.batchNumber;
          break;
        case 'status':
          aValue = getOrderStatusText(a.status);
          bValue = getOrderStatusText(b.status);
          break;
        case 'totalParts':
          aValue = a.totalParts;
          bValue = b.totalParts;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return orderSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return orderSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, orderFilter, orderSort]);

  // Фильтрация и сортировка деталей
  const filteredAndSortedParts = useMemo(() => {
    if (!selectedOrderParts) return [];
    
    let filtered = selectedOrderParts.parts.filter(part => {
      const searchTerm = partFilter.toLowerCase().trim();
      if (!searchTerm) return true;
      
      return part.partCode.toLowerCase().includes(searchTerm) ||
             part.partName.toLowerCase().includes(searchTerm) ||
             part.materialName.toLowerCase().includes(searchTerm) ||
             part.size.toLowerCase().includes(searchTerm) ||
             part.currentRoute.routeName.toLowerCase().includes(searchTerm) ||
             part.totalQuantity.toString().includes(searchTerm);
    });

    if (!partSort.field) return filtered;

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (partSort.field) {
        case 'partCode':
          aValue = a.partCode;
          bValue = b.partCode;
          break;
        case 'partName':
          aValue = a.partName;
          bValue = b.partName;
          break;
        case 'materialName':
          aValue = a.materialName;
          bValue = b.materialName;
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'totalQuantity':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'routeName':
          aValue = a.currentRoute.routeName;
          bValue = b.currentRoute.routeName;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return partSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return partSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [selectedOrderParts, partFilter, partSort]);

  // Обработчики сортировки (3 состояния: none -> asc -> desc -> none)
  const handleOrderSort = (field: Exclude<typeof orderSort.field, null>) => {
    setOrderSort(prev => {
      if (prev.field !== field) {
        return { field, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return { field: null, direction: 'asc' };
    });
  };

  const handlePartSort = (field: Exclude<typeof partSort.field, null>) => {
    setPartSort(prev => {
      if (prev.field !== field) {
        return { field, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return { field: null, direction: 'asc' };
    });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <Button 
              onClick={onBack} 
              variant="outlined" 
              size="small"
              sx={{ 
                minWidth: 'auto',
                padding: '6px 12px',
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '14px'
              }}
            >
              ← Назад
            </Button>
          )}
          <h2 className={styles.title}>Управление маршрутами деталей</h2>
        </div>
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
          
          {/* Фильтр для заказов */}
          <div className={styles.filterContainer}>
            <TextField
              size="small"
              placeholder="Поиск заказов..."
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              className={styles.filterInput}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className={styles.searchIcon} />
                  </InputAdornment>
                ),
                endAdornment: orderFilter && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setOrderFilter('')}
                      className={styles.clearButton}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
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
              <div style={{ flex: 1, overflow: 'auto', padding: '16px', paddingTop: 0 }}>
                <TableContainer component={Paper} className={styles.table}>
                <Table>
                  <TableHead>
                    <TableRow className={styles.tableHeader}>
                      <TableCell className={styles.headerCell}>
                        <TableSortLabel
                          active={orderSort.field === 'orderName'}
                          direction={orderSort.field === 'orderName' ? orderSort.direction : 'asc'}
                          onClick={() => handleOrderSort('orderName')}
                          className={styles.sortLabel}
                        >
                          Заказ
                        </TableSortLabel>
                      </TableCell>
                      <TableCell className={styles.headerCell}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSortedOrders.map((order) => (
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
              </div>
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
              {/* Фильтр для деталей */}
              <div className={styles.filterContainer}>
                <TextField
                  size="small"
                  placeholder="Поиск деталей..."
                  value={partFilter}
                  onChange={(e) => setPartFilter(e.target.value)}
                  className={styles.filterInput}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className={styles.searchIcon} />
                      </InputAdornment>
                    ),
                    endAdornment: partFilter && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setPartFilter('')}
                          className={styles.clearButton}
                        >
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </div>
              
              {partsLoading === 'loading' ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <div style={{ flex: 1, overflow: 'auto', padding: '16px', paddingTop: 0 }}>
                  <TableContainer component={Paper} className={styles.table}>
                  <Table>
                    <TableHead>
                      <TableRow className={styles.tableHeader}>
                        <TableCell className={styles.headerCell}>
                          <TableSortLabel
                            active={partSort.field === 'partCode'}
                            direction={partSort.field === 'partCode' ? partSort.direction : 'asc'}
                            onClick={() => handlePartSort('partCode')}
                            className={styles.sortLabel}
                          >
                            Код детали
                          </TableSortLabel>
                        </TableCell>
                        <TableCell className={styles.headerCell}>
                          <TableSortLabel
                            active={partSort.field === 'partName'}
                            direction={partSort.field === 'partName' ? partSort.direction : 'asc'}
                            onClick={() => handlePartSort('partName')}
                            className={styles.sortLabel}
                          >
                            Название детали
                          </TableSortLabel>
                        </TableCell>
                        <TableCell className={styles.headerCell}>
                          <TableSortLabel
                            active={partSort.field === 'materialName'}
                            direction={partSort.field === 'materialName' ? partSort.direction : 'asc'}
                            onClick={() => handlePartSort('materialName')}
                            className={styles.sortLabel}
                          >
                            Материал
                          </TableSortLabel>
                        </TableCell>
                        <TableCell className={styles.headerCell}>
                          <TableSortLabel
                            active={partSort.field === 'size'}
                            direction={partSort.field === 'size' ? partSort.direction : 'asc'}
                            onClick={() => handlePartSort('size')}
                            className={styles.sortLabel}
                          >
                            Размер
                          </TableSortLabel>
                        </TableCell>
                        <TableCell className={styles.headerCell}>
                          <TableSortLabel
                            active={partSort.field === 'totalQuantity'}
                            direction={partSort.field === 'totalQuantity' ? partSort.direction : 'asc'}
                            onClick={() => handlePartSort('totalQuantity')}
                            className={styles.sortLabel}
                          >
                            Количество
                          </TableSortLabel>
                        </TableCell>
                        <TableCell className={styles.headerCell}>
                          <TableSortLabel
                            active={partSort.field === 'routeName'}
                            direction={partSort.field === 'routeName' ? partSort.direction : 'asc'}
                            onClick={() => handlePartSort('routeName')}
                            className={styles.sortLabel}
                          >
                            Тех. маршрут
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAndSortedParts.map((part) => (
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
                </div>
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