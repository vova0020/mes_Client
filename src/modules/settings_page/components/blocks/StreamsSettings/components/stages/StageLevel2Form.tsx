// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/stages/StageLevel2Form.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi } from '../../api/streamsApi';
import { CreateStageLevel2Data, UpdateStageLevel2Data, RebindStageLevel2Data } from '../../types/streams.types';
import styles from '../StreamForm.module.css';

interface StageLevel2FormProps {
  editId?: number;
  preselectedStageId?: number;
  onSaved: () => void;
  onCancel: () => void;
}

export const StageLevel2Form: React.FC<StageLevel2FormProps> = ({ 
  editId, 
  preselectedStageId,
  onSaved, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    stageId: preselectedStageId || '',
    substageName: '',
    description: '',
    allowance: '1',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const isEditing = Boolean(editId);

  // Получение данных для редактирования
  const { data: editSubstage, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['production-stage-level2', editId],
    queryFn: () => streamsApi.getProductionStageLevel2(editId!),
    enabled: isEditing,
  });

  // Получение списка родительских этапов
  const { data: parentStages = [] } = useQuery({
    queryKey: ['production-stages-level1'],
    queryFn: () => streamsApi.getProductionStagesLevel1(),
  });

  // Мутация для создания подэтапа
  const createMutation = useMutation({
    mutationFn: (data: CreateStageLevel2Data) => streamsApi.createProductionStageLevel2(data),
    onSuccess: (newSubstage) => {
      console.log('✅ Подэтап создан успешно:', newSubstage);
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] }); // Обновляем счетчики
      onSaved();
    },
    onError: (error: Error) => {
      console.error('❌ Ошибка создания подэтапа:', error);
      setErrors({ submit: error.message });
    },
  });

  // Мутация для обновления подэтапа
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStageLevel2Data }) =>
      streamsApi.updateProductionStageLevel2(id, data),
    onSuccess: (updatedSubstage) => {
      console.log('✅ Подэтап обновлен успешно:', updatedSubstage);
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      queryClient.invalidateQueries({ queryKey: ['production-stage-level2', editId] });
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] }); // Обновляем счетчики
      onSaved();
    },
    onError: (error: Error) => {
      console.error('❌ Ошибка обновления подэтапа:', error);
      setErrors({ submit: error.message });
    },
  });

  // Мутация для перепривязки подэтапа к другому этапу 1 уровня
  const rebindMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RebindStageLevel2Data }) =>
      streamsApi.rebindProductionStageLevel2(id, data),
    onSuccess: (reboundSubstage) => {
      console.log('✅ Подэтап перепривязан успешно:', reboundSubstage);
      queryClient.invalidateQueries({ queryKey: ['production-stages-level2'] });
      queryClient.invalidateQueries({ queryKey: ['production-stage-level2', editId] });
      queryClient.invalidateQueries({ queryKey: ['production-stages-level1'] }); // Обновляем счетчики
      onSaved();
    },
    onError: (error: Error) => {
      console.error('❌ Ошибка перепривязки подэтапа:', error);
      setErrors({ submit: error.message });
    },
  });

  // Заполнение формы при редактировании
  useEffect(() => {
    if (editSubstage) {
      setFormData({
        stageId: editSubstage.stageId.toString(),
        substageName: editSubstage.substageName,
        description: editSubstage.description || '',
        allowance: editSubstage.allowance.toString(),
      });
    }
  }, [editSubstage]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Проверяем stageId
    const stageIdNum = Number(formData.stageId);
    if (!formData.stageId || isNaN(stageIdNum) || stageIdNum <= 0) {
      newErrors.stageId = 'Выберите родительскую операцию';
    }

    if (!formData.substageName.trim()) {
      newErrors.substageName = 'Название подэтапа обязательно';
    } else if (formData.substageName.trim().length < 2) {
      newErrors.substageName = 'Название должно содержать минимум 2 символа';
    }

    // Проверка допуска временно отключена (поле скрыто)
    // const allowanceNum = Number(formData.allowance);
    // if (!formData.allowance || isNaN(allowanceNum) || allowanceNum < 0) {
    //   newErrors.allowance = 'Допуск должен быть положительным числом';
    // } else if (allowanceNum > 1000) {
    //   newErrors.allowance = 'Допуск не может превышать 1000 мм';
    // }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Описание не должно превышать 500 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    if (isEditing && editId !== undefined && editSubstage) {
      // Проверяем, изменилась ли родительская операция
      const hasStageChanged = Number(formData.stageId) !== editSubstage.stageId;
      
      if (hasStageChanged) {
        // Если родительская операция изменилась - используем новый API перепривязки
        rebindMutation.mutate({ 
          id: editId, 
          data: { newStageId: Number(formData.stageId) }
        });
      } else {
        // Если родительская операция не изменилась - обычное обновление без stageId
        const updateData: UpdateStageLevel2Data = {
          substageName: formData.substageName.trim(),
          description: formData.description.trim() || undefined,
          allowance: Number(formData.allowance),
        };
        updateMutation.mutate({ id: editId, data: updateData });
      }
    } else {
      // Создание нового подэтапа
      const createData: CreateStageLevel2Data = {
        stageId: Number(formData.stageId),
        substageName: formData.substageName.trim(),
        description: formData.description.trim() || undefined,
        allowance: Number(formData.allowance),
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || rebindMutation.isPending || isLoadingEdit;

  const selectedParentStage = parentStages.find(stage => stage.stageId === Number(formData.stageId));

  return (
    <div className={styles.streamFormContainer}> 
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          <span style={{ marginRight: '0.5rem' }}>🔧</span>
          {isEditing ? 'Редактировать подэтап' : 'Создать подэтап'}
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
        {/* Выбор родительской операции */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Родительская операция</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="stageId" className={styles.label}>
              Технологическая операция *
            </label>
            <select
              id="stageId"
              name="stageId"
              value={formData.stageId}
              onChange={handleInputChange}
              className={`${styles.select} ${errors.stageId ? styles.errorBorder : ''}`}
              disabled={isLoading} // Теперь можно менять при редактировании
            >
              <option value="">Выберите операцию</option>
              {parentStages.map(stage => (
                <option key={stage.stageId} value={stage.stageId}>
                  {stage.stageName}
                </option>
              ))}
            </select>
            {errors.stageId && (
              <div className={styles.error}>{errors.stageId}</div>
            )}
            
            {/* Предупреждение при смене родительской операции во время редактирования */}
            {isEditing && editSubstage && Number(formData.stageId) !== editSubstage.stageId && (
              <div style={{ 
                color: '#d97706', 
                backgroundColor: '#fef3c7', 
                padding: '12px 16px', 
                borderRadius: '6px',
                marginTop: '12px',
                border: '1px solid #fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{fontSize: '18px'}}>⚠️</span>
                <div>
                  <div style={{fontWeight: '600', marginBottom: '4px'}}>
                    Внимание: смена родительской операции
                  </div>
                  <div style={{fontSize: '14px'}}>
                    Подэтап будет перемещен из операции "{editSubstage.stageName}" 
                    в операцию "{selectedParentStage?.stageName}". 
                    Данные подэтапа (название, описание, допуск) сохранятся.
                  </div>
                </div>
              </div>
            )}
            
            {selectedParentStage && (
              <div className={styles.selectedStageInfo}>
                <div className={styles.stageInfoCard}>
                  <div className={styles.stageInfoHeader}>
                    <span className={styles.stageInfoIcon}>⚙️</span>
                    <span className={styles.stageInfoName}>{selectedParentStage.stageName}</span>
                  </div>
                  {selectedParentStage.description && (
                    <div className={styles.stageInfoDescription}>
                      {selectedParentStage.description}
                    </div>
                  )}
                  <div className={styles.stageInfoStats}>
                    <span>Подэтапов: {selectedParentStage.substagesCount || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Основная информация подэтапа */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Информация о подэтапе</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="substageName" className={styles.label}>
              Название подэтапа *
            </label>
            <input
              type="text"
              id="substageName"
              name="substageName"
              value={formData.substageName}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.substageName ? styles.errorBorder : ''}`}
              placeholder="Введите название подэтапа"
              disabled={isLoading}
            />
            {errors.substageName && (
              <div className={styles.error}>{errors.substageName}</div>
            )}
          </div>

          {/* Поле допуска временно скрыто */}
          <div className={styles.formGroup} style={{ display: 'none' }}>
            <label htmlFor="allowance" className={styles.label}>
              Допуск (мм) *
            </label>
            <input
              type="number"
              id="allowance"
              name="allowance"
              value={formData.allowance}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.allowance ? styles.errorBorder : ''}`}
              placeholder="Введите допуск в миллиметрах"
              min="0"
              max="1000"
              step="0.01"
              disabled={isLoading}
            />
            {errors.allowance && (
              <div className={styles.error}>{errors.allowance}</div>
            )}
            <div className={styles.fieldHint}>
              Допустимое отклонение для данного подэтапа в миллиметрах (от 0 до 1000 мм)
            </div>
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
              placeholder="Опишите подэтап (необязательно)"
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
        {isEditing && editSubstage && (
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Информация</h3>
            <div className={styles.editInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>ID подэтапа:</span>
                <span className={styles.infoValue}>{editSubstage.substageId}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Текущая родительская операция:</span>
                <span className={styles.infoValue}>
                  {editSubstage.stageName || `ID: ${editSubstage.stageId}`}
                </span>
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
                {isEditing ? 
                  (editSubstage && Number(formData.stageId) !== editSubstage.stageId ? 'Перепривязка...' : 'Сохранение...') 
                  : 'Создание...'
                }
              </>
            ) : (
              <>
                <span style={{ marginRight: '0.5rem' }}>
                  {isEditing ? 
                    (editSubstage && Number(formData.stageId) !== editSubstage.stageId ? '🔄' : '💾') 
                    : '✨'
                  }
                </span>
                {isEditing ? 
                  (editSubstage && Number(formData.stageId) !== editSubstage.stageId ? 'Перепривязать подэтап' : 'Сохранить изменения')
                  : 'Создать подэтап'
                }
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};