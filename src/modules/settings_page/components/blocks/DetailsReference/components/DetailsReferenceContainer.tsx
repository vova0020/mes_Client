import React, { useState, useCallback } from 'react';

import { DetailsSection } from './blocks/DetailsSection';
import { usePackageDirectory } from '../../../../../hooks/packageDirectoryHook/usePackageDirectory';
import styles from './DetailsReferenceContainer.module.css';
import { PackagingSection } from './blocks/PackagingSection';
import { EditPackageModal } from './EditPackageModal';

export const DetailsReferenceContainer: React.FC = () => {
  // Используем хук для работы с упаковками
  const {
    packages,
    createPackage,
    deletePackage,
    updatePackage,
    selectPackage,
    clearSelection
  } = usePackageDirectory();

  // Состояние для модального окна редактирования
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<{ id: string; code: string; name: string } | null>(null);

  // Состояние для выбранной упаковки (используем строковый ID для совместимости с существующим интерфейсом)
  const [selectedPackagingId, setSelectedPackagingId] = useState<string | null>(null);

  // Обработчик для добавления упаковки
  const handleAddPackaging = useCallback(async (packageCode: string, packageName: string) => {
    try {
      await createPackage({ packageCode, packageName });
    } catch (error) {
      console.error('Ошибка при добавлении упаковки:', error);
      throw error; // Пробрасываем ошибку для обработки в компоненте
    }
  }, [createPackage]);

  // Обработчик для выбора упаковки
  const handleSelectPackaging = useCallback((packagingId: string) => {
    setSelectedPackagingId(packagingId);
    const numericId = parseInt(packagingId, 10);
    if (!isNaN(numericId)) {
      selectPackage(numericId);
    }
  }, [selectPackage]);

  // Обработчик для удаления упаковки
  const handleDeletePackaging = useCallback(async (packagingId: string) => {
    try {
      const numericId = parseInt(packagingId, 10);
      if (!isNaN(numericId)) {
        await deletePackage(numericId);
        // Если удалена текущая выбранная упаковка, очищаем выбор
        if (selectedPackagingId === packagingId) {
          setSelectedPackagingId(null);
          clearSelection();
        }
      }
    } catch (error) {
      console.error('Ошибка при удалении упаковки:', error);
      throw error;
    }
  }, [deletePackage, clearSelection, selectedPackagingId]);

  // Обработчик для открытия окна редактирования
  const handleEditPackaging = useCallback(async (packagingId: string, packageCode: string, packageName: string) => {
    setEditingPackage({ id: packagingId, code: packageCode, name: packageName });
    setIsEditModalOpen(true);
  }, []);

  // Обработчик для сохранения изменений
  const handleSaveEdit = useCallback(async (packageCode: string, packageName: string) => {
    if (!editingPackage) return;
    
    try {
      const numericId = parseInt(editingPackage.id, 10);
      if (!isNaN(numericId)) {
        await updatePackage(numericId, { packageCode, packageName });
      }
    } catch (error) {
      console.error('Ошибка при редактировании упаковки:', error);
      throw error;
    } finally {
      setIsEditModalOpen(false);
      setEditingPackage(null);
    }
  }, [updatePackage, editingPackage]);

  // Преобразуем данные из API в формат, ожидаемый компонентом PackagingSection
  const packagingData = packages.map(pkg => ({
    id: pkg.packageId.toString(),
    article: pkg.packageCode,
    name: pkg.packageName,
    detailsCount: pkg.detailsCount // Пока что статическое значение, так как в API нет этого поля
  }));

  // Получение информации о выбранной упаковке
  const selectedPackagingItem = packagingData.find(p => p.id === selectedPackagingId);

  return (
    <div className={styles['details-reference-container']}>
        <div className={styles['packaging-details-container']} >
          <div className={styles['packaging-container']}>
            <PackagingSection
              packaging={packagingData}
              onAddPackaging={handleAddPackaging}
              onEditPackaging={handleEditPackaging}
              onSelectPackaging={handleSelectPackaging}
              onDeletePackaging={handleDeletePackaging}
              selectedPackagingId={selectedPackagingId}
            />
          </div>
          <div className={styles['details-container']}>
             <DetailsSection selectedPackagingId={selectedPackagingId} />
          </div>
        </div>
          {/* Информационная панель */}
      <div className={styles['details-reference-container__info']}>
        <div className={styles.breadcrumb}>
          {selectedPackagingItem && (
            <span className={styles['breadcrumb__item']}>
              <span className={styles['breadcrumb__label']}>Упаковка:</span>
              <span className={styles['breadcrumb__value']}>{selectedPackagingItem.name}</span>
            </span>
          )}
        </div>
       </div>
       
       {/* Модальное окно редактирования */}
       <EditPackageModal
         isOpen={isEditModalOpen}
         onClose={() => {
           setIsEditModalOpen(false);
           setEditingPackage(null);
         }}
         onSave={handleSaveEdit}
         initialData={editingPackage ? {
           code: editingPackage.code,
           name: editingPackage.name
         } : undefined}
       />
    </div>
  );
};