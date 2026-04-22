import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Alert, CircularProgress, InputAdornment, Chip } from '@mui/material';
import { Edit, CheckCircle, Assignment, MonetizationOn, Visibility, ExpandMore, ExpandLess, Delete, Schedule, Search, Clear } from '@mui/icons-material';
import styles from './OrderCreation.module.css';
import { OrderUploadModal } from './OrderUploadModal';

// Импорты API и хуков
import { useProductionOrders } from '../../../hooks/productionOrdersHook';
import { usePackageDirectory } from '../../../hooks/packageDirectoryHook';
import { 
  OrderStatus, 
  CreateProductionOrderDto, 
  ProductionOrderResponseDto,
  CreatePackageDto,
  UpdateProductionOrderDto
} from '../../../api/productionOrdersApi/productionOrdersApi';
import { orderManagementApi } from '../../../api/orderManagementApi';

// Интерфейс для формы создания заказа
interface OrderFormData {
  batchNumber: string;
  orderName: string;
  requiredDate: string;
  packages: Array<{
    packageId: number;
    packageCode: string;
    packageName: string;
    quantity: number;
    detailsCount?: number;
  }>;
}

// Функция для преобразования статуса в читаемый вид
const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PRELIMINARY:
      return 'Предварительный';
    case OrderStatus.APPROVED:
      return 'Утвержден';
    case OrderStatus.LAUNCH_PERMITTED:
      return 'Разрешен к запуску';
    case OrderStatus.IN_PROGRESS:
      return 'В работе';
    case OrderStatus.COMPLETED:
      return 'Завершен';
    case OrderStatus.POSTPONED:
      return 'Отложен';
    default:
      return status;
  }
};

// Функция для получения CSS класса статуса
const getStatusClass = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PRELIMINARY:
      return 'preliminary';
    case OrderStatus.APPROVED:
      return 'approved';
    case OrderStatus.LAUNCH_PERMITTED:
      return 'launchPermitted';
    case OrderStatus.IN_PROGRESS:
      return 'inProgress';
    case OrderStatus.COMPLETED:
      return 'completed';
    case OrderStatus.POSTPONED:
      return 'postponed';
    default:
      return 'preliminary';
  }
};

interface Props {
  onBack?: () => void;
}

// Мемоизированный компонент строки упаковки
const PackageRow = React.memo<{
  pkg: {
    packageId: number;
    packageCode: string;
    packageName: string;
    quantity: number;
    detailsCount?: number;
  };
  onToggle: (packageId: number, checked: boolean) => void;
  onQuantityChange: (packageId: number, quantity: number) => void;
}>(({ pkg, onToggle, onQuantityChange }) => {
  const hasDetails = (pkg.detailsCount || 0) > 0;
  
  return (
    <tr 
      className={`${styles.packageRow} ${pkg.quantity > 0 ? styles.selectedPackageRow : ''}`}
      style={{ opacity: hasDetails ? 1 : 0.5 }}
    >
      <td className={styles.checkboxCell}>
        <Checkbox
          checked={pkg.quantity > 0}
          onChange={(e) => onToggle(pkg.packageId, e.target.checked)}
          size="small"
          disabled={!hasDetails}
        />
      </td>
      <td className={styles.articleCell}>
        <span className={styles.articleBadge}>{pkg.packageCode}</span>
        {!hasDetails && (
          <span style={{ marginLeft: '4px', fontSize: '10px', color: '#ff9800' }} title="Упаковка не содержит деталей">
            ⚠️
          </span>
        )}
      </td>
      <td className={styles.nameCell}>
        <span className={styles.packageName}>{pkg.packageName}</span>
      </td>
      <td className={styles.quantityCell}>
        <input
          type="number"
          value={pkg.quantity || ''}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseInt(e.target.value);
            if (!isNaN(value)) {
              onQuantityChange(pkg.packageId, value);
            }
          }}
          className={styles.quantityInput}
          min="0"
          placeholder="0"
          disabled={!hasDetails}
        />
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Перерисовываем только если изменилось количество или ID
  return prevProps.pkg.packageId === nextProps.pkg.packageId &&
         prevProps.pkg.quantity === nextProps.pkg.quantity;
});

