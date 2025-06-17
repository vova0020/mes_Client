import React, { useState, useEffect } from 'react';
import { BufferDetailResponse, CreateBufferDto, CellStatus, CreateBufferCellDto } from '../types/buffers.types';
import { 
  useCreateBuffer, 
  useUpdateBuffer, 
  useAvailableStages, 
  useBuffer,
  useUpdateBufferStages,
  useBufferStages
} from '../hooks/useBuffersQuery';
import styles from './BufferForm.module.css';

interface BufferFormProps {
  editId?: number;
  onSaved?: () => void;
  onCancel?: () => void;
}

const BufferForm: React.FC<BufferFormProps> = ({
  editId,
  onSaved,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    bufferName: '',
    description: '',
    location: '',
    stageIds: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stagesChanged, setStagesChanged] = useState(false);

  // Исправленная строка - убрал второй параметр с опциями
  const { data: buffer } = useBuffer(editId!);
  const { data: availableStages } = useAvailableStages();
  const { data: currentBufferStages } = useBufferStages(editId!);
  
  const createBufferMutation = useCreateBuffer();
  const updateBufferMutation = useUpdateBuffer();
  const updateBufferStagesMutation = useUpdateBufferStages();

  const isEditing = !!editId;

  useEffect(() => {
    if (buffer && isEditing) {
      setFormData({
        bufferName: buffer.bufferName,
        description: buffer.description || '',
        location: buffer.location,
        stageIds: buffer.bufferStages.map(stage => stage.stageId)
      });
    }
  }, [buffer, isEditing]);

  // Отслеживаем изменения в этапах для режима редактирования
  useEffect(() => {
    if (isEditing && buffer && currentBufferStages) {
      const originalStageIds = buffer.bufferStages.map(stage => stage.stageId).sort();
      const currentStageIds = formData.stageIds.sort();
      
      const hasChanges = originalStageIds.length !== currentStageIds.length ||
        originalStageIds.some((id, index) => id !== currentStageIds[index]);
      
      setStagesChanged(hasChanges);
    }
  }, [formData.stageIds, buffer, currentBufferStages, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bufferName.trim()) {
      newErrors.bufferName = 'Название буфера обязательно';
    } else if (formData.bufferName.length > 100) {
      newErrors.bufferName = 'Название не должно превышать 100 символов';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Местоположение обязательно';
    } else if (formData.location.length > 200) {
      newErrors.location = 'Местоположение не должно превышать 200 символов';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Описание не должно превышать 500 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing) {
        // Обновляем основную информацию буфера
        await updateBufferMutation.mutateAsync({
          id: editId!,
          data: {
            bufferName: formData.bufferName,
            description: formData.description || undefined,
            location: formData.location
          }
        });

        // Обновляем этапы, если они изменились
        if (stagesChanged) {
          await updateBufferStagesMutation.mutateAsync({
            bufferId: editId!,
            stagesData: {
              stageIds: formData.stageIds
            }
          });
        }
      } else {
        // Создаем новый буфер
        await createBufferMutation.mutateAsync({
          bufferName: formData.bufferName,
          description: formData.description || undefined,
          location: formData.location,
          stageIds: formData.stageIds.length > 0 ? formData.stageIds : undefined
        });
      }

      onSaved?.();
    } catch (error) {
      console.error('Ошибка при сохранении буфера:', error);
      alert('Ошибка при сохранении буфера');
    }
  };

  const handleStageToggle = (stageId: number) => {
    setFormData(prev => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter(id => id !== stageId)
        : [...prev.stageIds, stageId]
    }));
  };

  const isLoading = createBufferMutation.isPending || updateBufferMutation.isPending || updateBufferStagesMutation.isPending;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{isEditing ? 'Редактирование буфера' : 'Создание буфера'}</h3>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h4>Основная информация</h4>
          
          <div className={styles.field}>
            <label>Название буфера *</label>
            <input
              type="text"
              value={formData.bufferName}
              onChange={(e) => setFormData(prev => ({ ...prev, bufferName: e.target.value }))}
              className={errors.bufferName ? styles.error : ''}
              maxLength={100}
              placeholder="Введите название буфера"
            />
            {errors.bufferName && <span className={styles.errorText}>{errors.bufferName}</span>}
          </div>

          <div className={styles.field}>
            <label>Местоположение *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className={errors.location ? styles.error : ''}
              maxLength={200}
              placeholder="Укажите местоположение буфера"
            />
            {errors.location && <span className={styles.errorText}>{errors.location}</span>}
          </div>

          <div className={styles.field}>
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={errors.description ? styles.error : ''}
              maxLength={500}
              rows={3}
              placeholder="Описание буфера (необязательно)"
            />
            {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          </div>
        </div>

        <div className={styles.section}>
          <h4>Связанные этапы</h4>
          <p className={styles.sectionDescription}>
            {isEditing 
              ? 'Измените связи этапов производства с этим буфером'
              : 'Выберите этапы производства, которые будут связаны с этим буфером'
            }
          </p>
          
          {stagesChanged && isEditing && (
            <div className={styles.changesNotice}>
              <span className={styles.changesIcon}>⚠️</span>
              <span>У вас есть несохраненные изменения в этапах</span>
            </div>
          )}
          
          <div className={styles.stagesList}>
            {availableStages?.map((stage) => (
              <label key={stage.stageId} className={styles.stageItem}>
                <input
                  type="checkbox"
                  checked={formData.stageIds.includes(stage.stageId)}
                  onChange={() => handleStageToggle(stage.stageId)}
                />
                <div className={styles.stageInfo}>
                  <span className={styles.stageName}>{stage.stageName}</span>
                  {stage.description && (
                    <span className={styles.stageDescription}>{stage.description}</span>
                  )}
                  <span className={styles.stageCount}>
                    Связано с {stage._count.bufferStages} буферами
                  </span>
                </div>
              </label>
            ))}
          </div>

          {(!availableStages || availableStages.length === 0) && (
            <div className={styles.emptyStages}>
              <div className={styles.emptyIcon}>🔄</div>
              <div className={styles.emptyTitle}>Нет доступных этапов</div>
              <div className={styles.emptyDescription}>
                Сначала создайте этапы производства
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {isLoading ? (
              isEditing ? 'Сохранение...' : 'Создание...'
            ) : (
              isEditing ? 'Сохранить изменения' : 'Создать буфер'
            )}
          </button>
        </div>

        {isEditing && stagesChanged && (
          <div className={styles.hint}>
            <span className={styles.hintIcon}>💡</span>
            <span>
              При сохранении будут обновлены как основная информация буфера, так и связи с этапами
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default BufferForm;