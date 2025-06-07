import React from 'react';
import {
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  ListItemButton
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { IBuffer } from '../../BufferSettings';
import styles from './BufferList.module.css';

interface BufferListProps {
  buffers: IBuffer[];
  selectedBuffer: IBuffer | null;
  setSelectedBuffer: (buffer: IBuffer) => void;
  onEdit: (buffer: IBuffer) => void;
  onDelete: (id: number) => void;
}

const BufferList: React.FC<BufferListProps> = ({
  buffers,
  selectedBuffer,
  setSelectedBuffer,
  onEdit,
  onDelete
}) => {
  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <Typography variant="h6" component="h2">
          Список буферов
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => onEdit(undefined as any)}
          className={styles.addButton}
        >
          Добавить буфер
        </Button>
      </div>
      <Divider />
      {buffers.length === 0 ? (
        <Typography className={styles.emptyMessage}>
          Буферы не найдены. Создайте первый буфер.
        </Typography>
      ) : (
        <List>
          {buffers.map(buffer => (
            <ListItem key={buffer.id}>
              <ListItemButton
                selected={selectedBuffer?.id === buffer.id}
                onClick={() => setSelectedBuffer(buffer)}
              >
                <ListItemText
                  primary={buffer.name}
                  secondary={
                    <>
                      {buffer.location && (
                        <span className={styles.secondaryText}>
                          Расположение: {buffer.location}
                        </span>
                      )}
                      {buffer.description && (
                        <span className={styles.secondaryText}>
                          {buffer.description}
                        </span>
                      )}
                    </>
                  }
                />
              </ListItemButton>
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => onEdit(buffer)}
                  size="small"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => onDelete(buffer.id)}
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

export default BufferList;