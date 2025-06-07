import React from 'react';
import {
    Typography,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { IStepRelation, IProcessStep } from '../OperationsSettings';
import styles from './RelationsList.module.css';

interface RelationsListProps {
    relations: IStepRelation[];
    operations: IProcessStep[];
    onDelete: (parentId: number, childId: number) => void;
    onAdd: () => void;
}

const RelationsList: React.FC<RelationsListProps> = ({
    relations,
    operations,
    onDelete,
    onAdd
}) => {
    // Функция для получения названия операции по ID
    const getOperationName = (operationId: number): string => {
        const operation = operations.find(op => op.id === operationId);
        return operation ? operation.name : 'Неизвестная операция';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Typography variant="h6">Связи между операциями</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                >
                    Добавить связь
                </Button>
            </div>
            
            <Divider style={{ marginBottom: '16px' }} />
            
            {relations.length === 0 ? (
                <Typography className={styles.noDataMessage}>
                    Связи между операциями не найдены. Добавьте новую связь, нажав кнопку "Добавить связь".
                </Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined" className={styles.tableContainer}>
                    <Table>
                        <TableHead>
                            <TableRow className={styles.tableHeader}>
                                <TableCell>Предшествующая операция</TableCell>
                                <TableCell>Последующая операция</TableCell>
                                <TableCell align="center">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {relations.map(relation => (
                                <TableRow key={`${relation.parentId}-${relation.childId}`}>
                                    <TableCell>{getOperationName(relation.parentId)}</TableCell>
                                    <TableCell>{getOperationName(relation.childId)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Удалить связь">
                                            <IconButton
                                                size="small"
                                                onClick={() => onDelete(relation.parentId, relation.childId)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </div>
    );
};

export default RelationsList;