// ================================================
// src/modules/settings_page/components/blocks/StreamsSettings/components/StreamForm.tsx
// ================================================
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { streamsApi } from '../api/streamsApi';
import { ProductionLine, CreateStreamData, UpdateStreamData } from '../types/streams.types';
import { Material, MaterialGroup } from '../types/materials.types';
import { useStream, useCreateStream, useUpdateStream, useStagesLevel1 } from '../hooks/useStreamsQuery';
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
  const [stageSearchTerm, setStageSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const isEditing = Boolean(editId);

  // Получение данных для редактирования с WebSocket интеграцией
  const { data: editStream } = useStream(editId);

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

  // Получение списка этапов производства с WebSocket интеграцией
  const { data: productionStages = [] } = useStagesLevel1();

  // Мутации для создания и обновления потока с WebSocket интеграцией
  const createMutation = useCreateStream();
  const updateMutation = useUpdateStream();

  // Обработчики успешного сохранения
  const handleCreateSuccess = () => {
    console.log('✅ Поток создан успешно');
    onSaved();
  };

  const handleUpdateSuccess = () => {
    console.log('✅ Поток обновлен успешно');
    onSaved();
  };

  const handleError = (error: Error) => {
    console.error('❌ Ошибка:', error);
  };

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

  // Улучшенная фильтрация материалов
  const filteredMaterials = materials.filter(material => {
    // Если нет поискового запроса, не фильтруем по поиску
    if (!materialSearchTerm.trim()) {
      const matchesGroup = selectedGroupFilter === null || 
                          material.groups?.some(g => g.groupId === selectedGroupFilter) ||
                          material.groupsMaterials?.some(gm => gm.groupId === selectedGroupFilter);
      return matchesGroup;
    }

    // Нормализуем поисковый запрос
    const searchTerm = materialSearchTerm.trim().toLowerCase();
    
    // Проверяем точное совпадение в начале строки (приоритет)
    const nameStartsWith = material.materialName.toLowerCase().startsWith(searchTerm);
    const articleStartsWith = material.article.toLowerCase().startsWith(searchTerm);
    
    // Проверяем вхождение в любом месте строки
    const nameIncludes = material.materialName.toLowerCase().includes(searchTerm);
    const articleIncludes = material.article.toLowerCase().includes(searchTerm);
    
    // Проверяем совпадение по словам (разделенным пробелами)
    const nameWords = material.materialName.toLowerCase().split(/\s+/);
    const articleWords = material.article.toLowerCase().split(/\s+/);
    const searchWords = searchTerm.split(/\s+/);
    
    const nameWordsMatch = searchWords.every(word => 
      nameWords.some(nameWord => nameWord.includes(word))
    );
    const articleWordsMatch = searchWords.every(word => 
      articleWords.some(articleWord => articleWord.includes(word))
    );

    // Материал подходит, если есть любое из совпадений
    const matchesSearch = nameStartsWith || articleStartsWith || nameIncludes || articleIncludes || nameWordsMatch || articleWordsMatch;
    
    // Проверяем фильтр по группе
    const matchesGroup = selectedGroupFilter === null || 
                        material.groups?.some(g => g.groupId === selectedGroupFilter) ||
                        material.groupsMaterials?.some(gm => gm.groupId === selectedGroupFilter);
    
    return matchesSearch && matchesGroup;
  });

  // Фильтрация этапов производства
  const filteredStages = productionStages.filter(stage => {
    // Если нет поискового запроса, показываем все этапы
    if (!stageSearchTerm.trim()) {
      return true;
    }

    // Нормализуем поисковый запрос
    const searchTerm = stageSearchTerm.trim().toLowerCase();
    
    // Проверяем точное совпадение в начале строки (приоритет)
    const nameStartsWith = stage.stageName.toLowerCase().startsWith(searchTerm);
    const descriptionStartsWith = stage.description?.toLowerCase().startsWith(searchTerm);
    
    // Проверяем вхождение в любом месте строки
    const nameIncludes = stage.stageName.toLowerCase().includes(searchTerm);
    const descriptionIncludes = stage.description?.toLowerCase().includes(searchTerm);
    
    // Проверяем совпадение по словам (разделенным пробелами)
    const nameWords = stage.stageName.toLowerCase().split(/\s+/);
    const descriptionWords = stage.description?.toLowerCase().split(/\s+/) || [];
    const searchWords = searchTerm.split(/\s+/);
    
    const nameWordsMatch = searchWords.every(word => 
      nameWords.some(nameWord => nameWord.includes(word))
    );
    const descriptionWordsMatch = descriptionWords.length > 0 && searchWords.every(word => 
      descriptionWords.some(descWord => descWord.includes(word))
    );

    // Этап подходит, если есть любое из совпадений
    return nameStartsWith || descriptionStartsWith || nameIncludes || descriptionIncludes || nameWordsMatch || descriptionWordsMatch;
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

  const handleSelectAllMaterials = () => {
    const filteredMaterialIds = filteredMaterials.map(material => material.materialId);
    const allSelected = filteredMaterialIds.every(id => selectedMaterials.includes(id));
    
    if (allSelected) {
      // Убираем все отфильтрованные материалы из выбранных
      setSelectedMaterials(prev => prev.filter(id => !filteredMaterialIds.includes(id)));
    } else {
      // Добавляем все отфильтрова��ные материалы к выбранным
      setSelectedMaterials(prev => {
        const newIds = filteredMaterialIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
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
      updateMutation.mutate({ id: editId, data: streamData }, {
        onSuccess: handleUpdateSuccess,
        onError: handleError
      });
    } else {
      createMutation.mutate(streamData as CreateStreamData, {
        onSuccess: handleCreateSuccess,
        onError: handleError
      });
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

            <button
              type="button"
              onClick={handleSelectAllMaterials}
              className={styles.selectAllButton}
              disabled={filteredMaterials.length === 0}
            >
              {filteredMaterials.length > 0 && filteredMaterials.every(material => selectedMaterials.includes(material.materialId))
                ? 'Снять все'
                : 'Выбрать все'
              }
            </button>
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
          
          {/* Поиск этапов */}
          <div className={styles.stagesFilters}>
            <div className={styles.searchGroup}>
              <input
                type="text"
                placeholder="Поиск этапов..."
                value={stageSearchTerm}
                onChange={(e) => setStageSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
          
          <div className={styles.stagesContainer}>
            {filteredStages.length === 0 ? (
              <div className={styles.emptyStages}>
                <p>{stageSearchTerm.trim() ? 'Этапы не найдены' : 'Этапы производства не найдены'}</p>
              </div>
            ) : (
              <div className={styles.stagesList}>
                {filteredStages.map(stage => (
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