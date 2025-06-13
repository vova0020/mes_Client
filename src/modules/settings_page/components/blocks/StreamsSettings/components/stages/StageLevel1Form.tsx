// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/stages/StageLevel1Form.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi } from '../../api/streamsApi';
import { CreateStageLevel1Data, UpdateStageLevel1Data } from '../../types/streams.types';
import styles from '../StreamForm.module.css';

interface StageLevel1FormProps {
  editId?: number;
  onSaved: () => void;
  onCancel: () => void;
}

export const StageLevel1Form: React.FC<StageLevel1FormProps> = ({ 
  editId, 
  onSaved, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    stageName: '',
    description: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const isEditing = Boolean(editId);

  // Получение данных для редактирования
  const { data: editStage, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['production-stage-level1', editId],
    queryFn: () => streamsApi.getProductionStageLevel1(editId!),
    enabled: isEditing,
  });

  // Мутация для создания этапа
  const createMutation = useMutation({
    mutationFn: (data: CreateStageLevel1Data) => streamsApi.createProductionStageLevel1(data),
    onSuccess: (newStage) => {
      console.log('✅ Технологическая операция создана успешно:', newStage);
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      onSaved();
    },
    onError: (error: Error) => {
      console.error('❌ Ошибка создания технологической операции:', error);
      setErrors({ submit: error.message });
    },
  });

  // Мутация для обновления этапа
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStageLevel1Data }) =>
      streamsApi.updateProductionStageLevel1(id, data),
    onSuccess: (updatedStage) => {
      console.log('✅ Технологическая операция обновлена успе��но:', updatedStage);
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] });
      queryClient.invalidateQueries({ queryKey: ['production-stage-level1', editId] });
      onSaved();
    },
    onError: (error: Error) => {
      console.error('❌ Ошибка обновления технологической операции:', error);
      setErrors({ submit: error.message });
    },
  });

  // Заполнение формы при редактировании
  useEffect(() => {
    if (editStage) {
      setFormData({
        stageName: editStage.stageName,
        description: editStage.description || '',
      });
    }
  }, [editStage]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.stageName.trim()) {
      newErrors.stageName = 'Название операции обязательно';
    } else if (formData.stageName.trim().length < 2) {
      newErrors.stageName = 'Название должно содержать минимум 2 символа';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Описание не должно превышать 500 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const stageData = {
      stageName: formData.stageName.trim(),
      description: formData.description.trim() || undefined,
    };

    if (isEditing && editId !== undefined) {
      updateMutation.mutate({ id: editId, data: stageData });
    } else {
      createMutation.mutate(stageData as CreateStageLevel1Data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingEdit;

  return (
    <div className={styles.streamFormContainer}> 
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          <span style={{ marginRight: '0.5rem' }}>⚙️</span>
          {isEditing ? 'Редактировать операцию' : 'Создать технологическую операцию'}
        </h2>
        <button
          onClick={onCancel}
          className={styles.closeButton}
          type="button"
          disabled={isLoading}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Основная информация */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Основная информация</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="stageName" className={styles.label}>
              Название операции *
            </label>
            <input
              type="text"
              id="stageName"
              name="stageName"
              value={formData.stageName}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.stageName ? styles.errorBorder : ''}`}
              placeholder="Введите название технологической операции"
              disabled={isLoading}
            />
            {errors.stageName && (
              <div className={styles.error}>{errors.stageName}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${styles.textarea} ${errors.description ? styles.errorBorder : ''}`}
              placeholder="Опишите технологическую операцию (необязательно)"
              rows={4}
              disabled={isLoading}
            />
            {errors.description && (
              <div className={styles.error}>{errors.description}</div>
            )}
            <div className={styles.characterCount}>
              {formData.description.length}/500 символов
            </div>
          </div>
        </div>

        {/* Отображение информации при редактировании */}
        {isEditing && editStage && (
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Статистика</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔧</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{editStage.substagesCount || 0}</div>
                  <div className={styles.statLabel}>Подэтапов</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📅</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>
                    {new Date(editStage.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                  <div className={styles.statLabel}>Создано</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📝</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>
                    {new Date(editStage.updatedAt).toLocaleDateString('ru-RU')}
                  </div>
                  <div className={styles.statLabel}>Обновлено</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Отображение ошибок */}
        {errors.submit && (
          <div className={styles.formSection}>
            <div className={styles.errorMessage}>
              <strong>Ошибка:</strong> {errors.submit}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={`${styles.button} ${styles.cancelButton}`}
            disabled={isLoading}
          >
            Отмена
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.submitButton}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                {isEditing ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              <>
                <span style={{ marginRight: '0.5rem' }}>
                  {isEditing ? '💾' : '✨'}
                </span>
                {isEditing ? 'Сохранить изменения' : 'Создать операцию'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};