import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse } from '@mui/material';
import { Edit, CheckCircle, Assignment, MonetizationOn, Visibility, ExpandMore, ExpandLess } from '@mui/icons-material';
import styles from './OrderCreation.module.css';

// Типы данных
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

interface Order {
  id: string;
  name: string;
  requiredDate: string;
  status: 'preliminary' | 'approved';
  packages: Package[];
}

interface OrderFormData {
  orderNumber: string;
  orderName: string;
  requiredDate: string;
  packages: Package[];
}

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
  { id: '1', name: 'Упаковка А', quantity: 0, details: mockDetails['1'] },
  { id: '2', name: 'Упаковка Б', quantity: 0, details: mockDetails['2'] },
  { id: '3', name: 'Упаковка В', quantity: 0, details: mockDetails['3'] },
  { id: '4', name: 'Упаковка Г', quantity: 0, details: mockDetails['4'] },
  { id: '5', name: 'Упаковка Д', quantity: 0, details: mockDetails['5'] },
];

const OrderCreation: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompositionDialogOpen, setIsCompositionDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<{ [key: string]: boolean }>({});
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    orderNumber: '',
    orderName: '',
    requiredDate: '',
    packages: mockPackages.map(pkg => ({ ...pkg }))
  });

  // Обработчики для создания заказа
  const handleCreateOrder = () => {
    setOrderForm({
      orderNumber: '',
      orderName: '',
      requiredDate: '',
      packages: mockPackages.map(pkg => ({ ...pkg }))
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveOrder = () => {
    const selectedPackages = orderForm.packages.filter(pkg => pkg.quantity > 0);
    const newOrder: Order = {
      id: Date.now().toString(),
      name: orderForm.orderName,
      requiredDate: orderForm.requiredDate,
      status: 'preliminary',
      packages: selectedPackages
    };
    setOrders([...orders, newOrder]);
    setIsCreateDialogOpen(false);
  };

  // Обработчики для редактирования заказа
  const handleEditOrder = (order: Order) => {
    if (order.status === 'approved') {
      alert('Нельзя редактировать утвержденный заказ');
      return;
    }
    setEditingOrder(order);
    
    // Загружаем данные заказа в форму
    const formPackages = mockPackages.map(pkg => {
      const orderPackage = order.packages.find(op => op.id === pkg.id);
      return {
        ...pkg,
        quantity: orderPackage ? orderPackage.quantity : 0
      };
    });
    
    setOrderForm({
      orderNumber: order.id,
      orderName: order.name,
      requiredDate: order.requiredDate,
      packages: formPackages
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = () => {
    if (editingOrder) {
      const selectedPackages = orderForm.packages.filter(pkg => pkg.quantity > 0);
      setOrders(orders.map(order => 
        order.id === editingOrder.id 
          ? { 
              ...order, 
              name: orderForm.orderName, 
              requiredDate: orderForm.requiredDate,
              packages: selectedPackages
            }
          : order
      ));
      setIsEditDialogOpen(false);
      setEditingOrder(null);
    }
  };

  // Обработчик утверждения заказа
  const handleApproveOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'approved' }
        : order
    ));
  };

  // Обработчики для упаковок
  const handlePackageQuantityChange = (packageId: string, quantity: number) => {
    setOrderForm({
      ...orderForm,
      packages: orderForm.packages.map(pkg => 
        pkg.id === packageId ? { ...pkg, quantity } : pkg
      )
    });
  };

  const handlePackageToggle = (packageId: string, checked: boolean) => {
    setOrderForm({
      ...orderForm,
      packages: orderForm.packages.map(pkg => 
        pkg.id === packageId ? { ...pkg, quantity: checked ? 1 : 0 } : pkg
      )
    });
  };

  // Обработчики для просмотра состава заказа
  const handleOrderComposition = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setViewingOrder(order);
      setExpandedPackages({});
      setIsCompositionDialogOpen(true);
    }
  };

  const handlePackageExpand = (packageId: string) => {
    setExpandedPackages(prev => ({
      ...prev,
      [packageId]: !prev[packageId]
    }));
  };

  const handleOrderExpense = (orderId: string) => {
    alert(`Расход на заказ ${orderId} - функция в разработке`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Создание заказов</h2>
      </div>

      {/* Таблица заказов */}
      <div className={styles.tableContainer}>
        <TableContainer component={Paper} className={styles.table}>
          <Table>
            <TableHead>
              <TableRow className={styles.tableHeader}>
                <TableCell className={styles.headerCell}>Заказ</TableCell>
                <TableCell className={styles.headerCell}>Требуемая дата готовности</TableCell>
                <TableCell className={styles.headerCell}>Статус</TableCell>
                <TableCell className={styles.headerCell}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className={styles.tableRow}>
                  <TableCell className={styles.cell}>{order.name}</TableCell>
                  <TableCell className={styles.cell}>{order.requiredDate}</TableCell>
                  <TableCell className={styles.cell}>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {order.status === 'preliminary' ? 'Предварительный' : 'Утверждено'}
                    </span>
                  </TableCell>
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
                      <IconButton 
                        onClick={() => handleEditOrder(order)}
                        className={styles.actionButton}
                        disabled={order.status === 'approved'}
                        title="Редактировать заказ"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleApproveOrder(order.id)}
                        className={styles.actionButton}
                        disabled={order.status === 'approved'}
                        title="Утвердить заказ"
                      >
                        <CheckCircle />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
        >
          Создать заказ
        </Button>
        <Button 
          variant="contained" 
          disabled
          className={styles.loadButton}
        >
          Загрузить новый заказ
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
              label="Номер заказа"
              value={orderForm.orderNumber}
              onChange={(e) => setOrderForm({...orderForm, orderNumber: e.target.value})}
              fullWidth
              margin="normal"
              className={styles.textField}
            />
            <TextField
              label="Название заказа"
              value={orderForm.orderName}
              onChange={(e) => setOrderForm({...orderForm, orderName: e.target.value})}
              fullWidth
              margin="normal"
              className={styles.textField}
            />
            <TextField
              label="Требуемая дата готовности"
              type="date"
              value={orderForm.requiredDate}
              onChange={(e) => setOrderForm({...orderForm, requiredDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              className={styles.textField}
            />
            
            <div className={styles.packagesSection}>
              <h4 className={styles.packagesTitle}>Состав заказа (упаковки)</h4>
              <div className={styles.packagesList}>
                {orderForm.packages.map((pkg) => (
                  <div key={pkg.id} className={styles.packageItem}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={pkg.quantity > 0}
                          onChange={(e) => handlePackageToggle(pkg.id, e.target.checked)}
                          className={styles.checkbox}
                        />
                      }
                      label={pkg.name}
                      className={styles.packageLabel}
                    />
                    {pkg.quantity > 0 && (
                      <TextField
                        type="number"
                        label="Количество"
                        value={pkg.quantity}
                        onChange={(e) => handlePackageQuantityChange(pkg.id, parseInt(e.target.value) || 0)}
                        size="small"
                        className={styles.quantityField}
                        inputProps={{ min: 1 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button onClick={() => setIsCreateDialogOpen(false)} className={styles.cancelButton}>
            Отмена
          </Button>
          <Button onClick={handleSaveOrder} variant="contained" className={styles.saveButton}>
            Создать
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
              label="Номер заказа"
              value={orderForm.orderNumber}
              disabled
              fullWidth
              margin="normal"
              className={styles.textField}
            />
            <TextField
              label="Название заказа"
              value={orderForm.orderName}
              onChange={(e) => setOrderForm({...orderForm, orderName: e.target.value})}
              fullWidth
              margin="normal"
              className={styles.textField}
            />
            <TextField
              label="Требуемая дата готовности"
              type="date"
              value={orderForm.requiredDate}
              onChange={(e) => setOrderForm({...orderForm, requiredDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              className={styles.textField}
            />
            
            <div className={styles.packagesSection}>
              <h4 className={styles.packagesTitle}>Состав заказа (упаковки)</h4>
              <div className={styles.packagesList}>
                {orderForm.packages.map((pkg) => (
                  <div key={pkg.id} className={styles.packageItem}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={pkg.quantity > 0}
                          onChange={(e) => handlePackageToggle(pkg.id, e.target.checked)}
                          className={styles.checkbox}
                        />
                      }
                      label={pkg.name}
                      className={styles.packageLabel}
                    />
                    {pkg.quantity > 0 && (
                      <TextField
                        type="number"
                        label="Количество"
                        value={pkg.quantity}
                        onChange={(e) => handlePackageQuantityChange(pkg.id, parseInt(e.target.value) || 0)}
                        size="small"
                        className={styles.quantityField}
                        inputProps={{ min: 1 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button onClick={() => setIsEditDialogOpen(false)} className={styles.cancelButton}>
            Отмена
          </Button>
          <Button onClick={handleUpdateOrder} variant="contained" className={styles.saveButton}>
            Сохранить
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

export default OrderCreation;