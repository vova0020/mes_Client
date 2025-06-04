import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
  Paper
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ZoomIn,
  ZoomOut,
  Refresh,
  GridOn,
  GridOff
} from '@mui/icons-material';
import styles from './BufferLayoutScheme.module.css';

// Определение типов данных для схемы размещения
interface IBuffer {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
}

interface ICell {
  id: number;
  code: string;
  bufferId: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Свойства компонента
interface BufferLayoutSchemeProps {
  buffers: IBuffer[];
}

// Главный компонент схемы размещения
const BufferLayoutScheme: React.FC<BufferLayoutSchemeProps> = ({ buffers }) => {
  // Состояния для схемы
  const [selectedBufferId, setSelectedBufferId] = useState<number | ''>('');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [cells, setCells] = useState<ICell[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState<ICell | null>(null);
  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  
  // Состояние для редактируемой ячейки
  const [cellForm, setCellForm] = useState<Partial<ICell>>({
    code: '',
    bufferId: 0,
    status: 'AVAILABLE',
    capacity: 1,
    x: 0,
    y: 0,
    width: 1,
    height: 1
  });

  // Загрузка тестовых данных
  useEffect(() => {
    // Здесь в реальном приложении будет запрос к API
    // Для демонстрации и��пользуем тестовые данные
    if (buffers.length > 0 && selectedBufferId === '') {
      setSelectedBufferId(buffers[0].id);
    }
    
    const mockCells: ICell[] = [
      { id: 1, code: 'A1', bufferId: 1, status: 'AVAILABLE', capacity: 1, x: 0, y: 0, width: 1, height: 1 },
      { id: 2, code: 'A2', bufferId: 1, status: 'OCCUPIED', capacity: 1, x: 1, y: 0, width: 1, height: 1 },
      { id: 3, code: 'B1', bufferId: 1, status: 'RESERVED', capacity: 2, x: 0, y: 1, width: 1, height: 1 },
      { id: 4, code: 'B2', bufferId: 1, status: 'MAINTENANCE', capacity: 1, x: 1, y: 1, width: 1, height: 1 },
      { id: 5, code: 'C1', bufferId: 1, status: 'AVAILABLE', capacity: 1, x: 0, y: 2, width: 2, height: 1 },
      { id: 6, code: 'A1', bufferId: 2, status: 'AVAILABLE', capacity: 1, x: 0, y: 0, width: 1, height: 2 },
      { id: 7, code: 'A2', bufferId: 2, status: 'OCCUPIED', capacity: 2, x: 1, y: 0, width: 2, height: 1 }
    ];
    
    setCells(mockCells);
  }, [buffers]);

  // Получение только ячеек текущего буфера
  const getBufferCells = () => {
    if (!selectedBufferId) return [];
    return cells.filter(cell => cell.bufferId === selectedBufferId);
  };

  // Обработчики для масштабирования
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  // Обработчики для редактирования ячеек
  const handleOpenCellDialog = (cell?: ICell) => {
    if (cell) {
      setCellForm({
        id: cell.id,
        code: cell.code,
        bufferId: cell.bufferId,
        status: cell.status,
        capacity: cell.capacity,
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height
      });
      setSelectedCell(cell);
    } else {
      setCellForm({
        code: '',
        bufferId: selectedBufferId as number,
        status: 'AVAILABLE',
        capacity: 1,
        x: 0,
        y: 0,
        width: 1,
        height: 1
      });
      setSelectedCell(null);
    }
    setCellDialogOpen(true);
  };

  const handleCloseCellDialog = () => {
    setCellDialogOpen(false);
    setCellForm({
      code: '',
      bufferId: selectedBufferId as number,
      status: 'AVAILABLE',
      capacity: 1,
      x: 0,
      y: 0,
      width: 1,
      height: 1
    });
  };

  const handleSaveCell = () => {
    if (!cellForm.code || !cellForm.bufferId) {
      // Показать ошибку
      return;
    }

    if (selectedCell) {
      // Обновление существующей ячейки
      setCells(prev => prev.map(c => 
        c.id === selectedCell.id ? { ...c, ...cellForm as ICell } : c
      ));
    } else {
      // Создание новой ячейки
      const newCell: ICell = {
        id: Math.max(...cells.map(c => c.id), 0) + 1,
        code: cellForm.code!,
        bufferId: cellForm.bufferId!,
        status: cellForm.status || 'AVAILABLE',
        capacity: cellForm.capacity || 1,
        x: cellForm.x || 0,
        y: cellForm.y || 0,
        width: cellForm.width || 1,
        height: cellForm.height || 1
      };
      setCells(prev => [...prev, newCell]);
    }

    handleCloseCellDialog();
  };

  const handleCellFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCellForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCellForm(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setCellForm(prev => ({
      ...prev,
      status: e.target.value as 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
    }));
  };

  const handleDeleteCell = (id: number) => {
    setCells(prev => prev.filter(cell => cell.id !== id));
  };

  // Получение класса стиля для ячейки на основе статуса
  const getCellStatusClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return styles.cellAvailable;
      case 'OCCUPIED': return styles.cellOccupied;
      case 'RESERVED': return styles.cellReserved;
      case 'MAINTENANCE': return styles.cellMaintenance;
      default: return '';
    }
  };

