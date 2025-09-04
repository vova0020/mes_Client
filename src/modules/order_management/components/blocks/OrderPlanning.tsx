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
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  CircularProgress,
  Alert
} from '@mui/material';
import { Visibility, MonetizationOn, PlayArrow, ExpandMore, ExpandLess, DragIndicator } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './OrderPlanning.module.css';
import { useOrderManagement } from '../../../hooks';
import { 
  transformOrderToPlanning, 
  transformOrderDetailsToPlanning,
  transformStatusToApi,
  getStatusText,
  canApproveForLaunch,
  OrderPlanningData,
  Package,
  Detail
} from '../../utils/dataTransformers';

// Типы данных
interface ProductionFlow {
  id: string;
  name: string;
  description: string;
}

// Компонент для перетаскиваемой строки заказа
interface SortableOrderRowProps {
  order: OrderPlanningData;
  onComposition: (orderId: string) => void;
  onExpense: (orderId: string) => void;
  onAllowStart: (orderId: string) => void;
  onDateChange: (orderId: string, field: keyof OrderPlanningData, value: string) => void;
}

const SortableOrderRow: React.FC<SortableOrderRowProps> = ({
  order,
  onComposition,
  onExpense,
  onAllowStart,
  onDateChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={styles.tableRow}
      data-dragging={isDragging}
    >
      {/* Drag Handle */}
      <TableCell className={styles.cell}>
        <div
          {...attributes}
          {...listeners}
          className={styles.dragHandle}
          style={{ cursor: 'grab', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <DragIndicator />
        </div>
      </TableCell>

      {/* Заказ */}
      <TableCell className={styles.cell}>
        <div className={styles.orderName}>{order.name}</div>
      </TableCell>

      {/* Требуемая дата готовности */}
      <TableCell className={styles.cell}>
        {order.requiredDate}
      </TableCell>

      {/* Действия */}
      <TableCell className={styles.cell}>
        <div className={styles.actionButtons}>
          <IconButton 
            onClick={() => onComposition(order.id)}
            className={styles.actionButton}
            title="Состав заказа"
          >
            <Visibility />
          </IconButton>
          <IconButton 
            onClick={() => onExpense(order.id)}
            className={styles.actionButton}
            title="Расход на заказ"
          >
            <MonetizationOn />
          </IconButton>
        </div>
      </TableCell>

      {/* Текущий статус */}
      <TableCell className={styles.cell}>
        <span className={`${styles.status} ${styles[order.status]}`}>
          {getStatusText(order.status)}
        </span>
      </TableCell>

      {/* Разрешить запуск */}
      <TableCell className={styles.cell}>
        <Button
          variant="contained"
          size="small"
          onClick={() => onAllowStart(order.id)}
          disabled={order.status !== 'approved'}
          className={styles.startButton}
          startIcon={<PlayArrow />}
        >
          Разрешить
        </Button>
      </TableCell>

      {/* Дата запуска */}
      <TableCell className={styles.cell}>
        <div className={styles.dateGroup}>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>План:</span>
            <TextField
              type="date"
              value={order.plannedStartDate}
              onChange={(e) => onDateChange(order.id, 'plannedStartDate', e.target.value)}
              size="small"
              className={styles.dateField}
              InputLabelProps={{ shrink: true }}
            />
          </div>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Факт:</span>
            <TextField
              type="date"
              value={order.actualStartDate}
              onChange={(e) => onDateChange(order.id, 'actualStartDate', e.target.value)}
              size="small"
              className={styles.dateField}
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </div>
      </TableCell>

      {/* Дата выпуска */}
      <TableCell className={styles.cell}>
        <div className={styles.dateGroup}>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>План:</span>
            <TextField
              type="date"
              value={order.plannedReleaseDate}
              onChange={(e) => onDateChange(order.id, 'plannedReleaseDate', e.target.value)}
              size="small"
              className={styles.dateField}
              InputLabelProps={{ shrink: true }}
            />
          </div>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Факт:</span>
            <TextField
              type="date"
              value={order.actualReleaseDate}
              onChange={(e) => onDateChange(order.id, 'actualReleaseDate', e.target.value)}
              size="small"
              className={styles.dateField}
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

interface Props {
  onBack?: () => void;
}

const OrderPlanning: React.FC<Props> = ({ onBack }) => {
  // Используем хук для управления заказами
  const {
    orders: apiOrders,
    orderDetails,
    selectedOrderId,
    loading,
    error,
    setSelectedOrderId,
    approveOrderForLaunch,
    updateOrderPriority,
    refetchOrders,
  } = useOrderManagement();

  // Локальное состояние для UI
  const [isCompositionDialogOpen, setIsCompositionDialogOpen] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<{ [key: string]: boolean }>({});
  const [localOrders, setLocalOrders] = useState<OrderPlanningData[]>([]);

  // Настройка сенсоров для drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Преобразуем данные API в формат компонента
  useEffect(() => {
    if (apiOrders) {
      const transformedOrders = apiOrders
        .map(transformOrderToPlanning)
        .sort((a, b) => {
          const priorityA = a.priority || 999;
          const priorityB = b.priority || 999;
          return priorityA - priorityB;
        });
      setLocalOrders(transformedOrders);
      console.log('Sorted orders:', transformedOrders.map(o => ({ id: o.id, name: o.name, priority: o.priority })));
    }
  }, [apiOrders]);

  // Обработчик изменения основного потока
  const handleMainFlowChange = (orderId: string, newFlowId: string) => {
    setLocalOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, mainFlowId: newFlowId }
          : order
      )
    );
    // TODO: Здесь можно добавить API вызов для сохранения изменений
  };

  // Обработчик изменения даты
  const handleDateChange = (orderId: string, field: keyof OrderPlanningData, value: string) => {
    setLocalOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, [field]: value }
          : order
      )
    );
    // TODO: Здесь можно добавить API вызов для сохранения изменений
  };

  // Обработчик разрешения запуска
  const handleAllowStart = async (orderId: string) => {
    try {
      const result = await approveOrderForLaunch(parseInt(orderId));
      if (result) {
        // Данные автоматически обновятся через хук
        console.log('Заказ разрешен к запуску:', result);
      }
    } catch (error) {
      console.error('Ошибка при разрешении запуска:', error);
    }
  };

  // Обработчик завершения перетаскивания
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localOrders.findIndex((order) => order.id === active.id);
      const newIndex = localOrders.findIndex((order) => order.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Обновляем локальный порядок
        const newOrders = arrayMove(localOrders, oldIndex, newIndex);
        setLocalOrders(newOrders);
        
        // Отправляем новый приоритет на сервер
        const newPriority = newIndex + 1;
        try {
          await updateOrderPriority(parseInt(active.id as string), newPriority);
        } catch (error) {
          console.error('Ошибка при изменении приоритета:', error);
          // Возвращаем исходный порядок при ошибке
          setLocalOrders(localOrders);
        }
      }
    }
  };

  // Обработчики для кнопок действий
  const handleOrderComposition = async (orderId: string) => {
    try {
      setSelectedOrderId(parseInt(orderId));
      setExpandedPackages({});
      setIsCompositionDialogOpen(true);
    } catch (error) {
      console.error('Ошибка при загрузке состава заказа:', error);
    }
  };

  const handleOrderExpense = (orderId: string) => {
    alert(`Расход на заказ ${orderId} - функция в разработке`);
  };

  const handlePackageExpand = (packageId: string) => {
    setExpandedPackages(prev => ({
      ...prev,
      [packageId]: !prev[packageId]
    }));
  };



  // Получить данные для про��мотра заказа
  const getViewingOrderData = (): OrderPlanningData | null => {
    if (!orderDetails) return null;
    return transformOrderDetailsToPlanning(orderDetails);
  };

  const viewingOrder = getViewingOrderData();

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
          <h2 className={styles.title}>Планирование заказов</h2>
        </div>
      </div>

      {/* Таблица планирования заказов */}
      <div className={styles.tableContainer}>
        <TableContainer component={Paper} className={styles.table}>
          <Table>
            <TableHead>
              <TableRow className={styles.tableHeader}>
                <TableCell className={styles.headerCell}>Порядок</TableCell>
                <TableCell className={styles.headerCell}>Название заказа</TableCell>
                <TableCell className={styles.headerCell}>Требуемая дата готовности</TableCell>
                <TableCell className={styles.headerCell}>Действия</TableCell>
                <TableCell className={styles.headerCell}>Текущий статус</TableCell>
                <TableCell className={styles.headerCell}>Разрешить запуск</TableCell>
                <TableCell className={styles.headerCell}>Дата запуска</TableCell>
                <TableCell className={styles.headerCell}>Дата выпуска</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                    <CircularProgress />
                    <div style={{ marginTop: '10px' }}>Загрузка заказов...</div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                    <Alert severity="error">{error}</Alert>
                  </TableCell>
                </TableRow>
              ) : localOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                    Нет заказов для отображения
                  </TableCell>
                </TableRow>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localOrders.map(order => order.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localOrders.map((order) => (
                      <SortableOrderRow
                        key={order.id}
                        order={order}
                        onComposition={handleOrderComposition}
                        onExpense={handleOrderExpense}
                        onAllowStart={handleAllowStart}
                        onDateChange={handleDateChange}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Диалог просмотра состава заказа */}
      <Dialog 
        open={isCompositionDialogOpen} 
        onClose={() => setIsCompositionDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        className={styles.dialog}
      >
        <DialogTitle className={styles.dialogTitle}>
          Состав заказа: {viewingOrder?.name}
        </DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <div className={styles.compositionContainer}>
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
                      <React.Fragment key={pkg.id}>
                        <TableRow className={styles.tableRow}>
                          <TableCell className={styles.cell}>{pkg.articleNumber}</TableCell>
                          <TableCell className={styles.cell}>{pkg.name}</TableCell>
                          <TableCell className={styles.cell}>{pkg.quantity}</TableCell>
                          <TableCell className={styles.cell}>
                            <IconButton
                              onClick={() => handlePackageExpand(pkg.id)}
                              className={styles.expandButton}
                              title="Показать детали"
                            >
                              {expandedPackages[pkg.id] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} className={styles.collapseCell}>
                            <Collapse in={expandedPackages[pkg.id]} timeout="auto" unmountOnExit>
                              <div className={styles.detailsContainer}>
                                <h5 className={styles.detailsTitle}>Детали упаковки:</h5>
                                <TableContainer component={Paper} className={styles.detailsTable}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow className={styles.detailsTableHeader}>
                                        <TableCell className={styles.detailsHeaderCell}>Артикул детали</TableCell>
                                        <TableCell className={styles.detailsHeaderCell}>Деталь</TableCell>
                                        <TableCell className={styles.detailsHeaderCell}>Количество на упаковку</TableCell>
                                        <TableCell className={styles.detailsHeaderCell}>Общее количество</TableCell>
                                        {/* <TableCell className={styles.detailsHeaderCell}>Единица измерения</TableCell> */}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {pkg.details.map((detail) => (
                                        <TableRow key={detail.id} className={styles.detailsTableRow}>
                                          <TableCell className={styles.detailsCell}>{detail.articleNumber}</TableCell>
                                          <TableCell className={styles.detailsCell}>{detail.name}</TableCell>
                                          <TableCell className={styles.detailsCell}>{detail.quantity}</TableCell>
                                          <TableCell className={styles.detailsCell}>
                                            {detail.quantity * pkg.quantity}
                                          </TableCell>
                                          {/* <TableCell className={styles.detailsCell}>{detail.unit}</TableCell> */}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
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
    </div>
  );
};

export default OrderPlanning;