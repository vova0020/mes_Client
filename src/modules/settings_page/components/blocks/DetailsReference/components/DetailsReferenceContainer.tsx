import React, { useState, useCallback } from 'react';

import { DetailsSection } from './blocks/DetailsSection';
import { usePackageDirectory } from '../../../../../hooks/packageDirectoryHook/usePackageDirectory';
import styles from './DetailsReferenceContainer.module.css';
import { PackagingSection } from './blocks/PackagingSection';

export const DetailsReferenceContainer: React.FC = () => {
  // Используем хук для работы с упаковками
  const {
    packages,
    loading,
    error,
    selectedPackage,
    createPackage,
    selectPackage,
    clearSelection,
    isCreating
  } = usePackageDirectory();

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
              onSelectPackaging={handleSelectPackaging}
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


   












      {/* Верхняя часть - Упаковки
      <div className={styles['details-reference-container__hierarchy']}>
        <div className={styles['hierarchy__sections']}>
          {/* Секция упаковок */}
          {/* <div className={styles['hierarchy__section']}>
            <PackagingSection
              packaging={packagingData}
              onAddPackaging={handleAddPackaging}
              onSelectPackaging={handleSelectPackaging}
              selectedPackagingId={selectedPackagingId}
            />
          </div>
        </div>
      </div>  */}

      {/* Нижняя часть - Детали */}
      {/* <div className={styles['details-reference-container__details']}>
        <DetailsSection selectedPackagingId={selectedPackagingId} />
      </div> */}

      {/* Информационная панель */}
      {/* <div className={styles['details-reference-container__info']}>
        <div className={styles.breadcrumb}>
          {selectedPackagingItem && (
            <span className={styles['breadcrumb__item']}>
              <span className={styles['breadcrumb__label']}>Упаковка:</span>
              <span className={styles['breadcrumb__value']}>{selectedPackagingItem.name}</span>
            </span>
          )}
        </div> */}

        {/* Статистика */}
        {/* <div className={styles.stats}>
          <div className={styles['stats__item']}>
            <span className={styles['stats__label']}>Упаковок:</span>
            <span className={styles['stats__value']}>{packagingData.length}</span>
          </div>
          {selectedPackagingItem && (
            <div className={styles['stats__item']}>
              <span className={styles['stats__label']}>Деталей:</span>
              <span className={styles['stats__value']}>{selectedPackagingItem.detailsCount}</span>
            </div>
          )}
        </div> */}
       </div>
    </div>
  );
};