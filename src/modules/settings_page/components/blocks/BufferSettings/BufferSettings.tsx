
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  // Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Alert,
  ListItemButton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add, Edit, Delete, Refresh, ViewList } from '@mui/icons-material';
import styles from './BufferSettings.module.css';
// Импортируем компонент схемы размещения
import BufferLayoutScheme from './BufferLayoutScheme';

// Интерфейсы для данных (в реальном приложении получаются с бэкенда)
interface IBuffer {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
}

interface IBufferCell {
  id: number;
  code: string;
  bufferId: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  capacity: number;
}

// Компонент настроек буфера
const BufferSettings: React.FC = () => {
  // Состояния для списков
  const [buffers, setBuffers] = useState<IBuffer[]>([]);
  const [cells, setCells] = useState<IBufferCell[]>([]);

  // Состояние для активного таба
  const [activeTab, setActiveTab] = useState(0);

  // Состояния для выбранных элементов
  const [selectedBuffer, setSelectedBuffer] = useState<IBuffer | null>(null);

  // Состояния для форм
  const [bufferForm, setBufferForm] = useState<Partial<IBuffer>>({
    name: '',
    description: '',
    location: ''
  });

  const [cellForm, setCellForm] = useState<Partial<IBufferCell>>({
    code: '',
    bufferId: 0,
    status: 'AVAILABLE',
    capacity: 1
  });

  // Состояния для диалогов
  const [bufferDialogOpen, setBufferDialogOpen] = useState(false);
  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Состояние для уведомлений
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Имитация загрузки данных с сервера
  useEffect(() => {
    // Здесь должен быть запрос к API для получения списка буферов
    const mockBuffers: IBuffer[] = [
      { id: 1, name: 'Основной буфер', description: 'Буфер для основного цеха', location: 'Цех №1' },
      { id: 2, name: 'Вспомогательный буфер', description: 'Буфер для вспомогательных операций', location: 'Цех №2' }
    ];

    const mockCells: IBufferCell[] = [
      { id: 1, code: 'A1', bufferId: 1, status: 'AVAILABLE', capacity: 1 },
      { id: 2, code: 'A2', bufferId: 1, status: 'OCCUPIED', capacity: 1 },
      { id: 3, code: 'B1', bufferId: 1, status: 'RESERVED', capacity: 2 },
      { id: 4, code: 'B2', bufferId: 1, status: 'MAINTENANCE', capacity: 1 },
      { id: 5, code: 'A1', bufferId: 2, status: 'AVAILABLE', capacity: 1 },
      { id: 6, code: 'A2', bufferId: 2, status: 'OCCUPIED', capacity: 2 }
    ];

    setBuffers(mockBuffers);
    setCells(mockCells);
  }, []);

  // Обработчики для формы буфера
  const handleBufferFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBufferForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenBufferDialog = (buffer?: IBuffer) => {
    if (buffer) {
      setBufferForm({
        id: buffer.id,
        name: buffer.name,
        description: buffer.description || '',
        location: buffer.location || ''
      });
      setIsEditing(true);
    } else {
      setBufferForm({
        name: '',
        description: '',
        location: ''
      });
      setIsEditing(false);
    }
    setBufferDialogOpen(true);
  };

  const handleCloseBufferDialog = () => {
    setBufferDialogOpen(false);
    setBufferForm({
      name: '',
      description: '',
      location: ''
    });
  };

  const handleSaveBuffer = () => {
    if (!bufferForm.name) {
      setSnackbar({
        open: true,
        message: 'Название буфера обязательно',
        severity: 'error'
      });
      return;
    }

    // Имитация сохранения на сервер
    if (isEditing && bufferForm.id) {
      // Обновление существующего буфера
      setBuffers(prev => prev.map(b =>
        b.id === bufferForm.id
          ? { ...b, ...bufferForm } as IBuffer
          : b
      ));
      setSnackbar({
        open: true,
        message: 'Буфер успешно обновлен',
        severity: 'success'
      });
    } else {
      // Создание нового буфера
      const newBuffer: IBuffer = {
        id: Math.max(...buffers.map(b => b.id), 0) + 1,
        name: bufferForm.name!,
        description: bufferForm.description || null,
        location: bufferForm.location || null
      };
      setBuffers(prev => [...prev, newBuffer]);
      setSnackbar({
        open: true,
        message: 'Буфер успешно создан',
        severity: 'success'
      });
    }

    handleCloseBufferDialog();
  };

  const handleDeleteBuffer = (id: number) => {
    // Проверка на наличие ячеек в буфере
    const hasBufferCells = cells.some(cell => cell.bufferId === id);
    if (hasBufferCells) {
      setSnackbar({
        open: true,
        message: 'Невозможно удалить буфер, содержащий ячейки',
        severity: 'error'
      });
      return;
    }

    // Имитация удаления на сервере
    setBuffers(prev => prev.filter(b => b.id !== id));
    setSnackbar({
      open: true,
      message: 'Буфер успешно удален',
      severity: 'success'
    });
  };

  // Обработчики для формы ячейки
  const handleCellFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCellForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setCellForm(prev => ({
      ...prev,
      status: e.target.value as 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
    }));
  };

  const handleBufferChange = (e: SelectChangeEvent<number>) => {
    setCellForm(prev => ({ ...prev, bufferId: e.target.value as number }));
  };

  const handleOpenCellDialog = (cell?: IBufferCell) => {
    if (cell) {
      setCellForm({
        id: cell.id,
        code: cell.code,
        bufferId: cell.bufferId,
        status: cell.status,
        capacity: cell.capacity
      });
      setIsEditing(true);
    } else {
      // При создании новой ячейки выбираем первый буфер по умолчанию
      const defaultBufferId = buffers.length > 0 ? buffers[0].id : 0;
      setCellForm({
        code: '',
        bufferId: defaultBufferId,
        status: 'AVAILABLE',
        capacity: 1
      });
      setIsEditing(false);
    }
    setCellDialogOpen(true);
  };

  const handleCloseCellDialog = () => {
    setCellDialogOpen(false);
    setCellForm({
      code: '',
      bufferId: 0,
      status: 'AVAILABLE',
      capacity: 1
    });
  };

  const handleSaveCell = () => {
    if (!cellForm.code) {
      setSnackbar({
        open: true,
        message: 'Код ячейки обязателен',
        severity: 'error'
      });
      return;
    }

    if (!cellForm.bufferId) {
      setSnackbar({
        open: true,
        message: 'Необходимо выбрать буфер',
        severity: 'error'
      });
      return;
    }

    // Проверка на уникальность кода ячейки в пределах буфера
    const isDuplicate = cells.some(c =>
      c.code === cellForm.code &&
      c.bufferId === cellForm.bufferId &&
      (!isEditing || c.id !== cellForm.id)
    );

    if (isDuplicate) {
      setSnackbar({
        open: true,
        message: 'Ячейка с таким кодом уже существует в выбранном буфере',
        severity: 'error'
      });
      return;
    }

    // Имитация сохранения на сервер
    if (isEditing && cellForm.id) {
      // Обновление существующей ячейки
      setCells(prev => prev.map(c =>
        c.id === cellForm.id
          ? { ...c, ...cellForm } as IBufferCell
          : c
      ));
      setSnackbar({
        open: true,
        message: 'Ячейка успешно обновлена',
        severity: 'success'
      });
    } else {
      // Создание новой ячейки
      const newCell: IBufferCell = {
        id: Math.max(...cells.map(c => c.id), 0) + 1,
        code: cellForm.code,
        bufferId: cellForm.bufferId,
        status: cellForm.status || 'AVAILABLE',
        capacity: cellForm.capacity || 1
      };
      setCells(prev => [...prev, newCell]);
      setSnackbar({
        open: true,
        message: 'Ячейка успешно создана',
        severity: 'success'
      });
    }

    handleCloseCellDialog();
  };

  const handleDeleteCell = (id: number) => {
    // Имитация удаления на сервере
    setCells(prev => prev.filter(c => c.id !== id));
    setSnackbar({
      open: true,
      message: 'Ячейка успешно удалена',
      severity: 'success'
    });
  };

  // Обработчик для закрытия уведомления
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Получаем ячейки для выбранного буфера
  const getBufferCells = (bufferId: number) => {
    return cells.filter(cell => cell.bufferId === bufferId);
  };

  // Рендер списка буферов
  const renderBufferList = () => {
    return (
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <Typography variant="h6" component="h2">
            Список буферов
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenBufferDialog()}
            className={styles.addButton}
          >
            Добавить буфер
          </Button>
        </div>
        <Divider />
        {buffers.length === 0 ? (
          <Typography className={styles.emptyMessage}>
            Буферы не найдены. Создайте первый буфер.
          </Typography>
        ) : (
          // Рендер списка буферов (исправленный фрагмент)
          <List>
            {buffers.map(buffer => (
              <ListItem key={buffer.id}>
                <ListItemButton
                  selected={selectedBuffer?.id === buffer.id}
                  onClick={() => setSelectedBuffer(buffer)}
                >
                  <ListItemText
                    primary={buffer.name}
                    secondary={
                      <>
                        {buffer.location && (
                          <span className={styles.secondaryText}>
                            Расположение: {buffer.location}
                          </span>
                        )}
                        {buffer.description && (
                          <span className={styles.secondaryText}>
                            {buffer.description}
                          </span>
                        )}
                      </>
                    }
                  />
                </ListItemButton>
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleOpenBufferDialog(buffer)}
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteBuffer(buffer.id)}
                    size="small"
                    className={styles.deleteButton}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

        )}
      </div>
    );
  };

  // Рендер списка ячеек для выбранного буфера
  const renderCellList = () => {
    if (!selectedBuffer) {
      return (
        <Typography className={styles.selectPrompt}>
          Выберите буфер для просмотра ячеек
        </Typography>
      );
    }

    const bufferCells = getBufferCells(selectedBuffer.id);

    return (
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <Typography variant="h6" component="h2">
            Ячейки буфера: {selectedBuffer.name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenCellDialog()}
            className={styles.addButton}
          >
            Добавить ячейку
          </Button>
        </div>
        <Divider />
        {bufferCells.length === 0 ? (
          <Typography className={styles.emptyMessage}>
            В этом буфере нет ячеек. Создайте первую ячейку.
          </Typography>
        ) : (
          <List>
            {bufferCells.map(cell => (
              <ListItem key={cell.id} className={styles.cellItem}>
                <ListItemText
                  primary={`Код: ${cell.code}`}
                  secondary={
                    <>
                      <span className={styles.secondaryText}>
                        Статус: {translateStatus(cell.status)}
                      </span>
                      <span className={styles.secondaryText}>
                        Вместимость: {cell.capacity}
                      </span>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleOpenCellDialog(cell)}
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteCell(cell.id)}
                    size="small"
                    className={styles.deleteButton}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </div>
    );
  };

  // Функция для перевода статуса на русский
  const translateStatus = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Доступна';
      case 'OCCUPIED':
        return 'Занята';
      case 'RESERVED':
        return 'Зарезервирована';
      case 'MAINTENANCE':
        return 'На обслуживании';
      default:
        return status;
    }
  };

  return (
    <div className={styles.bufferSettings}>
      <Typography variant="h5" component="h1" className={styles.mainTitle}>
        Настройки буферной системы
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        className={styles.tabs}
      >
        <Tab label="Управление буферами" />
        <Tab label="Схема размещения" />
      </Tabs>

      {activeTab === 0 ? (
        <div className={styles.bufferManagement}>
          <Grid spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              {/* Список буферов */}
              <Paper className={styles.paper}>
                {renderBufferList()}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              {/* Список ячеек */}
              <Paper className={styles.paper}>
                {renderCellList()}
              </Paper>
            </Grid>
          </Grid>
        </div>
      ) : (
        <div className={styles.bufferVisualization}>
          <Paper className={styles.paper}>
            {/* Интегрируем компонент схемы размещения вместо заглушки */}
            <BufferLayoutScheme buffers={buffers} />
          </Paper>
        </div>
      )}

      {/* Диалог для создания/редактирования буфера */}
      <Dialog
        open={bufferDialogOpen}
        onClose={handleCloseBufferDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Редактирование буфера' : 'Создание нового буфера'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Название буфера"
            type="text"
            fullWidth
            value={bufferForm.name || ''}
            onChange={handleBufferFormChange}
            required
            variant="outlined"
            className={styles.formField}
          />
          <TextField
            margin="dense"
            name="location"
            label="Расположение"
            type="text"
            fullWidth
            value={bufferForm.location || ''}
            onChange={handleBufferFormChange}
            variant="outlined"
            className={styles.formField}
          />
          <TextField
            margin="dense"
            name="description"
            label="Описание"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={bufferForm.description || ''}
            onChange={handleBufferFormChange}
            variant="outlined"
            className={styles.formField}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBufferDialog} color="primary">
            Отмена
          </Button>
          <Button onClick={handleSaveBuffer} color="primary" variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог для создания/редактирования ячейки */}
      <Dialog
        open={cellDialogOpen}
        onClose={handleCloseCellDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Редактирование ячейки' : 'Создание новой ячейки'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth variant="outlined" className={styles.formField}>
            <InputLabel id="buffer-select-label">Буфер</InputLabel>
            <Select
              labelId="buffer-select-label"
              id="buffer-select"
              value={cellForm.bufferId || ''}
              onChange={handleBufferChange}
              label="Буфер"
              required
            >
              {buffers.map(buffer => (
                <MenuItem key={buffer.id} value={buffer.id}>
                  {buffer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            autoFocus
            margin="dense"
            name="code"
            label="Код ячейки"
            type="text"
            fullWidth
            value={cellForm.code || ''}
            onChange={handleCellFormChange}
            required
            variant="outlined"
            className={styles.formField}
          />

          <FormControl fullWidth variant="outlined" className={styles.formField}>
            <InputLabel id="status-select-label">Статус ячейки</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={cellForm.status || 'AVAILABLE'}
              onChange={handleStatusChange}
              label="Статус ячейки"
            >
              <MenuItem value="AVAILABLE">Доступна</MenuItem>
              <MenuItem value="OCCUPIED">Занята</MenuItem>
              <MenuItem value="RESERVED">Зарезервирована</MenuItem>
              <MenuItem value="MAINTENANCE">На обслуживании</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            name="capacity"
            label="Вместимость"
            type="number"
            fullWidth
            value={cellForm.capacity || 1}
            onChange={handleCellFormChange}
            InputProps={{ inputProps: { min: 1 } }}
            variant="outlined"
            className={styles.formField}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCellDialog} color="primary">
            Отмена
          </Button>
          <Button onClick={handleSaveCell} color="primary" variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BufferSettings;
