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
  SelectChangeEvent
} from '@mui/material';
import styles from './DetailRouteManagement.module.css';

// Типы данных
interface TechRoute {
  id: string;
  name: string;
  description: string;
}

interface Detail {
  id: string;
  article: string;
  name: string;
  material: string;
  size: string;
  quantity: number;
  techRouteId: string;
}

interface Order {
  id: string;
  name: string;
  status: 'preliminary' | 'approved';
  details: Detail[];
}

// Моковые данные технологических маршрутов
const mockTechRoutes: TechRoute[] = [
  { id: '1', name: 'Маршрут А', description: 'Стандартная обработка' },
  { id: '2', name: 'Маршрут Б', description: 'Усиленная обработка' },
  { id: '3', name: 'Маршрут В', description: 'Быстрая обработка' },
  { id: '4', name: 'Маршрут Г', description: 'Специальная обработка' },
];

// Моковые данные заказов с деталями
const mockOrders: Order[] = [
  {
    id: '1',
    name: 'Заказ №001',
    status: 'preliminary',
    details: [
      { id: 'd1', article: 'ART-001', name: 'Деталь А1', material: 'Сталь', size: '100x50x20', quantity: 10, techRouteId: '1' },
      { id: 'd2', article: 'ART-002', name: 'Деталь А2', material: 'Алюминий', size: '80x40x15', quantity: 5, techRouteId: '2' },
      { id: 'd3', article: 'ART-003', name: 'Деталь А3', material: 'Медь', size: '60x30x10', quantity: 8, techRouteId: '1' },
    ]
  },
  {
    id: '2',
    name: 'Заказ №002',
    status: 'approved',
    details: [
      { id: 'd4', article: 'ART-004', name: 'Деталь Б1', material: 'Сталь', size: '120x60x25', quantity: 15, techRouteId: '3' },
      { id: 'd5', article: 'ART-005', name: 'Деталь Б2', material: 'Титан', size: '90x45x18', quantity: 3, techRouteId: '4' },
    ]
  },
  {
    id: '3',
    name: 'Заказ №003',
    status: 'preliminary',
    details: [
      { id: 'd6', article: 'ART-006', name: 'Деталь В1', material: 'Алюминий', size: '70x35x12', quantity: 20, techRouteId: '2' },
      { id: 'd7', article: 'ART-007', name: 'Деталь В2', material: 'Сталь', size: '110x55x22', quantity: 7, techRouteId: '1' },
      { id: 'd8', article: 'ART-008', name: 'Деталь В3', material: 'Медь', size: '50x25x8', quantity: 12, techRouteId: '3' },
      { id: 'd9', article: 'ART-009', name: 'Деталь В4', material: 'Титан', size: '95x48x20', quantity: 4, techRouteId: '4' },
    ]
  },
  {
    id: '4',
    name: 'Заказ №004',
    status: 'approved',
    details: [
      { id: 'd10', article: 'ART-010', name: 'Деталь Г1', material: 'Сталь', size: '130x65x30', quantity: 6, techRouteId: '1' },
      { id: 'd11', article: 'ART-011', name: 'Деталь Г2', material: 'Алюминий', size: '85x42x16', quantity: 9, techRouteId: '2' },
    ]
  },
];

const DetailRouteManagement: React.FC = () => {
  const [orders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<Detail[]>([]);

  // Обработчик выбора заказа
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetails([...order.details]);
  };

  // Обработчик изменения технологического маршрута
  const handleTechRouteChange = (detailId: string, newTechRouteId: string) => {
    setOrderDetails(prevDetails =>
      prevDetails.map(detail =>
        detail.id === detailId
          ? { ...detail, techRouteId: newTechRouteId }
          : detail
      )
    );
  };

  // Обработчик кнопки "Баланс загрузки участков"
  const handleLoadBalance = (orderId: string) => {
    alert(`Баланс загрузки участков для заказа ${orderId} - функция в разработке`);
  };

  // Получить название технологического маршрута по ID
  const getTechRouteName = (techRouteId: string) => {
    const route = mockTechRoutes.find(r => r.id === techRouteId);
    return route ? route.name : 'Неизвестный маршрут';
  };

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
          </div>
          
          <div className={styles.tableContainer}>
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
                      key={order.id} 
                      className={`${styles.tableRow} ${selectedOrder?.id === order.id ? styles.selectedRow : ''}`}
                      onClick={() => handleOrderSelect(order)}
                    >
                      <TableCell className={styles.cell}>
                        <div className={styles.orderInfo}>
                          <span className={styles.orderName}>{order.name}</span>
                          <span className={`${styles.status} ${styles[order.status]}`}>
                            {order.status === 'preliminary' ? 'Предварительный' : 'Утверждено'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={styles.cell}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadBalance(order.id);
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
        </div>

        {/* Правая панель - детали выбранного заказа */}
        <div className={styles.detailsPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              {selectedOrder ? `Детали заказа: ${selectedOrder.name}` : 'Выберите заказ'}
            </h3>
          </div>

          {selectedOrder ? (
            <div className={styles.tableContainer}>
              <TableContainer component={Paper} className={styles.table}>
                <Table>
                  <TableHead>
                    <TableRow className={styles.tableHeader}>
                      <TableCell className={styles.headerCell}>Артикул детали</TableCell>
                      <TableCell className={styles.headerCell}>Название детали</TableCell>
                      <TableCell className={styles.headerCell}>Материал</TableCell>
                      <TableCell className={styles.headerCell}>Размер</TableCell>
                      <TableCell className={styles.headerCell}>Количество</TableCell>
                      <TableCell className={styles.headerCell}>Тех. маршрут</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderDetails.map((detail) => (
                      <TableRow key={detail.id} className={styles.tableRow}>
                        <TableCell className={styles.cell}>{detail.article}</TableCell>
                        <TableCell className={styles.cell}>{detail.name}</TableCell>
                        <TableCell className={styles.cell}>{detail.material}</TableCell>
                        <TableCell className={styles.cell}>{detail.size}</TableCell>
                        <TableCell className={styles.cell}>{detail.quantity}</TableCell>
                        <TableCell className={styles.cell}>
                          <FormControl size="small" className={styles.routeSelect}>
                            <Select
                              value={detail.techRouteId}
                              onChange={(e: SelectChangeEvent) => 
                                handleTechRouteChange(detail.id, e.target.value)
                              }
                              className={styles.selectInput}
                            >
                              {mockTechRoutes.map((route) => (
                                <MenuItem key={route.id} value={route.id}>
                                  {route.name}
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
          ) : (
            <div className={styles.emptyState}>
              <p>Выберите заказ из списка слева для просмотра деталей</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailRouteManagement;