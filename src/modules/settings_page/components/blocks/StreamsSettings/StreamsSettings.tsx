import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Tab, Snackbar, Alert } from '@mui/material';
import styles from './StreamsSettings.module.css';
import { IProductionLine, IProductionSegment } from './types';
import LinesList from './components/LinesList';
import LineForm from './components/LineForm';
import SegmentForm from './components/SegmentForm';

const StreamsSettings: React.FC = () => {
  const [lines, setLines] = useState<IProductionLine[]>([]);
  const [segments, setSegments] = useState<IProductionSegment[]>([]);
  const [tab, setTab] = useState(0);

  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<IProductionLine | null>(null);

  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<IProductionSegment | null>(null);
  const [selectedLineForSegment, setSelectedLineForSegment] = useState<IProductionLine | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    setLines([
      { id: 1, name: 'Основная линия', type: 'PRIMARY' },
      { id: 2, name: 'Второстепенная линия', type: 'SECONDARY' },
    ]);
    setSegments([
      { id: 1, name: 'Участок №1', lineId: 1 },
      { id: 2, name: 'Сборочный', lineId: 1 },
      { id: 3, name: 'Финальный', lineId: 2 },
    ]);
  }, []);

  // ========== Линии ==========
  const handleOpenLineDialog = (line?: IProductionLine) => {
    setEditingLine(line ?? null);
    setLineDialogOpen(true);
  };
  const handleSaveLine = (value: IProductionLine) => {
    if (!value.name || !value.type) {
      setSnackbar({ open: true, message: 'Название и тип линии обязательны!', severity: 'error' });
      return;
    }
    if (!value.id) {
      const newId = Math.max(...lines.map(l => l.id), 0) + 1;
      setLines([...lines, { ...value, id: newId }]);
      setSnackbar({ open: true, message: 'Линия создана!', severity: 'success' });
    } else {
      setLines(lines.map(l => (l.id === value.id ? value : l)));
      setSnackbar({ open: true, message: 'Линия обновлена!', severity: 'success' });
    }
    setLineDialogOpen(false);
    setEditingLine(null);
  };

  // ========== Участки ==========
  const handleOpenSegmentDialog = (segment?: IProductionSegment, line?: IProductionLine) => {
    setEditingSegment(segment ?? null);
    setSelectedLineForSegment(line ?? null);
    setSegmentDialogOpen(true);
  };

  const handleSaveSegment = (value: IProductionSegment) => {
    if (!value.name || !value.lineId) {
      setSnackbar({ open: true, message: 'Название и линия обязательны!', severity: 'error' });
      return;
    }
    if (!value.id) {
      const newId = Math.max(...segments.map(s => s.id), 0) + 1;
      setSegments([...segments, { ...value, id: newId }]);
      setSnackbar({ open: true, message: 'Участок создан!', severity: 'success' });
    } else {
      setSegments(segments.map(s => (s.id === value.id ? value : s)));
      setSnackbar({ open: true, message: 'Участок обновлён!', severity: 'success' });
    }
    setSegmentDialogOpen(false);
    setEditingSegment(null);
    setSelectedLineForSegment(null);
  };

  // Группировка: участки по линиям
  const segmentsByLine = lines.reduce((acc, line) => {
    acc[line.id] = segments.filter(s => s.lineId === line.id);
    return acc;
  }, {} as Record<number, IProductionSegment[]>);

  return (
    <div className={styles.streamsSettings}>
      <Typography variant="h5" className={styles.mainTitle} component="h1">
        Производственные линии и участки
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} className={styles.tabs}>
        <Tab label="Линии и их участки" />
        <Tab label="Все участки (списком)" />
      </Tabs>

      {tab === 0 && (
        <LinesList
          lines={lines}
          segmentsByLine={segmentsByLine}
          onEditLine={handleOpenLineDialog}
          onAddLine={() => handleOpenLineDialog()}
          onEditSegment={handleOpenSegmentDialog}
          onAddSegment={line => handleOpenSegmentDialog(undefined, line)}
          className={styles.paper}
        />
      )}

      {tab === 1 && (
        <div className={styles.roleManagement}>
          <Typography variant="h6" style={{ marginBottom: 12, marginLeft: 2 }}>Все участки</Typography>
          <ul className={styles.segmentsListTab}>
            {segments.map(segment => {
              const line = lines.find(l => l.id === segment.lineId);
              return (
                <li key={segment.id} className={styles.segmentListItem}>
                  <span>
                    <b>{segment.name}</b>
                    {line &&
                      <span className={styles.segmentLineTag}>
                        {line.name}
                      </span>
                    }
                  </span>
                  <button className={styles.editLink} onClick={() => handleOpenSegmentDialog(segment, line)}>
                    Редактировать
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Диалоги */}
      <LineForm
        open={lineDialogOpen}
        onClose={() => setLineDialogOpen(false)}
        onSave={handleSaveLine}
        editingLine={editingLine}
      />
      <SegmentForm
        open={segmentDialogOpen}
        onClose={() => setSegmentDialogOpen(false)}
        onSave={handleSaveSegment}
        editingSegment={editingSegment}
        lines={lines}
        forcedLine={selectedLineForSegment}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3400}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default StreamsSettings;