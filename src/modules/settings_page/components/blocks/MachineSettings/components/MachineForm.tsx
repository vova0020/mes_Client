import React, { useState, useEffect } from 'react';
import { useMachine, useCreateMachine, useUpdateMachine } from '../hooks/useMachinesQuery';
import { MachineStatus, CreateMachineDto, UpdateMachineDto } from '../MachineSettings';
import styles from './MachineForm.module.css';

interface MachineFormProps {
  editId?: number;
  onSaved: () => void;
  onCancel: () => void;
}

interface FormData {
  machineName: string;
  status: MachineStatus;
  recommendedLoad: string;
  loadUnit: string;
  noSmenTask: boolean;
}

interface FormErrors {
  machineName?: string;
  status?: string;
  recommendedLoad?: string;
  loadUnit?: string;
}

export const MachineForm: React.FC<MachineFormProps> = ({
  editId,
  onSaved,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    machineName: '',
    status: MachineStatus.INACTIVE,
    recommendedLoad: '',
    loadUnit: 'кг',
    noSmenTask: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingMachine, isLoading: isLoadingMachine } = useMachine(editId);
  const createMachineMutation = useCreateMachine();
  const updateMachineMutation = useUpdateMachine();

  const isEditing = !!editId;
  const title = isEditing ? 'Редактировать станок' : 'Создать станок';

  // Заполняем форму данными существующего станка при редактировании
  useEffect(() => {
    if (isEditing && existingMachine) {
      setFormData({
        machineName: existingMachine.machineName,
        status: existingMachine.status,
        recommendedLoad: existingMachine.recommendedLoad.toString(),
        loadUnit: existingMachine.loadUnit,
        noSmenTask: existingMachine.noSmenTask,
      });
    }
  }, [isEditing, existingMachine]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валидация названия
    if (!formData.machineName.trim()) {
      newErrors.machineName = 'Название станка обязательно';
    } else if (formData.machineName.length < 3) {
      newErrors.machineName = 'Название должно содержать минимум 3 символа';
    } else if (formData.machineName.length > 100) {
      newErrors.machineName = 'Название не должно превышать 100 символов';
    }

    // Валидация статуса
    if (!Object.values(MachineStatus).includes(formData.status)) {
      newErrors.status = 'Выберите корректный статус';
    }

    // Валидация нагрузки
    const loadValue = parseFloat(formData.recommendedLoad);
    if (!formData.recommendedLoad.trim()) {
      newErrors.recommendedLoad = 'Рекомендуемая нагрузка обязательна';
    } else if (isNaN(loadValue)) {
      newErrors.recommendedLoad = 'Нагрузка должна быть числом';
    } else if (loadValue <= 0) {
      newErrors.recommendedLoad = 'Нагрузка должна быть положительным числом';
    } else if (loadValue > 10000) {
      newErrors.recommendedLoad = 'Нагрузка не может превышать 10000';
    }

    // Валидация единицы измерения
    if (!formData.loadUnit.trim()) {
      newErrors.loadUnit = 'Единица измерения обязательна';
    } else if (formData.loadUnit.length > 20) {
      newErrors.loadUnit = 'Единица измерения не должна превышат�� 20 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибку для этого поля при изменении
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const machineData = {
        machineName: formData.machineName.trim(),
        status: formData.status,
        recommendedLoad: parseFloat(formData.recommendedLoad),
        loadUnit: formData.loadUnit.trim(),
        noSmenTask: formData.noSmenTask,
      };

      if (isEditing && editId) {
        await updateMachineMutation.mutateAsync({
          id: editId,
          data: machineData as UpdateMachineDto,
        });
      } else {
        await createMachineMutation.mutateAsync(machineData as CreateMachineDto);
      }

      onSaved();
    } catch (error: any) {
      console.error('Ошибка сохранения станка:', error);
      
      // Показываем ошибку пользователю
      if (error.message) {
        alert(`Ошибка: ${error.message}`);
      } else {
        alert('Произошла ошибка при сохранении станка. Попробуйте еще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoadingMachine) {
    return (
      <div className={styles.form}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка данных станка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button onClick={onCancel} className={styles.closeButton}>
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContent}>
        {/* Название станка */}
        <div className={styles.field}>
          <label htmlFor="machineName" className={styles.label}>
            Название станка *
          </label>
          <input
            id="machineName"
            type="text"
            value={formData.machineName}
            onChange={(e) => handleInputChange('machineName', e.target.value)}
            className={`${styles.input} ${errors.machineName ? styles.inputError : ''}`}
            placeholder="Введите название станка"
            maxLength={100}
          />
          {errors.machineName && (
            <span className={styles.errorText}>{errors.machineName}</span>
          )}
        </div>

        {/* Статус */}
        <div className={styles.field}>
          <label htmlFor="status" className={styles.label}>
            Статус *
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as MachineStatus)}
            className={`${styles.select} ${errors.status ? styles.selectError : ''}`}
          >
            <option value={MachineStatus.ACTIVE}>Активен</option>
            <option value={MachineStatus.INACTIVE}>Неактивен</option>
            <option value={MachineStatus.MAINTENANCE}>Обслуживание</option>
          </select>
          {errors.status && (
            <span className={styles.errorText}>{errors.status}</span>
          )}
        </div>

        {/* Рекомендуемая нагрузка */}
        <div className={styles.field}>
          <label htmlFor="recommendedLoad" className={styles.label}>
            Рекомендуемая нагрузка *
          </label>
          <input
            id="recommendedLoad"
            type="number"
            step="0.1"
            min="0.1"
            max="10000"
            value={formData.recommendedLoad}
            onChange={(e) => handleInputChange('recommendedLoad', e.target.value)}
            className={`${styles.input} ${errors.recommendedLoad ? styles.inputError : ''}`}
            placeholder="Введите нагрузку"
          />
          {errors.recommendedLoad && (
            <span className={styles.errorText}>{errors.recommendedLoad}</span>
          )}
        </div>

        {/* Единица измерения */}
        <div className={styles.field}>
          <label htmlFor="loadUnit" className={styles.label}>
            Единица измерения *
          </label>
          <select
            id="loadUnit"
            value={formData.loadUnit}
            onChange={(e) => handleInputChange('loadUnit', e.target.value)}
            className={`${styles.select} ${errors.loadUnit ? styles.selectError : ''}`}
          >
            {/* <option value="кг">кг</option> */}
            {/* <option value="т">т</option> */}
            <option value="шт">шт</option>
            {/* <option value="м">м</option> */}
            <option value="м²">м²</option>
            {/* <option value="м³">м³</option> */}
            {/* <option value="л">л</option> */}
          </select>
          {errors.loadUnit && (
            <span className={styles.errorText}>{errors.loadUnit}</span>
          )}
        </div>

        {/* Изменяемые задачи */}
        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.noSmenTask}
              onChange={(e) => handleInputChange('noSmenTask', e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>
              Без сменного задания
            </span>
          </label>
          <div className={styles.fieldHelp}>
            Если включено, то станок работает без сменного задания
          </div>
        </div>

        {/* Кнопки */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.submitSpinner}></span>
                {isEditing ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              isEditing ? 'Сохранить' : 'Создать'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};