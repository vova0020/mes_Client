import React, { useState } from 'react';
import { PlusIcon, DocumentIcon, MapIcon } from '@heroicons/react/24/outline';
import styles from './PackagingSection.module.css';
interface Packaging {
  id: string;
  productId: string;
  article: string;
  name: string;
  detailsCount: number;
}

interface PackagingSectionProps {
  packaging: Packaging[];
  selectedProductId: string | null;
  onAddPackaging: (productId: string, article: string, name: string) => void;
}

export const PackagingSection: React.FC<PackagingSectionProps> = ({
  packaging,
  selectedProductId,
  onAddPackaging
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPackagingData, setNewPackagingData] = useState({
    article: '',
    name: ''
  });

  const handleAddPackaging = () => {
    if (newPackagingData.article.trim() && newPackagingData.name.trim() && selectedProductId) {
      onAddPackaging(
        selectedProductId,
        newPackagingData.article.trim(),
        newPackagingData.name.trim()
      );
      setNewPackagingData({ article: '', name: '' });
      setIsAddingNew(false);
    }
  };

  const handleCancel = () => {
    setNewPackagingData({ article: '', name: '' });
    setIsAddingNew(false);
  };

  const handleGeneralLayoutSchema = (packagingId: string) => {
    console.log('Открыть общую схему укладки для упаковки:', packagingId);
    // Здесь будет логика открытия общей схемы укладки
  };

  const handlePostLayoutSchema = (packagingId: string) => {
    console.log('Открыть схему укладки по постам для упаковки:', packagingId);
    // Здесь будет логика открытия схемы укладки по постам
  };

  const canAddPackaging = selectedProductId !== null;

  return (
    <div className={styles["packaging-section"]}>
      <div className={styles["section-header"]}>
        <h3>Упаковка</h3>
      </div>

      <div className={styles["section-content"]}>
        {!selectedProductId && (
          <div className={styles["empty-state"]}>
            <p>Выберите изделие</p>
            <p className={styles["empty-state__hint"]}>Для просмотра упаковок выберите изделие</p>
          </div>
        )}

        {selectedProductId && (
          <>
            {/* Список упаковок */}
            <div className={styles["packaging-list"]}>
              {packaging.map((pack) => (
                <div key={pack.id} className={styles["packaging-item"]}>
                  <div className={styles["packaging-item__info"]}>
                    <div className={styles["packaging-item__main"]}>
                      <span className={styles["packaging-item__article"]}>
                        Артикул: {pack.article}
                      </span>
                      <span className={styles["packaging-item__name"]}>{pack.name}</span>
                    </div>
                    <div className={styles["packaging-item__details"]}>
                      <span className={styles["packaging-item__count"]}>
                        Внесено деталей: {pack.detailsCount}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles["packaging-item__actions"]}>
                    <button
                      className={styles["btn btn--secondary btn--small"]}
                      onClick={() => handleGeneralLayoutSchema(pack.id)}
                      title="Схема укладки общая"
                    >
                      <DocumentIcon className={styles["icon"]} />
                      Схема укладки общая
                    </button>
                    <button
                      className={styles["btn btn--secondary btn--small"]}
                      onClick={() => handlePostLayoutSchema(pack.id)}
                      title="Схема укладки по постам"
                    >
                      <MapIcon className={styles["icon"]} />
                      Схема укладки по постам
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Форма добавления новой упаковки */}
            {isAddingNew && (
              <div className={styles["add-form add-form--packaging"]}>
                <div className={styles["add-form__fields"]}>
                  <input
                    type="text"
                    placeholder="Артикул упаковки"
                    value={newPackagingData.article}
                    onChange={(e) => setNewPackagingData(prev => ({ ...prev, article: e.target.value }))}
                    className="form-input"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Название упаковки"
                    value={newPackagingData.name}
                    onChange={(e) => setNewPackagingData(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className={styles["add-form__actions"]}>
                  <button
                    className={styles["btn btn--primary btn--small"]}
                    onClick={handleAddPackaging}
                  >
                    Сохранить
                  </button>
                  <button
                    className={styles["btn btn--secondary btn--small"]}
                    onClick={handleCancel}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Кнопка добавления новой упаковки */}
            <div className={styles["section-footer"]}>
              <button
                className={styles["btn btn--primary"]}
                onClick={() => setIsAddingNew(true)}
                disabled={isAddingNew || !canAddPackaging}
              >
                <PlusIcon className={styles["icon"]} />
                Добавить запись
              </button>
            </div>

            {packaging.length === 0 && !isAddingNew && (
              <div className={styles["empty-state"]}>
                <p>Нет упаковок для выбранного изделия</p>
                <p className={styles["empty-state__hint"]}>Добавьте первую упаковку</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};