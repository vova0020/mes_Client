import React from 'react';
import {
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { IBuffer, IBufferCell } from '../../BufferSettings';
import styles from './CellList.module.css';

interface CellListProps {
  selectedBuffer: IBuffer | null;
  cells: IBufferCell[];
  onEdit: (cell: IBufferCell) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

const CellList: React.FC<CellListProps> = ({
  selectedBuffer,
  cells,
  onEdit,
  onDelete,
  onAdd
}) => {
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

  if (!selectedBuffer) {
    return (
      <Typography className={styles.selectPrompt}>
        Выберите буфер для просмотра ячеек
      </Typography>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <Typography variant="h6" component="h2">
          Ячейки буфера: {selectedBuffer.name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
          className={styles.addButton}
        >
          Добавить ячейку
        </Button>
      </div>
      <Divider />
      {cells.length === 0 ? (
        <Typography className={styles.emptyMessage}>
          В этом буфере нет ячеек. Создайте первую ячейку.
        </Typography>
      ) : (
        <List>
          {cells.map(cell => (
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
                  onClick={() => onEdit(cell)}
                  size="small"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => onDelete(cell.id)}
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

export default CellList;