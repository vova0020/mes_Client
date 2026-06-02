import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, CircularProgress, Alert } from '@mui/material';
import { Search, Clear, Visibility, Edit, CheckCircle, Delete, Schedule, MonetizationOn } from '@mui/icons-material';
import styles from './SeriesOrderCreation.module.css';

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

const getStatusLabel = (status: OrderStatus): string => {
  const labels = {
    [OrderStatus.PRELIMINARY]: 'Предварительный',
    [OrderStatus.APPROVED]: 'Утвержден',
    [OrderStatus.LAUNCH_PERMITTED]: 'Разрешен к запуску',
    [OrderStatus.IN_PROGRESS]: 'В работе',
    [OrderStatus.COMPLETED]: 'Завершен',
    [OrderStatus.POSTPONED]: 'Отложен'
  };
  return labels[status] || status;
};

const getStatusClass = (status: OrderStatus): string => {
  const classes = {
    [OrderStatus.PRELIMINARY]: styles.preliminary,
    [OrderStatus.APPROVED]: styles.approved,
    [OrderStatus.LAUNCH_PERMITTED]: styles.launchPermitted,
    [OrderStatus.IN_PROGRESS]: styles.inProgress,
    [OrderStatus.COMPLETED]: styles.completed,
    [OrderStatus.POSTPONED]: styles.postponed
  };
  return classes[status] || styles.preliminary;
};

interface Props {
  onBack?: () => void;
}

