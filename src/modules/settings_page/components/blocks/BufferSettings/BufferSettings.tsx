import React, { useState, useEffect } from 'react';
import {
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import styles from './BufferSettings.module.css';

// Компоненты
import BufferList from './components/bufferSettingsBloks/BufferList';
import CellList from './components/bufferSettingsBloks/CellList';
import BufferForm from './components/bufferSettingsBloks/BufferForm';
import CellForm from './components/bufferSettingsBloks/CellForm';
import BufferLayoutScheme from './BufferLayoutScheme';
import Notification, { NotificationSeverity } from './components/common/Notification';

// Интерфейсы для данных (в реальном приложении получаются с бэкенда)
export interface IBuffer {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
}

export interface IBufferCell {
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

  // Состояние для активного т��ба
  const [activeTab, setActiveTab] = useState(0);

  // Состояния для выбранных элементов
  const [selectedBuffer, setSelectedBuffer] = useState<IBuffer | null>(null);

  // Состояния для диалогов
  const [bufferDialogOpen, setBufferDialogOpen] = useState(false);
  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Состояние для уведомлений
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as NotificationSeverity
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

  // Обработчик для закрытия уведомления
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Получаем ячейки для выбранного буфера
  const getBufferCells = (bufferId: number) => {
    return cells.filter(cell => cell.bufferId === bufferId);
  };

  // Обработчики буферов
  const handleOpenBufferDialog = (buffer?: IBuffer) => {
    if (buffer) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    setBufferDialogOpen(true);
  };

  const handleCloseBufferDialog = () => {
    setBufferDialogOpen(false);
  };

  const handleSaveBuffer = (bufferData: Partial<IBuffer>) => {
    if (!bufferData.name) {
      setSnackbar({
        open: true,
        message: 'Название буфера обязательно',
        severity: 'error'
      });
      return;
    }

    // Имитация сохранения на сервер
    if (isEditing && bufferData.id) {
      // Обновление существующего буфера
      setBuffers(prev => prev.map(b =>
        b.id === bufferData.id
          ? { ...b, ...bufferData } as IBuffer
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
        name: bufferData.name!,
        description: bufferData.description || null,
        location: bufferData.location || null
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

  // Обработчики ячеек
  const handleOpenCellDialog = (cell?: IBufferCell) => {
    if (cell) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    setCellDialogOpen(true);
  };

  const handleCloseCellDialog = () => {
    setCellDialogOpen(false);
  };

  const handleSaveCell = (cellData: Partial<IBufferCell>) => {
    if (!cellData.code) {
      setSnackbar({
        open: true,
        message: 'Код ячейки обязателен',
        severity: 'error'
      });
      return;
    }

    if (!cellData.bufferId) {
      setSnackbar({
        open: true,
        message: 'Необходимо выбрать буфер',
        severity: 'error'
      });
      return;
    }

    // Проверка на уникальность кода ячейки в пределах буфера
    const isDuplicate = cells.some(c =>
      c.code === cellData.code &&
      c.bufferId === cellData.bufferId &&
      (!isEditing || c.id !== cellData.id)
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
    if (isEditing && cellData.id) {
      // Обновление существующей ячейки
      setCells(prev => prev.map(c =>
        c.id === cellData.id
          ? { ...c, ...cellData } as IBufferCell
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
        code: cellData.code,
        bufferId: cellData.bufferId,
        status: cellData.status || 'AVAILABLE',
        capacity: cellData.capacity || 1
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
                <BufferList 
                  buffers={buffers} 
                  selectedBuffer={selectedBuffer}
                  setSelectedBuffer={setSelectedBuffer}
                  onEdit={handleOpenBufferDialog}
                  onDelete={handleDeleteBuffer}
                />
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              {/* Список ячеек */}
              <Paper className={styles.paper}>
                <CellList 
                  selectedBuffer={selectedBuffer}
                  cells={getBufferCells(selectedBuffer?.id || 0)}
                  onEdit={handleOpenCellDialog}
                  onDelete={handleDeleteCell}
                  onAdd={handleOpenCellDialog}
                />
              </Paper>
            </Grid>
          </Grid>
        </div>
      ) : (
        <div className={styles.bufferVisualization}>
          <Paper className={styles.paper}>
            <BufferLayoutScheme buffers={buffers} />
          </Paper>
        </div>
      )}

      {/* Диалог для создания/редактирования буфера */}
      <BufferForm 
        open={bufferDialogOpen}
        onClose={handleCloseBufferDialog}
        onSave={handleSaveBuffer}
        buffer={isEditing ? buffers.find(b => b.id === selectedBuffer?.id) : undefined}
        isEditing={isEditing}
      />

      {/* Диалог для создания/редактирования ячейки */}
      <CellForm 
        open={cellDialogOpen}
        onClose={handleCloseCellDialog}
        onSave={handleSaveCell}
        cell={isEditing && selectedBuffer ? cells.find(c => c.id === selectedBuffer.id) : undefined}
        buffers={buffers}
        isEditing={isEditing}
        defaultBufferId={selectedBuffer?.id}
      />

      {/* Уведомления */}
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
      />
    </div>
  );
};

export default BufferSettings;