  // Перевод статуса для отображения
  const translateStatus = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Доступна';
      case 'OCCUPIED': return 'Занята';
      case 'RESERVED': return 'Зарезервирована';
      case 'MAINTENANCE': return 'На обслуживании';
      default: return status;
    }
  };

  // Рендер выбора буфера для схемы
  const renderBufferSelector = () => {
    return (
      <div className={styles.schemeControls}>
        <FormControl className={styles.bufferSelector}>
          <InputLabel>Выберите буфер</InputLabel>
          <Select
            value={selectedBufferId}
            onChange={(e) => setSelectedBufferId(e.target.value as number)}
            label="Выберите буфер"
          >
            {buffers.map(buffer => (
              <MenuItem key={buffer.id} value={buffer.id}>
                {buffer.name} ({buffer.location || 'Без расположения'})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <div className={styles.schemeToolbar}>
          <Tooltip title="Показать/скрыть сетку">
            <IconButton 
              onClick={() => setShowGrid(!showGrid)}
              className={styles.toolbarButton}
            >
              {showGrid ? <GridOff /> : <GridOn />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Увеличить">
            <IconButton 
              onClick={handleZoomIn} 
              className={styles.toolbarButton}
              disabled={zoom >= 200}
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Уменьшить">
            <IconButton 
              onClick={handleZoomOut} 
              className={styles.toolbarButton}
              disabled={zoom <= 50}
            >
              <ZoomOut />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={editMode ? 'Выключить режим редактирования' : 'Включить режим редактирования'}>
            <IconButton 
              onClick={() => setEditMode(!editMode)} 
              className={`${styles.toolbarButton} ${editMode ? styles.activeEdit : ''}`}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          
          {editMode && (
            <Tooltip title="Добавить ячейку">
              <IconButton 
                onClick={() => handleOpenCellDialog()} 
                className={styles.toolbarButton}
              >
                <Add />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  // Рендер схемы буфера
  const renderBufferScheme = () => {
    const bufferCells = getBufferCells();

    if (selectedBufferId === '') {
      return (
        <div className={styles.emptyScheme}>
          <Typography variant="h6">
            Выберите буфер для отображения схемы
          </Typography>
        </div>
      );
    }

    if (bufferCells.length === 0) {
      return (
        <div className={styles.emptyScheme}>
          <Typography variant="h6">
            В этом буфере нет ячеек
          </Typography>
          {editMode && (
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={() => handleOpenCellDialog()}
              className={styles.addButton}
              style={{ marginTop: '20px' }}
            >
              Добавить ячейку
            </Button>
          )}
        </div>
      );
    }

    // Определение размеров сетки на основе координат ячеек
    const maxX = Math.max(...bufferCells.map(cell => cell.x + cell.width), 5);
    const maxY = Math.max(...bufferCells.map(cell => cell.y + cell.height), 5);
    
    return (
      <div className={styles.schemeWrapper}>
        <div 
          className={styles.schemeContainer} 
          style={{ 
            transform: `scale(${zoom / 100})`,
            width: maxX * 60,
            height: maxY * 60
          }}
        >
          {/* Сетка */}
          {showGrid && (
            <div className={styles.grid} style={{ width: maxX * 60, height: maxY * 60 }}>
              {Array.from({ length: maxX }).map((_, x) => (
                Array.from({ length: maxY }).map((_, y) => (
                  <div 
                    key={`grid-${x}-${y}`} 
                    className={styles.gridCell} 
                    style={{ left: x * 60, top: y * 60 }}
                  />
                ))
              ))}
            </div>
          )}
          
          {/* Ячейки буфера */}
          {bufferCells.map(cell => (
            <div
              key={cell.id}
              className={`${styles.bufferCell} ${getCellStatusClass(cell.status)} ${editMode ? styles.editable : ''}`}
              style={{
                left: cell.x * 60,
                top: cell.y * 60,
                width: cell.width * 60 - 4,
                height: cell.height * 60 - 4
              }}
              onClick={() => {
                if (editMode) {
                  handleOpenCellDialog(cell);
                }
              }}
              title={`${cell.code} - ${translateStatus(cell.status)}`}
            >
              <div className={styles.cellContent}>
                <div className={styles.cellCode}>{cell.code}</div>
                <div className={styles.cellStatus}>{translateStatus(cell.status)}</div>
                {cell.capacity > 1 && (
                  <div className={styles.cellCapacity}>
                    Вместимость: {cell.capacity}
                  </div>
                )}
              </div>
              
              {editMode && (
                <div className={styles.cellActions}>
                  <IconButton 
                    size="small" 
                    className={styles.cellEditButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCellDialog(cell);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    className={styles.cellDeleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCell(cell.id);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Рендер диалога для редактирования ��чейки
  const renderCellDialog = () => {
    return (
      <Dialog
        open={cellDialogOpen}
        onClose={handleCloseCellDialog}
        maxWidth="sm"
        fullWidth
        classes={{ paper: styles.dialogPaper }}
      >
        <DialogTitle className={styles.dialogTitle}>
          {selectedCell ? 'Редактирование ячейки' : 'Создание новой ячейки'}
        </DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <TextField
            margin="dense"
            name="code"
            label="Код ячейки"
            type="text"
            fullWidth
            value={cellForm.code || ''}
            onChange={handleCellFormChange}
            className={styles.formField}
            required
          />
          
          <FormControl fullWidth margin="dense" className={styles.formField}>
            <InputLabel>Статус ячейки</InputLabel>
            <Select
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
            onChange={handleNumberChange}
            className={styles.formField}
            InputProps={{ inputProps: { min: 1 } }}
          />
          
          <div className={styles.coordinatesFields}>
            <TextField
              margin="dense"
              name="x"
              label="Позиция X"
              type="number"
              value={cellForm.x || 0}
              onChange={handleNumberChange}
              className={styles.coordField}
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              margin="dense"
              name="y"
              label="Позиция Y"
              type="number"
              value={cellForm.y || 0}
              onChange={handleNumberChange}
              className={styles.coordField}
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              margin="dense"
              name="width"
              label="Ширина"
              type="number"
              value={cellForm.width || 1}
              onChange={handleNumberChange}
              className={styles.coordField}
              InputProps={{ inputProps: { min: 1 } }}
            />
            <TextField
              margin="dense"
              name="height"
              label="Высота"
              type="number"
              value={cellForm.height || 1}
              onChange={handleNumberChange}
              className={styles.coordField}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button 
            onClick={handleCloseCellDialog} 
            className={styles.cancelButton}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSaveCell} 
            variant="contained" 
            className={styles.saveButton}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <div className={styles.layoutScheme}>
      {renderBufferSelector()}
      
      <Paper className={styles.schemeLayout}>
        {renderBufferScheme()}
      </Paper>
      
      {renderCellDialog()}
    </div>
  );
};

export default BufferLayoutScheme;