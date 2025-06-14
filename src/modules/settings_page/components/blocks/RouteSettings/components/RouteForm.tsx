import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Checkbox,
    Divider,
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Engineering as EngineeringIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { Route, CreateRouteDto, AvailableStage } from '../api/routes.api';
import { useAvailableStagesLevel2 } from '../hooks/useRoutes';
import styles from './RouteForm.module.css';

interface RouteFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (routeData: CreateRouteDto) => void;
    route?: Route | null;
    availableStages: AvailableStage[];
    isEditing: boolean;
    isLoading: boolean;
}

interface SelectedStage {
    stageId: number;
    substageId?: number;
    sequenceNumber: number;
    stageName: string;
    substageName?: string;
}

const RouteForm: React.FC<RouteFormProps> = ({
    open,
    onClose,
    onSave,
    route,
    availableStages,
    isEditing,
    isLoading
}) => {
    // Состояние для формы маршрута
    const [routeForm, setRouteForm] = useState<{ routeName: string }>({
        routeName: ''
    });

    // Состояние для выбранных этапов
    const [selectedStages, setSelectedStages] = useState<SelectedStage[]>([]);
    
    // Состояние для добавления нового этапа
    const [newStage, setNewStage] = useState({
        stageId: 0,
        substageId: 0
    });

    // Получаем подэтапы для выбранного этапа
    const { data: availableSubstages = [] } = useAvailableStagesLevel2(newStage.stageId);

    // Инициализация формы при открытии
    useEffect(() => {
        if (route && isEditing) {
            // Редактирование существующего маршрута
            setRouteForm({
                routeName: route.routeName
            });

            // Устанавливаем выбранные этапы
            const stages = route.routeStages
                .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                .map(stage => ({
                    stageId: stage.stageId,
                    substageId: stage.substageId,
                    sequenceNumber: stage.sequenceNumber,
                    stageName: stage.stage.stageName,
                    substageName: stage.substage?.substageName
                }));
            
            setSelectedStages(stages);
        } else {
            // Создание нового маршрута
            setRouteForm({ routeName: '' });
            setSelectedStages([]);
        }
        
        // Сброс формы добавления этапа
        setNewStage({ stageId: 0, substageId: 0 });
    }, [route, isEditing, open]);

    // Обработчик изменения поля формы
    const handleRouteFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRouteForm(prev => ({ ...prev, [name]: value }));
    };

    // Добавить этап к маршруту
    const handleAddStage = () => {
        if (newStage.stageId === 0) return;

        const stageInfo = availableStages.find(s => s.stageId === newStage.stageId);
        if (!stageInfo) return;

        const substageInfo = newStage.substageId ? 
            stageInfo.productionStagesLevel2.find(s => s.substageId === newStage.substageId) : 
            undefined;

        const newSelectedStage: SelectedStage = {
            stageId: newStage.stageId,
            substageId: newStage.substageId || undefined,
            sequenceNumber: selectedStages.length + 1,
            stageName: stageInfo.stageName,
            substageName: substageInfo?.substageName
        };

        setSelectedStages([...selectedStages, newSelectedStage]);
        setNewStage({ stageId: 0, substageId: 0 });
    };

    // Удалить этап из маршрута
    const handleRemoveStage = (index: number) => {
        const updatedStages = selectedStages.filter((_, i) => i !== index);
        // Обновляем последовательность
        const reorderedStages = updatedStages.map((stage, idx) => ({
            ...stage,
            sequenceNumber: idx + 1
        }));
        setSelectedStages(reorderedStages);
    };

    // Переместить этап вверх
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        
        const stages = [...selectedStages];
        const temp = stages[index];
        stages[index] = stages[index - 1];
        stages[index - 1] = temp;
        
        // Обновляем последовательность
        const reorderedStages = stages.map((stage, idx) => ({
            ...stage,
            sequenceNumber: idx + 1
        }));
        
        setSelectedStages(reorderedStages);
    };
    
    // Переместить этап вниз
    const handleMoveDown = (index: number) => {
        if (index === selectedStages.length - 1) return;
        
        const stages = [...selectedStages];
        const temp = stages[index];
        stages[index] = stages[index + 1];
        stages[index + 1] = temp;
        
        // Обновляем последовательность
        const reorderedStages = stages.map((stage, idx) => ({
            ...stage,
            sequenceNumber: idx + 1
        }));
        
        setSelectedStages(reorderedStages);
    };

    // Обработчик сохранения
    const handleSave = () => {
        const routeData: CreateRouteDto = {
            routeName: routeForm.routeName,
            stages: selectedStages.map(stage => ({
                stageId: stage.stageId,
                substageId: stage.substageId,
                sequenceNumber: stage.sequenceNumber
            }))
        };
        
        onSave(routeData);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle className={styles.dialogTitle}>
                {isEditing ? 'Редактирование маршрута' : 'Создание нового маршрута'}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
                <TextField
                    autoFocus
                    margin="dense"
                    name="routeName"
                    label="Название маршрута"
                    type="text"
                    fullWidth
                    value={routeForm.routeName}
                    onChange={handleRouteFormChange}
                    required
                    variant="outlined"
                    className={styles.formField}
                />

                <div className={styles.stagesContainer}>
                    {/* Форма добавления этапа */}
                    <div className={styles.addStageForm}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Добавить этап обработки
                        </Typography>
                        <div className={styles.addStageInputs}>
                            <FormControl variant="outlined" className={styles.stageSelect}>
                                <InputLabel>Этап обработки</InputLabel>
                                <Select
                                    value={newStage.stageId}
                                    onChange={(e) => setNewStage(prev => ({ 
                                        ...prev, 
                                        stageId: e.target.value as number,
                                        substageId: 0 // Сбрасываем подэтап при смене этапа
                                    }))}
                                    label="Этап обработки"
                                >
                                    <MenuItem value={0}>Выберите этап</MenuItem>
                                    {availableStages.map(stage => (
                                        <MenuItem key={stage.stageId} value={stage.stageId}>
                                            {stage.stageName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {newStage.stageId > 0 && availableSubstages.length > 0 && (
                                <FormControl variant="outlined" className={styles.substageSelect}>
                                    <InputLabel>Подэтап (опционально)</InputLabel>
                                    <Select
                                        value={newStage.substageId}
                                        onChange={(e) => setNewStage(prev => ({ 
                                            ...prev, 
                                            substageId: e.target.value as number 
                                        }))}
                                        label="Подэтап (опционально)"
                                    >
                                        <MenuItem value={0}>Не выбран</MenuItem>
                                        {availableSubstages.map(substage => (
                                            <MenuItem key={substage.substageId} value={substage.substageId}>
                                                {substage.substageName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <Button
                                variant="contained"
                                onClick={handleAddStage}
                                disabled={newStage.stageId === 0}
                                className={styles.addStageButton}
                            >
                                Добавить
                            </Button>
                        </div>
                    </div>

                    <Divider className={styles.divider} />

                    {/* Список выбранных этапов */}
                    <div className={styles.selectedStagesContainer}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Выбранные этапы (порядок выполнения)
                        </Typography>
                        
                        {selectedStages.length === 0 ? (
                            <Alert severity="info" className={styles.noStagesAlert}>
                                Этапы обработки не выбраны. Добавьте этапы для создания маршрута.
                            </Alert>
                        ) : (
                            <List className={styles.selectedStagesList}>
                                {selectedStages.map((stage, index) => (
                                    <ListItem 
                                        key={`${stage.stageId}-${stage.substageId || 'none'}-${index}`}
                                        className={styles.selectedStageItem}
                                    >
                                        <Typography className={styles.stageSequence}>
                                            {index + 1}
                                        </Typography>
                                        <ListItemAvatar>
                                            <Avatar className={styles.stageAvatar}>
                                                <EngineeringIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={stage.stageName}
                                            secondary={stage.substageName ? `→ ${stage.substageName}` : null}
                                        />
                                        <div className={styles.stageActions}>
                                            <Tooltip title="Переместить вверх">
                                                <span>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                    >
                                                        <ArrowUpwardIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Переместить вниз">
                                                <span>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === selectedStages.length - 1}
                                                    >
                                                        <ArrowDownwardIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Удалить этап">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleRemoveStage(index)}
                                                    className={styles.deleteButton}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </div>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </div>
                </div>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
                <Button 
                    onClick={onClose} 
                    className={`${styles.dialogButton} ${styles.cancelButton}`}
                    disabled={isLoading}
                >
                    Отмена
                </Button>
                <Button 
                    onClick={handleSave} 
                    className={`${styles.dialogButton} ${styles.saveButton}`}
                    variant="contained"
                    disabled={!routeForm.routeName || selectedStages.length === 0 || isLoading}
                >
                    {isLoading ? (
                        <>
                            <CircularProgress size={20} style={{ marginRight: 8 }} />
                            Сохранение...
                        </>
                    ) : (
                        'Сохранить'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RouteForm;