const OrderCreation: React.FC<Props> = ({ onBack }) => {
  // Хуки для работы с API
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    selectedOrder,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    fetchOrders,
    selectOrder,
    clearSelection,
    isCreating,
    isUpdating,
    isUpdatingStatus
  } = useProductionOrders();

  const {
    packages: availablePackages,
    loading: packagesLoading,
    error: packagesError,
    isFetching: isPackagesFetching
  } = usePackageDirectory();

  // Локальное состояние для диалогов и форм
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompositionDialogOpen, setIsCompositionDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrderResponseDto | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ProductionOrderResponseDto | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<{ [key: string]: boolean }>({});
  const [showPostponed, setShowPostponed] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditUploadModalOpen, setIsEditUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    batchNumber: '',
    orderName: '',
    requiredDate: '',
    packages: []
  });

  // Инициализация формы с доступными упаковками
  useEffect(() => {
    if (availablePackages.length > 0) {
      setOrderForm(prev => ({
        ...prev,
        packages: availablePackages.map(pkg => ({
          packageId: pkg.packageId,
          packageCode: pkg.packageCode,
          packageName: pkg.packageName,
          quantity: 0,
          detailsCount: pkg.detailsCount
        }))
      }));
    }
  }, [availablePackages]);

  // Обработчики для создания заказа
  const handleCreateOrder = () => {
    setOrderForm({
      batchNumber: '',
      orderName: '',
      requiredDate: '',
      packages: availablePackages.map(pkg => ({
        packageId: pkg.packageId,
        packageCode: pkg.packageCode,
        packageName: pkg.packageName,
        quantity: 0,
        detailsCount: pkg.detailsCount
      }))
    });
    setPackageSearchQuery('');
    setIsCreateDialogOpen(true);
  };

  const handleSaveOrder = async () => {
    try {
      const selectedPackages: CreatePackageDto[] = orderForm.packages
        .filter(pkg => pkg.quantity > 0)
        .filter(pkg => (pkg.detailsCount || 0) > 0)
        .map(pkg => ({
          packageDirectoryId: pkg.packageId,
          quantity: pkg.quantity
        }));

      if (selectedPackages.length === 0) {
        alert('Выберите хотя бы одну упаковку с деталями для заказа');
        return;
      }

      if (!orderForm.batchNumber || !orderForm.orderName || !orderForm.requiredDate) {
        alert('Заполните все обязательные поля');
        return;
      }

      const createDto: CreateProductionOrderDto = {
        batchNumber: orderForm.batchNumber,
        orderName: orderForm.orderName,
        requiredDate: new Date(orderForm.requiredDate).toISOString(),
        status: OrderStatus.PRELIMINARY,
        packages: selectedPackages
      };

      await createOrder(createDto);
      setIsCreateDialogOpen(false);
      
      // Сброс формы
      setOrderForm({
        batchNumber: '',
        orderName: '',
        requiredDate: '',
        packages: availablePackages.map(pkg => ({
          packageId: pkg.packageId,
          packageCode: pkg.packageCode,
          packageName: pkg.packageName,
          quantity: 0
        }))
      });
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      
      // Детальное логирование ошибки
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Неизвестная ошибка';
        alert(`Ошибка при создании заказа: ${errorMessage}`);
      } else if (error.request) {
        alert('Ошибка: Сервер не отвечает. Проверьте подключение.');
      } else {
        alert(`Ошибка при создании заказа: ${error.message}`);
      }
    }
  };

  // Обработчики для редактирования заказа
  const handleEditOrder = (order: ProductionOrderResponseDto) => {
    if (order.status === OrderStatus.IN_PROGRESS) {
      alert('Нельзя редактировать заказы, которые находятся в работе');
      return;
    }
    if (order.status === OrderStatus.LAUNCH_PERMITTED) {
      alert('Нельзя редактировать заказы, которые разрешены к запуску');
      return;
    }
    
    setEditingOrder(order);
    
    // Загружаем данные заказа в форму
    const formPackages = availablePackages.map(pkg => {
      const orderPackage = order.packages?.find(op => op.packageId === pkg.packageId);
      const hasDetails = (pkg.detailsCount || 0) > 0;
      
      // Если упаковка без деталей - обнуляем количество, даже если оно было в заказе
      const quantity = hasDetails && orderPackage ? orderPackage.quantity : 0;
      
      return {
        packageId: pkg.packageId,
        packageCode: pkg.packageCode,
        packageName: pkg.packageName,
        quantity: quantity,
        detailsCount: pkg.detailsCount
      };
    });
    setOrderForm({
      batchNumber: order.batchNumber,
      orderName: order.orderName,
      requiredDate: order.requiredDate.split('T')[0],
      packages: formPackages
    });
    setPackageSearchQuery('');
    setIsEditDialogOpen(true);
  };

  const handleEditUploadSuccess = (parsedPackages: ParsedPackage[]) => {
    // Обновляем форму с данными из Excel
    const updatedPackages = orderForm.packages.map(pkg => {
      const parsedPkg = parsedPackages.find(p => 
        p.existingPackage?.packageId === pkg.packageId
      );
      return {
        ...pkg,
        quantity: parsedPkg ? parsedPkg.quantity : 0
      };
    });
    
    setOrderForm({
      ...orderForm,
      packages: updatedPackages
    });
    setIsEditUploadModalOpen(false);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      const selectedPackages: CreatePackageDto[] = orderForm.packages
        .filter(pkg => pkg.quantity > 0)
        .filter(pkg => (pkg.detailsCount || 0) > 0)
        .map(pkg => ({
          packageDirectoryId: pkg.packageId,
          quantity: pkg.quantity
        }));

      if (selectedPackages.length === 0) {
        alert('Выберите хотя бы одну упаковку с деталями для заказа');
        return;
      }

      if (!orderForm.batchNumber || !orderForm.orderName || !orderForm.requiredDate) {
        alert('Заполните все обязательные поля');
        return;
      }

      const updateDto: UpdateProductionOrderDto = {
        batchNumber: orderForm.batchNumber,
        orderName: orderForm.orderName,
        requiredDate: new Date(orderForm.requiredDate).toISOString(),
        packages: selectedPackages
      };

      await updateOrder(editingOrder.orderId, updateDto);
      setIsEditDialogOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Ошибка при обновлении заказа:', error);
      
      // Детальное логирование ошибки
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Неизвестная ошибка';
        alert(`Ошибка при обновлении заказа: ${errorMessage}`);
      } else if (error.request) {
        alert('Ошибка: Сервер не отвечает. Проверьте подключение.');
      } else {
        alert(`Ошибка при обновлении заказа: ${error.message}`);
      }
    }
  };

  // Обработчик утверждения заказа
  const handleApproveOrder = async (orderId: number) => {
    try {
      await updateOrderStatus(orderId, OrderStatus.APPROVED);
    } catch (error) {
      console.error('Ошибка при утверждении заказа:', error);
      alert('Ошибка при утверждении заказа. Попробуйте снова.');
    }
  };

  // Обработчики для упаковок (оптимизированные)
  const handlePackageQuantityChange = useCallback((packageId: number, quantity: number) => {
    setOrderForm(prev => ({
      ...prev,
      packages: prev.packages.map(pkg => 
        pkg.packageId === packageId ? { ...pkg, quantity: quantity || 0 } : pkg
      )
    }));
  }, []);

  const handlePackageToggle = useCallback((packageId: number, checked: boolean) => {
    setOrderForm(prev => ({
      ...prev,
      packages: prev.packages.map(pkg => 
        pkg.packageId === packageId ? { ...pkg, quantity: checked ? 1 : 0 } : pkg
      )
    }));
  }, []);

  // Обработчики для просмотра состава заказа
  const handleOrderComposition = (orderId: number) => {
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      setViewingOrder(order);
      setExpandedPackages({});
      setIsCompositionDialogOpen(true);
    }
  };

  const handlePackageExpand = (packageId: number) => {
    setExpandedPackages(prev => ({
      ...prev,
      [packageId]: !prev[packageId]
    }));
  };

  const handleOrderExpense = (orderId: number) => {
    alert(`Расход на заказ ${orderId} - функция в разработке`);
  };

  // Обработчик удаления заказа
  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await deleteOrder(orderId);
      } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
        alert('Ошибка при удалении заказа. Попробуйте снова.');
      }
    }
  };

  // Обработчик отложения заказа
  const handlePostponeOrder = async (orderId: number) => {
    if (window.confirm('Вы уверены, что хотите отложить этот заказ?')) {
      try {
        await orderManagementApi.postponeOrder(orderId);
        await fetchOrders(); // Обновляем список заказов
      } catch (error) {
        console.error('Ошибка при отложении заказа:', error);
        alert('Ошибка при отложении заказа. Попробуйте снова.');
      }
    }
  };

  // Debounced обработчик для поиска упаковок
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(packageSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [packageSearchQuery]);

  // Мемоизация отфильтрованных упаковок для диалогов
  const filteredPackages = useMemo(() => {
    const result = orderForm.packages.filter(pkg => 
      !debouncedSearchQuery.trim() ||
      pkg.packageCode.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      pkg.packageName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
    return result;
  }, [orderForm.packages, debouncedSearchQuery]);

  // Фильтрация заказов по статусу и поиску
  const filteredOrders = useMemo(() => {
    let result = showPostponed 
      ? orders.filter(order => order.status === OrderStatus.POSTPONED)
      : orders.filter(order => order.status !== OrderStatus.POSTPONED);

    // Фильтрация по выбранным статусам
    if (selectedStatuses.length > 0) {
      result = result.filter(order => selectedStatuses.includes(order.status));
    }

    // Поиск по номеру партии и названию заказа
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.batchNumber.toLowerCase().includes(query) ||
        order.orderName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [orders, showPostponed, selectedStatuses, searchQuery]);

  // Обработчики для фильтрации
  const handleStatusToggle = (status: OrderStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSearchQuery('');
  };

  // Доступные статусы для фильтрации
  const availableStatuses = showPostponed 
    ? [OrderStatus.POSTPONED]
    : [
        OrderStatus.PRELIMINARY,
        OrderStatus.APPROVED,
        OrderStatus.LAUNCH_PERMITTED,
        OrderStatus.IN_PROGRESS,
        OrderStatus.COMPLETED
      ];

  // Показыв��ем индикатор загрузки
  if (ordersLoading === 'loading' || packagesLoading === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Создание заказов</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <CircularProgress />
        </div>
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
          <h2 className={styles.title}>Создание заказов</h2>
        </div>
      </div>

      {/* Показываем ошибки, если есть */}
      {(ordersError || packagesError) && (
        <Alert severity="error" style={{ margin: '1rem 0' }}>
          {ordersError?.message || packagesError?.message || 'Произошла ошибка при загрузке данных'}
        </Alert>
      )}

      {/* Панель поиска и фильтрации */}
      <div className={styles.filterPanel}>
        <TextField
          placeholder="Поиск по номеру партии или названию заказа..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className={styles.searchIcon} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearButton}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <div className={styles.statusFilters}>
          <span className={styles.filterLabel}>Статусы:</span>
          {availableStatuses.map(status => (
            <Chip
              key={status}
              label={getStatusLabel(status)}
              onClick={() => handleStatusToggle(status)}
              className={`${styles.statusChip} ${selectedStatuses.includes(status) ? styles.statusChipActive : ''} ${styles[getStatusClass(status) + 'Chip']}`}
              variant={selectedStatuses.includes(status) ? "filled" : "outlined"}
            />
          ))}
          {(selectedStatuses.length > 0 || searchQuery) && (
            <Button
              size="small"
              onClick={handleClearFilters}
              className={styles.clearFiltersButton}
              startIcon={<Clear />}
            >
              Сбросить
            </Button>
          )}
        </div>
      </div>

      {/* Таблица заказов */}
      <div className={styles.tableContainer}>
        <TableContainer component={Paper} className={styles.table}>
          <Table>
            <TableHead>
              <TableRow className={styles.tableHeader}>
                <TableCell className={styles.headerCell}>Номер партии</TableCell>
                <TableCell className={styles.headerCell}>Название заказа</TableCell>
                <TableCell className={styles.headerCell}>Требуемая дата готовности</TableCell>
                <TableCell className={styles.headerCell}>Статус</TableCell>
                <TableCell className={styles.headerCell}>Прогресс</TableCell>
                <TableCell className={styles.headerCell}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    {showPostponed ? 'Нет отложенных заказов' : 'Нет заказов для отображения'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.orderId} className={styles.tableRow}>
                    <TableCell className={styles.cell}>{order.batchNumber}</TableCell>
                    <TableCell className={styles.cell}>{order.orderName}</TableCell>
                    <TableCell className={styles.cell}>
                      {new Date(order.requiredDate).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className={styles.cell}>
                      <span className={`${styles.status} ${styles[getStatusClass(order.status)]}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className={styles.cell}>
                      {order.completionPercentage}%
                    </TableCell>
                    <TableCell className={styles.cell}>
                      <div className={styles.actionButtons}>
                        <IconButton 
                          onClick={() => handleOrderComposition(order.orderId)}
                          className={styles.actionButton}
                          title="Состав заказа"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleOrderExpense(order.orderId)}
                          className={styles.actionButton}
                          title="Расход на заказ"
                        >
                          <MonetizationOn />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleEditOrder(order)}
                          className={styles.actionButton}
                          disabled={order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.LAUNCH_PERMITTED || isUpdating}
                          title="Редактировать заказ"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleApproveOrder(order.orderId)}
                          className={styles.actionButton}
                          disabled={order.status !== OrderStatus.PRELIMINARY || isUpdatingStatus}
                          title="Утвердить заказ"
                        >
                          {isUpdatingStatus ? <CircularProgress size={20} /> : <CheckCircle />}
                        </IconButton>
                        <IconButton 
                          onClick={() => handlePostponeOrder(order.orderId)}
                          className={styles.actionButton}
                          disabled={order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.POSTPONED}
                          title="Отложить заказ"
                        >
                          <Schedule />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteOrder(order.orderId)}
                          className={styles.actionButton}
                          disabled={order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.COMPLETED}
                          title="Удалить заказ"
                        >
                          <Delete />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Кнопки управления */}
      <div className={styles.controlButtons}>
        <Button 
          variant="contained" 
          onClick={handleCreateOrder}
          className={styles.createButton}
          disabled={isCreating || availablePackages.length === 0}
        >
          {isCreating ? <CircularProgress size={20} /> : 'Создать заказ'}
        </Button>
        <Button 
          variant="contained" 
          onClick={() => setIsUploadModalOpen(true)}
          className={styles.loadButton}
        >
          Загрузить из Excel
        </Button>
        <Button 
          variant={showPostponed ? "contained" : "outlined"}
          onClick={() => setShowPostponed(!showPostponed)}
          className={styles.toggleButton}
        >
          {showPostponed ? 'Показать активные' : 'Показать отложенные'}
        </Button>
      </div>

      {/* Диалог создания заказа */}
      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className={styles.dialog}
      >
        <DialogTitle className={styles.dialogTitle}>Создание нового заказа</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <div className={styles.formContainer}>
            <TextField
              label="Номер производственной партии *"
              value={orderForm.batchNumber}
              onChange={(e) => setOrderForm({...orderForm, batchNumber: e.target.value})}
              fullWidth
              margin="normal"
              className={styles.textField}
              required
            />
            <TextField
              label="Название заказа *"
              value={orderForm.orderName}
              onChange={(e) => setOrderForm({...orderForm, orderName: e.target.value})}
              fullWidth
              margin="normal"
              className={styles.textField}
              required
            />
            <TextField
              label="Требуемая дата готовности *"
              type="date"
              value={orderForm.requiredDate}
              onChange={(e) => setOrderForm({...orderForm, requiredDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              className={styles.textField}
              required
            />
            
            <div className={styles.packagesSection}>
              <h4 className={styles.packagesTitle}>Состав заказа (упаковки)</h4>
              {isPackagesFetching ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <CircularProgress size={24} />
                </div>
              ) : orderForm.packages.length === 0 ? (
                <Alert severity="warning">
                  Нет доступных упаковок для выбора. Сначала создайте упаковки в справочнике.
                </Alert>
              ) : (
                <>
                  <Alert severity="info" style={{ marginBottom: '1rem' }}>
                    ⚠️ Упаковки без деталей отмечены значком ⚠️ и недоступны для выбора. Добавьте детали в упаковку в справочнике.
                  </Alert>
                  <TextField
                    placeholder="Поиск упаковок..."
                    value={packageSearchQuery}
                    onChange={(e) => setPackageSearchQuery(e.target.value)}
                    size="small"
                    className={styles.packageSearchField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search style={{ fontSize: 18, color: '#8c8c8c' }} />
                        </InputAdornment>
                      ),
                      endAdornment: packageSearchQuery && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setPackageSearchQuery('')}
                            style={{ padding: 4 }}
                          >
                            <Clear style={{ fontSize: 16 }} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <div className={styles.packagesList} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                      Показано: {filteredPackages.length} из {orderForm.packages.length} упаковок
                    </div>
                    <table className={styles.packageTable}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                        <tr>
                          <th className={styles.checkboxCell}>Выбор</th>
                          <th className={styles.articleCell}>Артикул</th>
                          <th className={styles.nameCell}>Название</th>
                          <th className={styles.quantityCell}>Количество</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPackages.map((pkg) => (
                          <PackageRow
                            key={pkg.packageId}
                            pkg={pkg}
                            onToggle={handlePackageToggle}
                            onQuantityChange={handlePackageQuantityChange}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button 
            onClick={() => setIsCreateDialogOpen(false)} 
            className={styles.cancelButton}
            disabled={isCreating}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSaveOrder} 
            variant="contained" 
            className={styles.saveButton}
            disabled={isCreating || orderForm.packages.length === 0}
          >
            {isCreating ? <CircularProgress size={20} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования заказа */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className={styles.dialog}
      >
        <DialogTitle className={styles.dialogTitle}>Редактирование заказа</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <div className={styles.formContainer}>
            <TextField
              label="Номер производственной партии *"
              value={orderForm.batchNumber}
              onChange={(e) => setOrderForm({...orderForm, batchNumber: e.target.value})}
              fullWidth
              margin="normal"
              className={styles.textField}
              required
            />
            <TextField
              label="Название заказа *"
              value={orderForm.orderName}
              onChange={(e) => setOrderForm({...orderForm, orderName: e.target.value})}
              fullWidth
              margin="normal"
              className={styles.textField}
              required
            />
            <TextField
              label="Требуемая дата готовности *"
              type="date"
              value={orderForm.requiredDate}
              onChange={(e) => setOrderForm({...orderForm, requiredDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              className={styles.textField}
              required
            />
            
            <div className={styles.packagesSection}>
              <h4 className={styles.packagesTitle}>Текущий состав заказа</h4>
              {editingOrder?.status === OrderStatus.IN_PROGRESS ? (
                <Alert severity="warning" style={{ margin: '1rem 0' }}>
                  Нельзя изменять состав упаковок у заказа, который находится в работе.
                </Alert>
              ) : (
                <Alert severity="info" style={{ margin: '1rem 0' }}>
                  При изменении упаковок все существующие упаковки будут заменены новыми. 
                  Прогресс выполнении упаковок будет сброшен.
                </Alert>
              )}
              
              {/* Показываем текущие упаковки заказа */}
              {editingOrder?.packages && editingOrder.packages.length > 0 ? (
                <div style={{ marginBottom: '1rem' }}>
                  <h5 style={{ margin: '0.5rem 0', color: '#666' }}>Текущие упаковки в заказе:</h5>
                  <TableContainer component={Paper} style={{ marginBottom: '1rem' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Код упаковки</strong></TableCell>
                          <TableCell><strong>Название</strong></TableCell>
                          <TableCell><strong>Количество</strong></TableCell>
                          <TableCell><strong>Прогресс</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editingOrder.packages.map((pkg) => (
                          <TableRow key={pkg.packageId}>
                            <TableCell>{pkg.packageCode}</TableCell>
                            <TableCell>{pkg.packageName}</TableCell>
                            <TableCell>{pkg.quantity}</TableCell>
                            <TableCell>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div 
                                  style={{ 
                                    width: '60px', 
                                    height: '6px', 
                                    backgroundColor: '#e0e0e0', 
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <div 
                                    style={{ 
                                      width: `${pkg.completionPercentage}%`, 
                                      height: '100%', 
                                      backgroundColor: pkg.completionPercentage === 100 ? '#4caf50' : '#2196f3',
                                      transition: 'width 0.3s ease'
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                  {pkg.completionPercentage}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              ) : (
                <Alert severity="info" style={{ margin: '1rem 0' }}>
                  В заказе пока нет упаковок.
                </Alert>
              )}

              {/* Форма для изменения упаковок */}
              {editingOrder?.status !== OrderStatus.IN_PROGRESS && (
                <>
                  <Alert severity="info" style={{ marginBottom: '1rem' }}>
                    ⚠️ Упаковки без деталей отмечены значком ⚠️ и недоступны для выбора.
                  </Alert>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.5rem 0' }}>
                    <h5 style={{ margin: 0, color: '#666' }}>Изменить состав упаковок:</h5>
                    <button 
                      onClick={() => setIsEditUploadModalOpen(true)}
                      disabled={isUpdating}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(to bottom, #1890ff, #0050b3)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)',
                        textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
                        opacity: isUpdating ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isUpdating) {
                          e.currentTarget.style.background = 'linear-gradient(to bottom, #0050b3, #003a8c)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(24, 144, 255, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to bottom, #1890ff, #0050b3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.3)';
                      }}
                    >
                      📤 Загрузить из Excel
                    </button>
                  </div>
                  {isPackagesFetching ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                      <CircularProgress size={24} />
                    </div>
                  ) : orderForm.packages.length === 0 ? (
                    <Alert severity="warning">
                      Нет доступных упаковок для выбора. Сначала создайте упаковки в справочнике.
                    </Alert>
                  ) : (
                    <>
                      <TextField
                        placeholder="Поиск упаковок..."
                        value={packageSearchQuery}
                        onChange={(e) => setPackageSearchQuery(e.target.value)}
                        size="small"
                        className={styles.packageSearchField}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search style={{ fontSize: 18, color: '#8c8c8c' }} />
                            </InputAdornment>
                          ),
                          endAdornment: packageSearchQuery && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setPackageSearchQuery('')}
                                style={{ padding: 4 }}
                              >
                                <Clear style={{ fontSize: 16 }} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                      <div className={styles.packagesList} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                          Показано: {filteredPackages.length} из {orderForm.packages.length} упаковок
                        </div>
                        <table className={styles.packageTable}>
                          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                            <tr>
                              <th className={styles.checkboxCell}>Выбор</th>
                              <th className={styles.articleCell}>Артикул</th>
                              <th className={styles.nameCell}>Название</th>
                              <th className={styles.quantityCell}>Количество</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPackages.map((pkg) => (
                              <PackageRow
                                key={pkg.packageId}
                                pkg={pkg}
                                onToggle={handlePackageToggle}
                                onQuantityChange={handlePackageQuantityChange}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button 
            onClick={() => setIsEditDialogOpen(false)} 
            className={styles.cancelButton}
            disabled={isUpdating}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleUpdateOrder} 
            variant="contained" 
            className={styles.saveButton}
            disabled={isUpdating}
          >
            {isUpdating ? <CircularProgress size={20} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра состава заказа */}
      <Dialog 
        open={isCompositionDialogOpen} 
        onClose={() => setIsCompositionDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        className={styles.dialog}
      >
        <DialogTitle className={styles.dialogTitle}>
          Состав заказа: {viewingOrder?.orderName}
        </DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <div className={styles.compositionContainer}>
            {/* {viewingOrder && (
              <div className={styles.compositionInfo}>
                <p><strong>Номер партии:</strong> {viewingOrder.batchNumber}</p>
                <p><strong>Статус:</strong> {getStatusLabel(viewingOrder.status)}</p>
                <p><strong>Прогресс:</strong> {viewingOrder.completionPercentage}%</p>
                <p><strong>Дата создания:</strong> {new Date(viewingOrder.createdAt).toLocaleDateString('ru-RU')}</p>
                <p><strong>Требуемая дата:</strong> {new Date(viewingOrder.requiredDate).toLocaleDateString('ru-RU')}</p>
                {viewingOrder.completedAt && (
                  <p><strong>Дата завершения:</strong> {new Date(viewingOrder.completedAt).toLocaleDateString('ru-RU')}</p>
                )}
              </div>
            )} */}
            
            {viewingOrder?.packages && viewingOrder.packages.length > 0 ? (
              <TableContainer component={Paper} className={styles.compositionTable}>
                <Table>
                  <TableHead>
                    <TableRow className={styles.tableHeader}>
                      <TableCell className={styles.headerCell}>Артикул упаковки</TableCell>
                      <TableCell className={styles.headerCell}>Упаковка</TableCell>
                      <TableCell className={styles.headerCell}>Количество</TableCell>
                      <TableCell className={styles.headerCell}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingOrder.packages.map((pkg) => (
                      <React.Fragment key={pkg.packageId}>
                        <TableRow className={styles.tableRow}>
                          <TableCell className={styles.cell}>{pkg.packageCode}</TableCell>
                          <TableCell className={styles.cell}>{pkg.packageName}</TableCell>
                          <TableCell className={styles.cell}>{pkg.quantity}</TableCell>
                          <TableCell className={styles.cell}>
                            <IconButton
                              onClick={() => handlePackageExpand(pkg.packageId)}
                              className={styles.expandButton}
                              title="Показать детали"
                            >
                              {expandedPackages[pkg.packageId] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} className={styles.collapseCell}>
                            <Collapse in={expandedPackages[pkg.packageId]} timeout="auto" unmountOnExit>
                              <div className={styles.detailsContainer}>
                                <h5 className={styles.detailsTitle}>Детали упаковки:</h5>
                                {pkg.details && pkg.details.length > 0 ? (
                                  <TableContainer component={Paper} className={styles.detailsTable}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow className={styles.detailsTableHeader}>
                                          <TableCell className={styles.detailsHeaderCell}>Артикул детали</TableCell>
                                          <TableCell className={styles.detailsHeaderCell}>Деталь</TableCell>
                                          <TableCell className={styles.detailsHeaderCell}>Количество на упаковку</TableCell>
                                          <TableCell className={styles.detailsHeaderCell}>Общее количество</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {pkg.details.map((detail) => (
                                          <TableRow key={detail.partId} className={styles.detailsTableRow}>
                                            <TableCell className={styles.detailsCell}>{detail.partCode}</TableCell>
                                            <TableCell className={styles.detailsCell}>{detail.partName}</TableCell>
                                            <TableCell className={styles.detailsCell}>{detail.quantityPerPackage}</TableCell>
                                            <TableCell className={styles.detailsCell}>{detail.totalQuantity}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                ) : (
                                  <p>Нет деталей в упаковке</p>
                                )}
                              </div>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <div className={styles.emptyComposition}>
                <p>В заказе нет упаковок</p>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button onClick={() => setIsCompositionDialogOpen(false)} className={styles.cancelButton}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно загрузки из Excel */}
      {isUploadModalOpen && (
        <OrderUploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}

      {/* Модальное окно загрузки из Excel для редактирования */}
      {isEditUploadModalOpen && (
        <OrderUploadModal 
          onClose={() => setIsEditUploadModalOpen(false)}
          isEditMode={true}
          onEditSuccess={handleEditUploadSuccess}
        />
      )}
    </div>
  );
};

interface ParsedPackage {
  code: string;
  name: string;
  quantity: number;
  exists?: boolean;
  existingPackage?: {
    packageId: number;
    packageCode: string;
    packageName: string;
  };
}

export default OrderCreation;