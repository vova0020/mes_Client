import React from 'react';
import { Button, Grid, Paper } from '@mui/material';
import { IProductionSegment, IProductionLine } from '../types';

import styles from '../StreamsSettings.module.css';

interface SegmentsListProps {
  segments: IProductionSegment[];
  lines: IProductionLine[];
  onEdit: (segment: IProductionSegment) => void;
  onAdd: () => void;
  className?: string;
}
const SegmentsList: React.FC<SegmentsListProps> = ({ segments, lines, onAdd, onEdit, className }) => (
  <div className={styles.roleManagement}>
    <Button variant="contained" onClick={onAdd} className={styles.addButton}>
      Добавить участок
    </Button>
    <Grid container spacing={2}>
      {segments.map(seg => {
        const line = lines.find(l => l.id === seg.lineId);
        return (
          <Grid size={{ xs: 12, md: 6 }} key={seg.id}>
            <Paper className={className} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>
                <b>{seg.name}</b>
                {line ? (
                  <span style={{ color: '#888', marginLeft: 8 }}>({line.name})</span>
                ) : null}
              </span>
              <Button variant="outlined" size="small" onClick={() => onEdit(seg)}>
                Редактировать
              </Button>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  </div>
);

export default SegmentsList;