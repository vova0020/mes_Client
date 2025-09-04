// ================================================
// src/modules/materials/components/MaterialForm.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import {
  useMaterialGroups,
  useMaterial,
  useCreateMaterial,
  useUpdateMaterial,
} from '../api';

import { CreateMaterialDto, UpdateMaterialDto } from '../types';
import styles from './MaterialForm.module.css';

interface MaterialFormProps {
  editId?: number;
  onSaved?: () => void;
  onCancel?: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({ 
  editId, 
  onSaved, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    article: '',
    unit: '',
    selectedGroups: [] as number[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editId;

  // React Query хуки
  const { data: groups = [], isLoading: groupsLoading } = useMaterialGroups();
  const { data: material, isLoading: materialLoading } = useMaterial(editId || 0);
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();



  const loading = createMutation.isPending || updateMutation.isPending;

  // Заполняем форму при редактировании
  useEffect(() => {
    if (material && editId) {
      setFormData({
        name: material.materialName,
        article: material.article,
        unit: material.unit,
        selectedGroups: material.groups?.map(g => g.groupId) || []
      });
    }
  }, [material, editId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название материала обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    }

    if (!formData.article.trim()) {
      newErrors.article = 'Артикул материала обязательно';
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Единица измерения обязательна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setErrors({});

    try {
      const dto = {
        materialName: formData.name.trim(),
        article: formData.article.trim(),
        unit: formData.unit.trim(),
        groupIds: formData.selectedGroups
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: editId!, dto: dto as UpdateMaterialDto });
        console.log('Материал успешно обновлен');
      } else {
        await createMutation.mutateAsync(dto as CreateMaterialDto);
        console.log('Материал успешно создан');
      }

      // Вызываем callback успеха если он передан
      onSaved?.();
      
      // Закрываем форму
      onCancel?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка при сохранении материала';
      setErrors({ general: errorMessage });
      console.error('Ошибка пр�� сохранении материала:', err);
    }
  };

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      article: '',
      unit: '',
      selectedGroups: []
    });
    setErrors({});
    onCancel?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Показываем индикатор загрузки при получении данных материала
  if (isEditing && materialLoading) {
    return (
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            <span className={styles.formIcon}>✏️</span>
            Загрузка материала...
            {/* Socket.IO индикатор */}
            
          </h2>
        </div>
        <div className={styles.formContent}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Загружаем данные материала...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          <span className={styles.formIcon}>
            {isEditing ? '✏️' : '➕'}
          </span>
          {isEditing ? 'Редактировать материал' : 'Создать новый материал'}
          {/* Socket.IO индикатор */}
          
        </h2>
        <button
          onClick={handleClose}
          className={styles.closeButton}
          type="button"
          title="Закрыть"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.formContent}>
        {/* Connection Warning */}
        

        {/* General Error */}
        {(errors.general || createMutation.error || updateMutation.error) && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {errors.general || 
             createMutation.error?.message || 
             updateMutation.error?.message || 
             'Произошла ошибка'}
          </div>
        )}

     
        {/* Артикул материала */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Артикул материала *
          </label>
          <input
            type="text"
            value={formData.article}
            onChange={(e) => handleInputChange('article', e.target.value)}
            onKeyPress={handleKeyPress}
            className={`${styles.formInput} ${errors.article ? styles.inputError : ''}`}
            placeholder="Например: А-123"
            disabled={loading}
            autoFocus
          />
          {errors.article && (
            <div className={styles.fieldError}>
              {errors.article}
            </div>
          )}
        </div>

        {/* Material Name */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Название материала *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onKeyPress={handleKeyPress}
            className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`}
            placeholder="Например: Сталь листовая"
            disabled={loading}
          />
          {errors.name && (
            <div className={styles.fieldError}>
              {errors.name}
            </div>
          )}
        </div>

        {/* Unit */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Единица измерения *
          </label>
          <select
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            className={`${styles.formInput} ${errors.unit ? styles.inputError : ''}`}
            disabled={loading}
          >
            <option value="">Выберите единицу измерения</option>
            <option value="м">м</option>
            <option value="м²">м²</option>
            <option value="м³">м³</option>
            <option value="шт">шт</option>
            <option value="кг">кг</option>
          </select>
          {errors.unit && (
            <div className={styles.fieldError}>
              {errors.unit}
            </div>
          )}
        </div>

        {/* Groups Selection */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Группы материалов
            <span className={styles.optional}>(необязательно)</span>
           
          </label>
          
          {groupsLoading ? (
            <div className={styles.groupsLoading}>
              <div className={styles.spinner}></div>
              <span>Загрузка групп...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className={styles.noGroups}>
              <span className={styles.noGroupsIcon}>📁</span>
              <p>Нет доступных групп</p>
              <p className={styles.noGroupsSubtext}>
                Сначала создайте группы материалов
              </p>
            </div>
          ) : (
            <div className={styles.groupsSelector}>
              <div className={styles.groupsGrid}>
                {groups.map((group) => (
                  <div
                    key={group.groupId}
                    className={`${styles.groupOption} ${
                      formData.selectedGroups.includes(group.groupId) 
                        ? styles.groupOptionSelected 
                        : ''
                    }`}
                    onClick={() => handleGroupToggle(group.groupId)}
                  >
                    <div className={styles.groupOptionContent}>
                      <div className={styles.groupOptionIcon}>
                        {formData.selectedGroups.includes(group.groupId) ? '✅' : '📁'}
                      </div>
                      <div className={styles.groupOptionInfo}>
                        <div className={styles.groupOptionName}>
                          {group.groupName}
                        </div>
                        <div className={styles.groupOptionCount}>
                          {group.materialsCount || 0} материалов
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {formData.selectedGroups.length > 0 && (
                <div className={styles.selectedGroupsSummary}>
                  <span className={styles.selectedGroupsLabel}>
                    Выбрано групп: {formData.selectedGroups.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selectedGroups: [] }))}
                    className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonMini}`}
                  >
                    Очистить выбор
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={loading || !formData.name.trim() || !formData.article.trim() || !formData.unit.trim()}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
          >
            {loading ? (
              <>
                <span className={styles.buttonSpinner}></span>
                {isEditing ? 'Обновляем...' : 'Создаем...'}
              </>
            ) : (
              <>
                <span className={styles.buttonIcon}>
                  {isEditing ? '💾' : '➕'}
                </span>
                {isEditing ? 'Обновить материал' : 'Создать материал'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonLarge}`}
          >
            Отмена
          </button>
        </div>

        {/* Help Text */}
        <div className={styles.formHelp}>
          <div className={styles.helpText}>
            <span className={styles.helpIcon}>💡</span>
            {isEditing 
              ? 'Измените данные материала и нажмите "Обновить материал"' 
              : 'Заполните обязательные поля и нажмите "Создать материал" или Ctrl+Enter'
            }
          </div>
          <div className={styles.helpText}>
            <span className={styles.helpIcon}>⚡</span>
            Используйте Escape для быстрого закрытия формы
          </div>
          
        </div>
      </form>
    </div>
  );
};