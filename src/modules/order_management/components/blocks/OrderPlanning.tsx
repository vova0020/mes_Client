import React, { useState } from 'react';
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
  Collapse
} from '@mui/material';
import { Visibility, MonetizationOn, PlayArrow, ExpandMore, ExpandLess } from '@mui/icons-material';
import styles from './OrderPlanning.module.css';

// Типы данных
interface ProductionFlow {
  id: string;
  name: string;
  description: string;
}

interface Detail {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Package {
  id: string;
  name: string;
  quantity: number;
  details: Detail[];
}

interface OrderPlanningData {
  id: string;
  name: string;
  requiredDate: string;
  status: 'preliminary' | 'approved' | 'allowedToStart' | 'inProgress' | 'completed';
  mainFlowId: string;
  secondaryFlowCompletionDate: string;
  startDate: string;
  plannedStartDate: string;
  actualStartDate: string;
  plannedReleaseDate: string;
  actualReleaseDate: string;
  packages: Package[];
}

// Моковые данные производственных потоков
const mockProductionFlows: ProductionFlow[] = [
  { id: '1', name: 'Основной поток А', description: 'Главная производственная линия' },
  { id: '2', name: 'Основной поток Б', description: 'Вторая производственная линия' },
  { id: '3', name: 'Основной поток В', description: 'Третья производственная линия' },
  { id: '4', name: 'Резервный поток', description: 'Резервная производственная линия' },
];

// Моковые данные деталей для упаковок
const mockDetails: { [key: string]: Detail[] } = {
  '1': [
    { id: 'd1', name: 'Деталь А1', quantity: 5, unit: 'шт' },
    { id: 'd2', name: 'Деталь А2', quantity: 3, unit: 'шт' },
    { id: 'd3', name: 'Деталь А3', quantity: 2, unit: 'кг' },
  ],
  '2': [
    { id: 'd4', name: 'Деталь Б1', quantity: 8, unit: 'шт' },
    { id: 'd5', name: 'Деталь Б2', quantity: 1, unit: 'м' },
  ],
  '3': [
    { id: 'd6', name: 'Деталь В1', quantity: 10, unit: 'шт' },
    { id: 'd7', name: 'Деталь В2', quantity: 4, unit: 'шт' },
    { id: 'd8', name: 'Деталь В3', quantity: 1.5, unit: 'кг' },
  ],
  '4': [
    { id: 'd9', name: 'Деталь Г1', quantity: 6, unit: 'шт' },
    { id: 'd10', name: 'Деталь Г2', quantity: 2, unit: 'л' },
  ],
  '5': [
    { id: 'd11', name: 'Деталь Д1', quantity: 12, unit: 'шт' },
    { id: 'd12', name: 'Деталь Д2', quantity: 3, unit: 'шт' },
    { id: 'd13', name: 'Деталь Д3', quantity: 0.8, unit: 'кг' },
  ],
};

// Моковые данные упаковок
const mockPackages: Package[] = [
  { id: '1', name: 'Упаковка А', quantity: 2, details: mockDetails['1'] },
  { id: '2', name: 'Упаковка Б', quantity: 3, details: mockDetails['2'] },
  { id: '3', name: 'Упаковка В', quantity: 1, details: mockDetails['3'] },
  { id: '4', name: 'Упаковка Г', quantity: 4, details: mockDetails['4'] },
  { id: '5', name: 'Упаковка Д', quantity: 2, details: mockDetails['5'] },
];

// Моковые данные заказов для планирования
const mockOrdersData: OrderPlanningData[] = [
  {
    id: '1',
    name: 'Заказ №001',
    requiredDate: '2024-02-15',
    status: 'approved',
    mainFlowId: '1',
    secondaryFlowCompletionDate: '2024-02-10',
    startDate: '2024-01-20',
    plannedStartDate: '2024-01-20',
    actualStartDate: '',
    plannedReleaseDate: '2024-02-14',
    actualReleaseDate: '',
    packages: [mockPackages[0], mockPackages[1]],
  },
  {
    id: '2',
    name: 'Заказ №002',
    requiredDate: '2024-02-20',
    status: 'allowedToStart',
    mainFlowId: '2',
    secondaryFlowCompletionDate: '2024-02-18',
    startDate: '2024-01-25',
    plannedStartDate: '2024-01-25',
    actualStartDate: '2024-01-25',
    plannedReleaseDate: '2024-02-19',
    actualReleaseDate: '',
    packages: [mockPackages[2], mockPackages[3]],
  },
  {
    id: '3',
    name: 'Заказ №003',
    requiredDate: '2024-02-25',
    status: 'inProgress',
    mainFlowId: '1',
    secondaryFlowCompletionDate: '2024-02-22',
    startDate: '2024-01-30',
    plannedStartDate: '2024-01-30',
    actualStartDate: '2024-01-30',
    plannedReleaseDate: '2024-02-24',
    actualReleaseDate: '',
    packages: [mockPackages[0], mockPackages[2], mockPackages[4]],
  },
  {
    id: '4',
    name: 'Заказ №004',
    requiredDate: '2024-03-01',
    status: 'completed',
    mainFlowId: '3',
    secondaryFlowCompletionDate: '2024-02-26',
    startDate: '2024-02-01',
    plannedStartDate: '2024-02-01',
    actualStartDate: '2024-02-01',
    plannedReleaseDate: '2024-02-28',
    actualReleaseDate: '2024-02-27',
    packages: [mockPackages[1], mockPackages[3]],
  },
  {
    id: '5',
    name: 'Заказ №005',
    requiredDate: '2024-03-05',
    status: 'preliminary',
    mainFlowId: '2',
    secondaryFlowCompletionDate: '2024-03-02',
    startDate: '2024-02-05',
    plannedStartDate: '2024-02-05',
    actualStartDate: '',
    plannedReleaseDate: '2024-03-04',
    actualReleaseDate: '',
    packages: [mockPackages[4]],
  },
];

const OrderPlanning: React.FC = () => {
  const [orders, setOrders] = useState<OrderPlanningData[]>(mockOrdersData);
  const [isCompositionDialogOpen, setIsCompositionDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<OrderPlanningData | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<{ [key: string]: boolean }>({});

  // Обработчик изменения основного потока
  const handleMainFlowChange = (orderId: string, newFlowId: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, mainFlowId: newFlowId }
          : order
      )
    );
  };

  // Обработчик изменения даты
  const handleDateChange = (orderId: string, field: keyof OrderPlanningData, value: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, [field]: value }
          : order
      )
    );
  };

  // Обработчик разрешения запуска
  const handleAllowStart = (orderId: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId && order.status === 'approved'
          ? { ...order, status: 'allowedToStart' }
          : order
      )
    );
  };

  // Обработчики для кнопок действий
  const handleOrderComposition = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setViewingOrder(order);
      setExpandedPackages({});
      setIsCompositionDialogOpen(true);
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

  // Получить название производственного потока по ID
  const getFlowName = (flowId: string) => {
    const flow = mockProductionFlows.find(f => f.id === flowId);
    return flow ? flow.name : 'Неизвестный поток';
  };

  // Получить текст статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'preliminary': return 'Предварительный';
      case 'approved': return 'Утверждено';
      case 'allowedToStart': return 'Разрешено к запуску';
      case 'inProgress': return 'В работе';
      case 'completed': return 'Завершен';
      default: return status;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Планирование заказов</h2>
      </div>

      {/* Таблица планирования заказов */}
      <div className={styles.tableContainer}>
        <TableContainer component={Paper} className={styles.table}>
          <Table>
            <TableHead>
              <TableRow className={styles.tableHeader}>
                <TableCell className={styles.headerCell}>Зак��з</TableCell>
                <TableCell className={styles.headerCell}>Требуемая дата готовности</TableCell>
                <TableCell className={styles.headerCell}>Действия</TableCell>
                <TableCell className={styles.headerCell}>Текущий статус</TableCell>
                <TableCell className={styles.headerCell}>Разрешить запуск</TableCell>
                <TableCell className={styles.headerCell}>Основной поток</TableCell>
                <TableCell className={styles.headerCell}>Дата завершения второстепенного потока</TableCell>
                <TableCell className={styles.headerCell}>Дата запуска</TableCell>
                <TableCell className={styles.headerCell}>Дата выпуска</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className={styles.tableRow}>
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
                        onClick={() => handleOrderComposition(order.id)}
                        className={styles.actionButton}
                        title="Состав заказа"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleOrderExpense(order.id)}
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
                      onClick={() => handleAllowStart(order.id)}
                      disabled={order.status !== 'approved'}
                      className={styles.startButton}
                      startIcon={<PlayArrow />}
                    >
                      Разрешить
                    </Button>
                  </TableCell>

                  {/* Основной поток */}
                  <TableCell className={styles.cell}>
                    <FormControl size="small" className={styles.flowSelect}>
                      <Select
                        value={order.mainFlowId}
                        onChange={(e: SelectChangeEvent) => 
                          handleMainFlowChange(order.id, e.target.value)
                        }
                        className={styles.selectInput}
                      >
                        {mockProductionFlows.map((flow) => (
                          <MenuItem key={flow.id} value={flow.id}>
                            {flow.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  {/* Дата завершения второстепенного потока */}
                  <TableCell className={styles.cell}>
                    <TextField
                      type="date"
                      value={order.secondaryFlowCompletionDate}
                      onChange={(e) => handleDateChange(order.id, 'secondaryFlowCompletionDate', e.target.value)}
                      size="small"
                      className={styles.dateField}
                      InputLabelProps={{ shrink: true }}
                    />
                  </TableCell>

                  {/* Дата запуска */}
                  <TableCell className={styles.cell}>
                    <div className={styles.dateGroup}>
                      <div className={styles.dateItem}>
                        <span className={styles.dateLabel}>План:</span>
                        <TextField
                          type="date"
                          value={order.plannedStartDate}
                          onChange={(e) => handleDateChange(order.id, 'plannedStartDate', e.target.value)}
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
                          onChange={(e) => handleDateChange(order.id, 'actualStartDate', e.target.value)}
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
                          onChange={(e) => handleDateChange(order.id, 'plannedReleaseDate', e.target.value)}
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
                          onChange={(e) => handleDateChange(order.id, 'actualReleaseDate', e.target.value)}
                          size="small"
                          className={styles.dateField}
                          InputLabelProps={{ shrink: true }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                      <TableCell className={styles.headerCell}>Упаковка</TableCell>
                      <TableCell className={styles.headerCell}>Количество</TableCell>
                      <TableCell className={styles.headerCell}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingOrder.packages.map((pkg) => (
                      <React.Fragment key={pkg.id}>
                        <TableRow className={styles.tableRow}>
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
                          <TableCell colSpan={3} className={styles.collapseCell}>
                            <Collapse in={expandedPackages[pkg.id]} timeout="auto" unmountOnExit>
                              <div className={styles.detailsContainer}>
                                <h5 className={styles.detailsTitle}>Детали упаковки:</h5>
                                <TableContainer component={Paper} className={styles.detailsTable}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow className={styles.detailsTableHeader}>
                                        <TableCell className={styles.detailsHeaderCell}>Деталь</TableCell>
                                        <TableCell className={styles.detailsHeaderCell}>Количество на упаковку</TableCell>
                                        <TableCell className={styles.detailsHeaderCell}>Общее количество</TableCell>
                                        <TableCell className={styles.detailsHeaderCell}>Единица измерения</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {pkg.details.map((detail) => (
                                        <TableRow key={detail.id} className={styles.detailsTableRow}>
                                          <TableCell className={styles.detailsCell}>{detail.name}</TableCell>
                                          <TableCell className={styles.detailsCell}>{detail.quantity}</TableCell>
                                          <TableCell className={styles.detailsCell}>
                                            {detail.quantity * pkg.quantity}
                                          </TableCell>
                                          <TableCell className={styles.detailsCell}>{detail.unit}</TableCell>
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