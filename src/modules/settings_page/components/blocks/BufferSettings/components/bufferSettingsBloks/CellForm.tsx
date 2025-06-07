import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { IBuffer, IBufferCell } from '../../BufferSettings';
import styles from './CellForm.module.css';

interface CellFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (cellData: Partial<IBufferCell>) => void;
  cell?: IBufferCell;
  buffers: IBuffer[];
  isEditing: boolean;
  defaultBufferId?: number;
}

const CellForm: React.FC<CellFormProps> = ({
  open,
  onClose,
  onSave,
  cell,
  buffers,
  isEditing,
  defaultBufferId
}) => {
  const [cellForm, setCellForm] = useState<Partial<IBufferCell>>({
    code: '',
    bufferId: 0,
    status: 'AVAILABLE',
    capacity: 1
  });

  useEffect(() => {
    if (cell && isEditing) {
      setCellForm({
        id: cell.id,
        code: cell.code,
        bufferId: cell.bufferId,
        status: cell.status,
        capacity: cell.capacity
      });
    } else {
      // При создании новой ячейки выбираем буфер по умолчанию
      const defaultBuffer = defaultBufferId || (buffers.length > 0 ? buffers[0].id : 0);
      setCellForm({
        code: '',
        bufferId: defaultBuffer,
        status: 'AVAILABLE',
        capacity: 1
      });
    }
  }, [cell, isEditing, open, buffers, defaultBufferId]);

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

  const handleSave = () => {
    onSave(cellForm);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <Button onClick={onClose} color="primary">
          Отмена
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CellForm;