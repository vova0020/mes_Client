import React from 'react';
import {
    Typography,
    List,
    ListItem,
    ListItemText,
    Button,
    IconButton,
    Tooltip,
    Paper,
    Divider
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { IProcessStep } from '../OperationsSettings';
import styles from './OperationsList.module.css';

interface OperationsListProps {
    operations: IProcessStep[];
    selectedOperation: IProcessStep | null;
    setSelectedOperation: (operation: IProcessStep | null) => void;
    onEdit: (operation?: IProcessStep) => void;
    onDelete: (id: number) => void;
}

const OperationsList: React.FC<OperationsListProps> = ({
    operations,
    selectedOperation,
    setSelectedOperation,
    onEdit,
    onDelete
}) => {
    // Сортировка операций по порядковому номеру
    const sortedOperations = [...operations].sort((a, b) => a.sequence - b.sequence);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Typography variant="h6">Технологические операции</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => onEdit()}
                >
                    Добавить
                </Button>
            </div>
            
            <Divider style={{ marginBottom: '16px' }} />
            
            {operations.length === 0 ? (
                <Typography className={styles.noDataMessage}>
                    Операции не найдены. Создайте новую операцию, нажав кнопку "Добавить".
                </Typography>
            ) : (
                <Paper variant="outlined" style={{ maxHeight: '500px', overflow: 'auto' }}>
                    <List>
                        {sortedOperations.map(operation => (
                            <ListItem
                                key={operation.id}
                                className={`${styles.listItem} ${selectedOperation?.id === operation.id ? styles.selectedItem : ''}`}
                                onClick={() => setSelectedOperation(operation)}
                                secondaryAction={
                                    <>
                                        <Tooltip title="Редактировать">
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(operation);
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Удалить">
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(operation.id);
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                }
                            >
                                <ListItemText
                                    primary={operation.name}
                                    secondary={
                                        <>
                                            <span>Порядковый номер: {operation.sequence}</span>
                                            {operation.description && (
                                                <span> | {operation.description}</span>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </div>
    );
};

export default OperationsList;