import React from 'react';
import { Button, Tooltip, Chip } from '@mui/material';
import { IProductionLine, IProductionSegment } from '../types';
import styles from '../StreamsSettings.module.css';

interface LinesListProps {
  lines: IProductionLine[];
  segmentsByLine: Record<number, IProductionSegment[]>;
  onEditLine: (line: IProductionLine) => void;
  onAddLine: () => void;
  onEditSegment: (segment: IProductionSegment, parent?: IProductionLine) => void;
  onAddSegment: (parentLine: IProductionLine) => void;
  className?: string;
}
const LinesList: React.FC<LinesListProps> = ({
  lines,
  segmentsByLine,
  onEditLine,
  onAddLine,
  onEditSegment,
  onAddSegment,
  className,
}) => (
  <div className={styles.userManagement}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      <Button variant="contained" color="primary" onClick={onAddLine} className={styles.addButton}>
        + Добавить линию
      </Button>
      <span style={{ color: '#bebebe', fontSize: 14, marginLeft: 12 }}>Всего: {lines.length}</span>
    </div>
    <div className={styles.linesGrid}>
      {lines.map(line => (
        <section className={styles.lineCard} key={line.id}>
          <header className={styles.lineCardHeader}>
            <span>
              <b>{line.name}</b>
              <Chip
                label={line.type === 'PRIMARY' ? 'Основная' : 'Второстепенная'}
                size="small"
                color={line.type === 'PRIMARY' ? 'primary' : 'default'}
                style={{ marginLeft: 10 }}
              />
            </span>
            <span>
              <Tooltip title="Редактировать линию">
                <Button onClick={() => onEditLine(line)} size="small" color="inherit" className={styles.editLink}>✏️</Button>
              </Tooltip>
              <Tooltip title="Добавить участок в эту линию">
                <Button onClick={() => onAddSegment(line)} size="small" color="success" className={styles.addLink}>+ Участок</Button>
              </Tooltip>
            </span>
          </header>
          <div className={styles.segmentList}>
            <div className={styles.segmentCount}>
              Участков: <b>{segmentsByLine[line.id]?.length || 0}</b>
            </div>
            {(segmentsByLine[line.id]?.length || 0) === 0 && (
              <div className={styles.emptySegmentsMsg}>Нет ни одного участка в этой линии</div>
            )}
            {segmentsByLine[line.id]?.map(segment => (
              <div className={styles.segmentRow} key={segment.id}>
                <span>
                  {segment.name}
                </span>
                <Tooltip title="Редактировать участок">
                  <Button
                    onClick={() => onEditSegment(segment, line)}
                    size="small"
                    color="secondary"
                    className={styles.editLink}
                  >
                    ✏️
                  </Button>
                </Tooltip>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

export default LinesList;