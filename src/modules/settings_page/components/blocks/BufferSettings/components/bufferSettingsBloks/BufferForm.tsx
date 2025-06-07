import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import { IBuffer } from '../../BufferSettings';
import styles from './BufferForm.module.css';

interface BufferFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (bufferData: Partial<IBuffer>) => void;
  buffer?: IBuffer;
  isEditing: boolean;
}

const BufferForm: React.FC<BufferFormProps> = ({
  open,
  onClose,
  onSave,
  buffer,
  isEditing
}) => {
  const [bufferForm, setBufferForm] = useState<Partial<IBuffer>>({
    name: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    if (buffer && isEditing) {
      setBufferForm({
        id: buffer.id,
        name: buffer.name,
        description: buffer.description || '',
        location: buffer.location || ''
      });
    } else {
      setBufferForm({
        name: '',
        description: '',
        location: ''
      });
    }
  }, [buffer, isEditing, open]);

  const handleBufferFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBufferForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(bufferForm);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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

export default BufferForm;