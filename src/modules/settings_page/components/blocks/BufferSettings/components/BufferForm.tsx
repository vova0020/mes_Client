import React, { useState, useEffect } from 'react';
import { BufferDetailResponse, CreateBufferDto, CellStatus, CreateBufferCellDto } from '../types/buffers.types';
import { useCreateBuffer, useUpdateBuffer, useAvailableStages } from '../hooks/useBuffersQuery';
import styles from './BufferForm.module.css';

interface BufferFormProps {
  buffer?: BufferDetailResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BufferForm: React.FC<BufferFormProps> = ({
  buffer,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    bufferName: '',
    description: '',
    location: '',
    cells: [] as CreateBufferCellDto[],
    stageIds: [] as number[]
  });

  const [newCell, setNewCell] = useState({
    cellCode: '',
    capacity: 0,
    status: CellStatus.AVAILABLE
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: availableStages } = useAvailableStages();
  const createBufferMutation = useCreateBuffer();
  const updateBufferMutation = useUpdateBuffer();

  const isEditing = !!buffer;

  useEffect(() => {
    if (buffer) {
      setFormData({
        bufferName: buffer.bufferName,
        description: buffer.description || '',
        location: buffer.location,
        cells: buffer.bufferCells.map(cell => ({
          cellCode: cell.cellCode,
          capacity: cell.capacity,
          status: cell.status
        })),
        stageIds: buffer.bufferStages.map(stage => stage.stageId)
      });
    }
  }, [buffer]);

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

    // Проверка уникальности кодов ячеек
    const cellCodes = formData.cells.map(cell => cell.cellCode);
    const duplicateCodes = cellCodes.filter((code, index) => cellCodes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      newErrors.cells = `Коды ячеек должны быть уникальными: ${duplicateCodes.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing) {
        await updateBufferMutation.mutateAsync({
          id: buffer.bufferId,
          data: {
            bufferName: formData.bufferName,
            description: formData.description || undefined,
            location: formData.location
          }
        });
      } else {
        await createBufferMutation.mutateAsync({
          bufferName: formData.bufferName,
          description: formData.description || undefined,
          location: formData.location,
          cells: formData.cells.length > 0 ? formData.cells : undefined,
          stageIds: formData.stageIds.length > 0 ? formData.stageIds : undefined
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Ошибка при сохранении буфера:', error);
      alert('Ошибка при сохранении буфера');
    }
  };

  const handleAddCell = () => {
    if (!newCell.cellCode.trim()) {
      alert('Введите код ячейки');
      return;
    }

    if (newCell.capacity < 0) {
      alert('Вместимость не может быть отрицательной');
      return;
    }

   

    if (formData.cells.some(cell => cell.cellCode === newCell.cellCode)) {
      alert('Ячейка с таким кодом уже существует');
      return;
    }

    setFormData(prev => ({
      ...prev,
      cells: [...prev.cells, { ...newCell }]
    }));

    setNewCell({
      cellCode: '',
      capacity: 0,

      status: CellStatus.AVAILABLE
    });
  };

  const handleRemoveCell = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cells: prev.cells.filter((_, i) => i !== index)
    }));
  };

  const handleStageToggle = (stageId: number) => {
    setFormData(prev => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter(id => id !== stageId)
        : [...prev.stageIds, stageId]
    }));
  };

  const isLoading = createBufferMutation.isPending || updateBufferMutation.isPending;

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
            />
            {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          </div>
        </div>

        {!isEditing && (
          <>
            {/* <div className={styles.section}>
              <h4>Ячейки буфера</h4>
              
              <div className={styles.cellForm}>
                <div className={styles.cellFormRow}>
                  <input
                    type="text"
                    placeholder="Код ячейки"
                    value={newCell.cellCode}
                    onChange={(e) => setNewCell(prev => ({ ...prev, cellCode: e.target.value }))}
                    maxLength={20}
                  />
                  <input
                    type="number"
                    placeholder="Вместимость"
                    value={newCell.capacity}
                    onChange={(e) => setNewCell(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    min="0"
                  />
                  <select
                    value={newCell.status}
                    onChange={(e) => setNewCell(prev => ({ ...prev, status: e.target.value as CellStatus }))}
                  >
                    <option value={CellStatus.AVAILABLE}>Доступна</option>
                    <option value={CellStatus.OCCUPIED}>Занята</option>
                    <option value={CellStatus.RESERVED}>Зарезервирована</option>
                  </select>
                  <button type="button" onClick={handleAddCell} className={styles.addButton}>
                    Добавить
                  </button>
                </div>
              </div>

              {errors.cells && <span className={styles.errorText}>{errors.cells}</span>}

              <div className={styles.cellsList}>
                {formData.cells.map((cell, index) => (
                  <div key={index} className={styles.cellItem}>
                    <span>{cell.cellCode}</span>
                    <span>Вместимость: {cell.capacity}</span>
                    <span>Загрузка: {cell.currentLoad}</span>
                    <span>Статус: {
                      cell.status === CellStatus.AVAILABLE ? 'Доступна' :
                      cell.status === CellStatus.OCCUPIED ? 'Занята' : 'Зарезервирована'
                    }</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCell(index)}
                      className={styles.removeButton}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div> */}

            <div className={styles.section}>
              <h4>Связанные этапы</h4>
              
              <div className={styles.stagesList}>
                {availableStages?.map((stage) => (
                  <label key={stage.stageId} className={styles.stageItem}>
                    <input
                      type="checkbox"
                      checked={formData.stageIds.includes(stage.stageId)}
                      onChange={() => handleStageToggle(stage.stageId)}
                    />
                    <span>{stage.stageName}</span>
                    {stage.description && (
                      <span className={styles.stageDescription}>{stage.description}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className={styles.buttons}>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={styles.cancelButton}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default BufferForm;