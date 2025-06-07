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
    Tooltip
} from '@mui/material';
import {
    Engineering as EngineeringIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { IProductionRoute, IProcessStep, IRouteStep } from '../RouteSettings';
import styles from './RouteForm.module.css';

interface RouteFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (routeData: Partial<IProductionRoute>, selectedSteps: IRouteStep[]) => void;
    route?: IProductionRoute | null;
    steps: IProcessStep[];
    routeSteps: IRouteStep[];
    isEditing: boolean;
}

const RouteForm: React.FC<RouteFormProps> = ({
    open,
    onClose,
    onSave,
    route,
    steps,
    routeSteps,
    isEditing
}) => {
    // Состояние для формы маршрута
    const [routeForm, setRouteForm] = useState<Partial<IProductionRoute>>({
        name: ''
    });

    // Состояние для выбранных этапов
    const [selectedSteps, setSelectedSteps] = useState<IRouteStep[]>([]);
    
    // Состояние для чекбоксов выбора этапов
    const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

    // Инициализация формы при открытии
    useEffect(() => {
        if (route && isEditing) {
            // Редактирование существующего маршрута
            setRouteForm({
                id: route.id,
                name: route.name
            });

            // Устанавливаем выбранные этапы
            setSelectedSteps(routeSteps.sort((a, b) => a.sequence - b.sequence));
            
            // Устанавливаем чекбоксы
            setCheckedSteps(routeSteps.map(rs => rs.processStepId));
        } else {
            // Создание нового маршрута
            setRouteForm({ name: '' });
            setSelectedSteps([]);
            setCheckedSteps([]);
        }
    }, [route, routeSteps, isEditing, open]);

    // Обработчик изменения поля формы
    const handleRouteFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRouteForm(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик изменения чекбокса
    const handleToggleStep = (stepId: number) => {
        // Проверяем, выбран ли уже этап
        const currentIndex = checkedSteps.indexOf(stepId);
        const newChecked = [...checkedSteps];

        if (currentIndex === -1) {
            // Если этап не выбран, добавляем его
            newChecked.push(stepId);
            
            // Добавляем его также в выбранные этапы с новой последовательностью
            const newStep: IRouteStep = {
                id: 0, // временный ID, будет заменен на сервере
                routeId: routeForm.id || 0,
                processStepId: stepId,
                sequence: selectedSteps.length + 1,
                processStep: steps.find(s => s.id === stepId)
            };
            
            setSelectedSteps([...selectedSteps, newStep]);
        } else {
            // Если этап уже выбран, удаляем его
            newChecked.splice(currentIndex, 1);
            
            // Удаляем его из выбранных этапов
            setSelectedSteps(prev => prev.filter(step => step.processStepId !== stepId));
        }

        setCheckedSteps(newChecked);
    };

    // Обработчик перемещения этапа вверх
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        
        const items = Array.from(selectedSteps);
        const temp = items[index];
        items[index] = items[index - 1];
        items[index - 1] = temp;
        
        // Обновляем последовательность
        const updatedItems = items.map((item, idx) => ({
            ...item,
            sequence: idx + 1
        }));
        
        setSelectedSteps(updatedItems);
    };
    
    // Обработчик перемещения этапа вниз
    const handleMoveDown = (index: number) => {
        if (index === selectedSteps.length - 1) return;
        
        const items = Array.from(selectedSteps);
        const temp = items[index];
        items[index] = items[index + 1];
        items[index + 1] = temp;
        
        // Обновляем последовательность
        const updatedItems = items.map((item, idx) => ({
            ...item,
            sequence: idx + 1
        }));
        
        setSelectedSteps(updatedItems);
    };

    // Обработчик сохранения
    const handleSave = () => {
        onSave(routeForm, selectedSteps);
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
                    name="name"
                    label="Название маршрута"
                    type="text"
                    fullWidth
                    value={routeForm.name || ''}
                    onChange={handleRouteFormChange}
                    required
                    variant="outlined"
                    className={styles.formField}
                />

                <div className={styles.stepsSelectionContainer}>
                    <div className={styles.availableStepsContainer}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Доступные этапы обработки
                        </Typography>
                        <List className={styles.stepsList}>
                            {steps.map((step) => (
                                <ListItem key={step.id} dense>
                                    <ListItemAvatar>
                                        <Avatar className={styles.stepAvatar}>
                                            <EngineeringIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={step.name}
                                        secondary={step.description}
                                    />
                                    <Checkbox
                                        edge="end"
                                        onChange={() => handleToggleStep(step.id)}
                                        checked={checkedSteps.indexOf(step.id) !== -1}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </div>

                    <Divider orientation="vertical" flexItem className={styles.divider} />

                    <div className={styles.selectedStepsContainer}>
                        <Typography variant="subtitle1" className={styles.sectionTitle}>
                            Выбранные этапы (порядок выполнения)
                        </Typography>
                        
                        {selectedSteps.length === 0 ? (
                            <Typography className={styles.noStepsSelected}>
                                Этапы обработки не выбраны
                            </Typography>
                        ) : (
                            <List className={styles.selectedStepsList}>
                                {selectedSteps.map((step, index) => (
                                    <ListItem 
                                        key={step.processStepId} 
                                        className={styles.selectedStepItem}
                                    >
                                        <Typography className={styles.stepSequence}>
                                            {index + 1}
                                        </Typography>
                                        <ListItemAvatar>
                                            <Avatar className={styles.stepAvatar}>
                                                <EngineeringIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={steps.find(s => s.id === step.processStepId)?.name}
                                        />
                                        <div className={styles.stepActions}>
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
                                                        disabled={index === selectedSteps.length - 1}
                                                    >
                                                        <ArrowDownwardIcon />
                                                    </IconButton>
                                                </span>
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
                >
                    Отмена
                </Button>
                <Button 
                    onClick={handleSave} 
                    className={`${styles.dialogButton} ${styles.saveButton}`}
                    variant="contained"
                    disabled={!routeForm.name || selectedSteps.length === 0}
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RouteForm;