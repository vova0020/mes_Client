import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';
import { IProductionLine, ProductionLineType } from '../types';

const LineForm: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (line: IProductionLine) => void;
  editingLine: IProductionLine | null;
}> = ({ open, onClose, onSave, editingLine }) => {
  const [form, setForm] = useState<IProductionLine>({ id: 0, name: '', type: 'PRIMARY' });

  useEffect(() => {
    if (editingLine) setForm(editingLine);
    else setForm({ id: 0, name: '', type: 'PRIMARY' });
  }, [editingLine, open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{form.id ? 'Редактировать линию' : 'Создать линию'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          label="Название линии"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          margin="dense"
          autoFocus
          placeholder="Например: Монтажная линия #1"
        />
        <TextField
          select
          fullWidth
          label="Тип линии"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value as ProductionLineType }))}
          margin="dense"
          helperText="Тип влияет на логику работы"
        >
          <MenuItem value="PRIMARY">Основная</MenuItem>
          <MenuItem value="SECONDARY">Второстепенная</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={() => onSave(form)}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LineForm;