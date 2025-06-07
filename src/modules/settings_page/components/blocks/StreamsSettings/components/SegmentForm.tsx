import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Chip } from '@mui/material';
import { IProductionSegment, IProductionLine } from '../types';

const SegmentForm: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (segment: IProductionSegment) => void;
  editingSegment: IProductionSegment | null;
  lines: IProductionLine[];
  forcedLine?: IProductionLine | null;
}> = ({ open, onClose, onSave, editingSegment, lines, forcedLine }) => {
  const [form, setForm] = useState<IProductionSegment>({ id: 0, name: '', lineId: 0 });

  useEffect(() => {
    if (editingSegment) setForm(editingSegment);
    else if (forcedLine) setForm({ id: 0, name: '', lineId: forcedLine.id });
    else setForm({ id: 0, name: '', lineId: lines[0]?.id || 0 });
  }, [editingSegment, open, lines, forcedLine]);

  const selectedLine = lines.find(l => l.id === form.lineId);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{form.id ? 'Редактировать участок' : 'Создать участок'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          label="Название участка"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          margin="dense"
          autoFocus
          placeholder="Например: Проверочный, Краскопульт, Установка упаковки"
        />
        <TextField
          select
          fullWidth
          label="Линия"
          value={form.lineId || ''}
          onChange={e => setForm(f => ({ ...f, lineId: Number(e.target.value) }))}
          margin="dense"
          helperText="Выберите линию, к которой привязан участок"
          disabled={!!forcedLine}
        >
          {lines.map(line => (
            <MenuItem value={line.id} key={line.id}>
              {line.name}
            </MenuItem>
          ))}
        </TextField>
        {selectedLine && (
          <div style={{marginTop:8, marginBottom:2}}>
            <Chip
              size="small"
              label={`Линия: ${selectedLine.name} (${selectedLine.type === 'PRIMARY' ? 'Основная' : 'Второстепенная'})`}
              color={selectedLine.type === 'PRIMARY' ? 'primary' : 'default'}
              style={{marginLeft: 0}}
            />
          </div>
        )}
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

export default SegmentForm;