const SeriesOrderCreation: React.FC<Props> = ({ onBack }) => {
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    fetchOrders,
    isCreating,
    isUpdating,
    isUpdatingStatus
  } = useProductionOrders();

  const {
    packages: availablePackages,
    loading: packagesLoading,
  } = usePackageDirectory();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [showPostponed, setShowPostponed] = useState(false);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    batchNumber: '',
    orderName: '',
    requiredDate: '',
    packages: []
  });

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
        .filter(pkg => pkg.quantity > 0 && (pkg.detailsCount || 0) > 0)
        .map(pkg => ({
          packageDirectoryId: pkg.packageId,
          quantity: pkg.quantity
        }));

      if (selectedPackages.length === 0) {
        alert('Выберите хотя бы одну упаковку с деталями');
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
    } catch (error: any) {
      console.error('Ошибка при создании заказа:', error);
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const handlePackageQuantityChange = useCallback((packageId: number, quantity: number) => {
    setOrderForm(prev => ({
      ...prev,
      packages: prev.packages.map(pkg => 
        pkg.packageId === packageId ? { ...pkg, quantity: quantity || 0 } : pkg
      )
    }));
  }, []);

  const handleApproveOrder = async (orderId: number) => {
    try {
      await updateOrderStatus(orderId, OrderStatus.APPROVED);
    } catch (error) {
      console.error('Ошибка при утверждении заказа:', error);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm('Удалить этот заказ?')) {
      try {
        await deleteOrder(orderId);
      } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
      }
    }
  };

  const handlePostponeOrder = async (orderId: number) => {
    if (window.confirm('Отложить этот заказ?')) {
      try {
        await orderManagementApi.postponeOrder(orderId);
        await fetchOrders();
      } catch (error) {
        console.error('Ошибка при отложении заказа:', error);
      }
    }
  };

  const filteredPackages = useMemo(() => {
    return orderForm.packages.filter(pkg => 
      !packageSearchQuery.trim() ||
      pkg.packageCode.toLowerCase().includes(packageSearchQuery.toLowerCase()) ||
      pkg.packageName.toLowerCase().includes(packageSearchQuery.toLowerCase())
    );
  }, [orderForm.packages, packageSearchQuery]);

  const filteredOrders = useMemo(() => {
    let result = showPostponed 
      ? orders.filter(order => order.status === OrderStatus.POSTPONED)
      : orders.filter(order => order.status !== OrderStatus.POSTPONED);

    if (selectedStatuses.length > 0) {
      result = result.filter(order => selectedStatuses.includes(order.status));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.batchNumber.toLowerCase().includes(query) ||
        order.orderName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [orders, showPostponed, selectedStatuses, searchQuery]);

  const handleStatusToggle = (status: OrderStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const availableStatuses = showPostponed 
    ? [OrderStatus.POSTPONED]
    : [OrderStatus.PRELIMINARY, OrderStatus.APPROVED, OrderStatus.LAUNCH_PERMITTED, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED];

  if (ordersLoading === 'loading' || packagesLoading === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {onBack && (
        <button onClick={onBack} className={styles.backButton}>
          ← Назад
        </button>
      )}

      <h2 className={styles.title}>
        <span className={styles.icon}>📦</span>
        Создание заказов серийного производства
      </h2>

      {(ordersError) && (
        <Alert severity="error" className={styles.alert}>
          {ordersError?.message || 'Произошла ошибка при загрузке данных'}
        </Alert>
      )}

      {/* Панель поиска и фильтров */}
      <div className={styles.filterPanel}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по номеру партии или названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearButton}>
              <Clear />
            </button>
          )}
        </div>

        <div className={styles.statusFilters}>
          {availableStatuses.map(status => (
            <button
              key={status}
              onClick={() => handleStatusToggle(status)}
              className={`${styles.statusChip} ${selectedStatuses.includes(status) ? styles.statusChipActive : ''} ${getStatusClass(status)}`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Таблица заказов */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>№ Партии</th>
              <th>Название</th>
              <th>Дата готовности</th>
              <th>Статус</th>
              <th>Прогресс</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  {showPostponed ? 'Нет отложенных заказов' : 'Нет заказов'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.orderId} className={styles.tableRow}>
                  <td>{order.batchNumber}</td>
                  <td>{order.orderName}</td>
                  <td>{new Date(order.requiredDate).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${order.completionPercentage}%` }} />
                      <span className={styles.progressText}>{order.completionPercentage}%</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Просмотр">
                        <Visibility />
                      </button>
                      <button className={styles.actionBtn} title="Расход">
                        <MonetizationOn />
                      </button>
                      <button 
                        className={styles.actionBtn} 
                        disabled={order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.COMPLETED}
                        title="Редактировать"
                      >
                        <Edit />
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleApproveOrder(order.orderId)}
                        disabled={order.status !== OrderStatus.PRELIMINARY || isUpdatingStatus}
                        title="Утвердить"
                      >
                        <CheckCircle />
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handlePostponeOrder(order.orderId)}
                        disabled={order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.POSTPONED}
                        title="Отложить"
                      >
                        <Schedule />
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleDeleteOrder(order.orderId)}
                        disabled={order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.COMPLETED}
                        title="Удалить"
                      >
                        <Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Кнопки управления */}
      <div className={styles.controlButtons}>
        <button 
          onClick={handleCreateOrder}
          disabled={isCreating || availablePackages.length === 0}
          className={styles.createButton}
        >
          {isCreating ? <CircularProgress size={16} /> : '+'} Создать заказ
        </button>
        <button className={styles.loadButton}>
          📤 Загрузить из Excel
        </button>
        <button 
          onClick={() => setShowPostponed(!showPostponed)}
          className={styles.toggleButton}
        >
          {showPostponed ? 'Показать активные' : 'Показать отложенные'}
        </button>
      </div>

      {/* Диалог создания заказа */}
      {isCreateDialogOpen && (
        <div className={styles.modal} onClick={() => setIsCreateDialogOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Создание нового заказа</h3>
              <button onClick={() => setIsCreateDialogOpen(false)} className={styles.closeButton}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>📦 Номер партии *</label>
                  <input
                    type="text"
                    value={orderForm.batchNumber}
                    onChange={(e) => setOrderForm({...orderForm, batchNumber: e.target.value})}
                    placeholder="Введите номер"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>📋 Название заказа *</label>
                  <input
                    type="text"
                    value={orderForm.orderName}
                    onChange={(e) => setOrderForm({...orderForm, orderName: e.target.value})}
                    placeholder="Введите название"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>📅 Дата готовности *</label>
                  <input
                    type="date"
                    value={orderForm.requiredDate}
                    onChange={(e) => setOrderForm({...orderForm, requiredDate: e.target.value})}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.packagesSection}>
                <label>📦 Состав заказа (упаковки)</label>
                
                <div className={styles.searchBox}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Поиск упаковок..."
                    value={packageSearchQuery}
                    onChange={(e) => setPackageSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {packageSearchQuery && (
                    <button onClick={() => setPackageSearchQuery('')} className={styles.clearButton}>
                      <Clear />
                    </button>
                  )}
                </div>

                <div className={styles.packagesList}>
                  <table className={styles.packagesTable}>
                    <thead>
                      <tr>
                        <th>Артикул</th>
                        <th>Название</th>
                        <th>Количество</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.map((pkg) => (
                        <tr key={pkg.packageId} className={pkg.quantity > 0 ? styles.selectedRow : ''}>
                          <td>{pkg.packageCode}</td>
                          <td>{pkg.packageName}</td>
                          <td>
                            <input
                              type="number"
                              value={pkg.quantity || ''}
                              onChange={(e) => handlePackageQuantityChange(pkg.packageId, parseInt(e.target.value) || 0)}
                              className={styles.quantityInput}
                              min="0"
                              placeholder="0"
                              disabled={!(pkg.detailsCount || 0)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setIsCreateDialogOpen(false)} className={styles.cancelButton}>
                Отмена
              </button>
              <button onClick={handleSaveOrder} disabled={isCreating} className={styles.saveButton}>
                {isCreating ? <CircularProgress size={16} /> : '✓'} Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesOrderCreation;
