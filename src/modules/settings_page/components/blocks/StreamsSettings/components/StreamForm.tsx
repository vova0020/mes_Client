// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/StreamForm.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi } from '../api/streamsApi';
import { ProductionLine, CreateStreamData, UpdateStreamData } from '../types/streams.types';
import { Material, MaterialGroup } from '../types/materials.types';
import styles from './StreamForm.module.css';

interface StreamFormProps {
  editId?: number;
  onSaved: () => void;
  onCancel: () => void;
}

export const StreamForm: React.FC<StreamFormProps> = ({ editId, onSaved, onCancel }) => {
  const [formData, setFormData] = useState({
    lineName: '',
    lineType: '',
  });
  
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [selectedStages, setSelectedStages] = useState<number[]>([]);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const isEditing = Boolean(editId);

  // Получение данных для редактирования
  const { data: editStream } = useQuery({
    queryKey: ['stream', editId],
    queryFn: () => streamsApi.getStream(editId!),
    enabled: isEditing,
    staleTime: 1000 * 60 * 2, // 2 минуты
  });

  // Получение списка материалов с автообновлением
  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => streamsApi.getMaterials(),
    staleTime: 1000 * 60 * 2, // 2 минуты
  });

  // Получение групп материалов с автообновлением
  const { data: materialGroups = [] } = useQuery({
    queryKey: ['material-groups'],
    queryFn: () => streamsApi.getMaterialGroups(),
    staleTime: 1000 * 60 * 2, // 2 минуты
  });

  // Получение списка этапов производства с автообновлением
  const { data: productionStages = [] } = useQuery({
    queryKey: ['production-stages-level1'],
    queryFn: () => streamsApi.getProductionStagesLevel1(),
    staleTime: 1000 * 60 * 2, // 2 минуты
  });

  // Мутация для создания потока
  const createMutation = useMutation({
    mutationFn: (data: CreateStreamData) => streamsApi.createStream(data),
    onSuccess: (newStream) => {
      console.log('✅ Поток создан успешно:', newStream);
      
      // Инвалидируем основные кеши
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      
      // Инвалидируем кеши материалов и этапов для нового потока
      queryClient.invalidateQueries({ queryKey: ['stream-materials', newStream.lineId] });
      queryClient.invalidateQueries({ queryKey: ['stream-stages', newStream.lineId] });
      
      // Обновляем кеш конкретного потока
      queryClient.setQueryData(['stream', newStream.lineId], newStream);
      
      onSaved();
    },
    onError: (error) => {
      console.error('❌ Ошибка создания потока:', error);
    },
  });

  // Мутация для обновления потока
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStreamData }) =>
      streamsApi.updateStream(id, data),
    onSuccess: (updatedStream) => {
      console.log('✅ Поток обновлен успешно:', updatedStream);
      
      // Инвалидируем основные кеши
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['stream', editId] });
      
      // Обязательно инвалидируем кеши материалов и этапов для обновленного потока
      queryClient.invalidateQueries({ queryKey: ['stream-materials', editId] });
      queryClient.invalidateQueries({ queryKey: ['stream-stages', editId] });
      
      // Обновляем кеш конкретного потока
      queryClient.setQueryData(['stream', editId], updatedStream);
      
      onSaved();
    },
    onError: (error) => {
      console.error('❌ Ошибка обновления потока:', error);
    },
  });

  // Заполнение формы при редактировании
  useEffect(() => {
    if (editStream) {
      setFormData({
        lineName: editStream.lineName,
        lineType: editStream.lineType,
      });
      
      // Получаем ID материалов из связей
      const materialIds = editStream.materials?.map(m => m.materialId) || [];
      setSelectedMaterials(materialIds);
      
      // Получаем ID этапов из связей
      const stageIds = editStream.stages?.map(s => s.stageId) || [];
      setSelectedStages(stageIds);
    }
  }, [editStream]);

  // Фильтрация материалов
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.materialName.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
                         material.article.toLowerCase().includes(materialSearchTerm.toLowerCase());
    
    const matchesGroup = selectedGroupFilter === null || 
                        material.groups?.some(g => g.groupId === selectedGroupFilter) ||
                        material.groupsMaterials?.some(gm => gm.groupId === selectedGroupFilter);
    
    return matchesSearch && matchesGroup;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialToggle = (materialId: number) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleStageToggle = (stageId: number) => {
    setSelectedStages(prev => 
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const streamData: CreateStreamData | UpdateStreamData = {
      ...formData,
      materialIds: selectedMaterials,
      stageIds: selectedStages,
    };

    if (isEditing && editId !== undefined) {
      updateMutation.mutate({ id: editId, data: streamData });
    } else {
      createMutation.mutate(streamData as CreateStreamData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.streamFormContainer}> 
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {isEditing ? 'Редактировать поток' : 'Создать новый поток'}
        </h2>
        <button
          onClick={onCancel}
          className={styles.closeButton}
          type="button"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Основная информация */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Основная информация</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="lineName" className={styles.label}>
              Название потока *
            </label>
            <input
              type="text"
              id="lineName"
              name="lineName"
              value={formData.lineName}
              onChange={handleInputChange}
              className={styles.input}
              required
              placeholder="Введите название потока"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lineType" className={styles.label}>
              Тип потока *
            </label>
            <input
              type="text"
              id="lineType"
              name="lineType"
              value={formData.lineType}
              onChange={handleInputChange}
              className={styles.input}
              required
              placeholder="Введите тип потока"
            />
          </div>
        </div>

        {/* Выбор материалов */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>
            Материалы ({selectedMaterials.length} выбрано)
          </h3>
          
          {/* Фильтры для материалов */}
          <div className={styles.materialsFilters}>
            <div className={styles.searchGroup}>
              <input
                type="text"
                placeholder="Поиск материалов..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.groupFilter}>
              <select
                value={selectedGroupFilter || ''}
                onChange={(e) => setSelectedGroupFilter(e.target.value ? Number(e.target.value) : null)}
                className={styles.select}
              >
                <option value="">Все группы</option>
                {materialGroups.map(group => (
                  <option key={group.groupId} value={group.groupId}>
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Список материалов */}
          <div className={styles.materialsContainer}>
            {filteredMaterials.length === 0 ? (
              <div className={styles.emptyMaterials}>
                <p>Материалы не найдены</p>
              </div>
            ) : (
              <div className={styles.materialsList}>
                {filteredMaterials.map(material => (
                  <div
                    key={material.materialId}
                    className={`${styles.materialItem} ${
                      selectedMaterials.includes(material.materialId) 
                        ? styles.materialSelected 
                        : ''
                    }`}
                    onClick={() => handleMaterialToggle(material.materialId)}
                  >
                    <div className={styles.materialInfo}>
                      <div className={styles.materialName}>{material.materialName}</div>
                      <div className={styles.materialDetails}>
                        <span className={styles.materialArticle}>Артикул: {material.article}</span>
                        <span className={styles.materialUnit}>Ед. изм.: {material.unit}</span>
                      </div>
                    </div>
                    <div className={styles.materialCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material.materialId)}
                        onChange={() => handleMaterialToggle(material.materialId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Выбор этапов производства */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>
            Этапы производства ({selectedStages.length} выбрано)
          </h3>
          
          <div className={styles.stagesContainer}>
            {productionStages.length === 0 ? (
              <div className={styles.emptyStages}>
                <p>Этапы производства не найдены</p>
              </div>
            ) : (
              <div className={styles.stagesList}>
                {productionStages.map(stage => (
                  <div
                    key={stage.stageId}
                    className={`${styles.stageItem} ${
                      selectedStages.includes(stage.stageId) 
                        ? styles.stageSelected 
                        : ''
                    }`}
                    onClick={() => handleStageToggle(stage.stageId)}
                  >
                    <div className={styles.stageInfo}>
                      <div className={styles.stageName}>{stage.stageName}</div>
                      {stage.description && (
                        <div className={styles.stageDescription}>{stage.description}</div>
                      )}
                      <div className={styles.stageDetails}>
                        <span className={styles.stageSubstages}>
                          Подэтапов: {stage.substagesCount || 0}
                        </span>
                      </div>
                    </div>
                    <div className={styles.stageCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedStages.includes(stage.stageId)}
                        onChange={() => handleStageToggle(stage.stageId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
              isEditing ? 'Сохранить изменения' : 'Создать поток'
            )}
          </button>
        </div>
      </form>

      {/* Отображение ошибок */}
      {(createMutation.error || updateMutation.error) && (
        <div className={styles.errorMessage}>
          <p>Ошибка: {createMutation.error?.message || updateMutation.error?.message}</p>
        </div>
      )}
    </div>
  );
};