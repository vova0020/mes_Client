import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  CubeIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import styles from './DetailsSection.module.css';

interface Detail {
  id: string;
  name: string;
  code: string;
  material: string;
  weight: number;
  dimensions: string;
  quantity: number;
  position: string;
}

interface DetailsSectionProps {
  selectedPackagingId?: string | null;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({ 
  selectedPackagingId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Пример данных деталей (в будущем будет приходить из API)
  const mockDetails: Detail[] = selectedPackagingId ? [
    {
      id: 'detail_1',
      name: 'Корпус основной',
      code: 'KRP-001',
      material: 'Алюминий',
      weight: 2.5,
      dimensions: '150x100x50',
      quantity: 1,
      position: 'A1'
    },
    {
      id: 'detail_2',
      name: 'Крышка верхняя',
      code: 'KRV-002',
      material: 'Пластик ABS',
      weight: 0.8,
      dimensions: '155x105x5',
      quantity: 1,
      position: 'A2'
    },
    {
      id: 'detail_3',
      name: 'Винт крепежный',
      code: 'VNT-003',
      material: 'Сталь',
      weight: 0.05,
      dimensions: 'M6x20',
      quantity: 4,
      position: 'B1-B4'
    }
  ] : [];

  const filteredDetails = mockDetails.filter(detail => {
    const matchesSearch = detail.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         detail.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'metal' && detail.material.toLowerCase().includes('алюминий')) ||
                         (filterType === 'plastic' && detail.material.toLowerCase().includes('пластик')) ||
                         (filterType === 'steel' && detail.material.toLowerCase().includes('сталь'));
    return matchesSearch && matchesFilter;
  });

  const handleAddDetail = () => {
    setIsAddingNew(true);
    // Логика добавления новой детали
  };

  return (
    <div className={styles['details-section']}>
      <div className={styles['section-header']}>
        <h3>
          <CubeIcon className={styles.icon} />
          Детали
        </h3>
        {selectedPackagingId && (
          <button
            className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--small']}`}
            onClick={handleAddDetail}
            disabled={isAddingNew}
          >
            <PlusIcon className={styles.icon} />
            Добавить деталь
          </button>
        )}
      </div>
      
      <div className={styles['section-content']}>
        {!selectedPackagingId ? (
          <div className={styles.placeholder}>
            <ClipboardDocumentListIcon className={styles.icon} style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Выберите упаковку для просмотра деталей</p>
            <p className={styles['placeholder__hint']}>
              Здесь будет отображаться список деталей для выбранной упаковки с возможностью редактирования и управления позициями
            </p>
          </div>
        ) : (
          <>
            {/* Панель поиска и фильтров */}
            <div className={styles['details-toolbar']}>
              <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <MagnifyingGlassIcon 
                    className={styles.icon} 
                    style={{ 
                      position: 'absolute', 
                      left: '0.75rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#9ca3af' 
                    }} 
                  />
                  <input
                    type="text"
                    placeholder="Поиск по названию или коду..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles['search-input']}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={styles['filter-select']}
                >
                  <option value="all">Все материалы</option>
                  <option value="metal">Металл</option>
                  <option value="plastic">Пластик</option>
                  <option value="steel">Сталь</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                <FunnelIcon className={styles.icon} />
                Найдено: {filteredDetails.length}
              </div>
            </div>

            {/* Список деталей */}
            {filteredDetails.length > 0 ? (
              <div className={styles['details-list']}>
                {filteredDetails.map((detail) => (
                  <div key={detail.id} className={styles['detail-item']}>
                    <div className={styles['detail-item__header']}>
                      <h4 className={styles['detail-item__title']}>{detail.name}</h4>
                      <span className={styles['detail-item__code']}>{detail.code}</span>
                    </div>
                    
                    <div className={styles['detail-item__info']}>
                      <div className={styles['detail-item__row']}>
                        <span className={styles['detail-item__label']}>Материал:</span>
                        <span className={styles['detail-item__value']}>{detail.material}</span>
                      </div>
                      <div className={styles['detail-item__row']}>
                        <span className={styles['detail-item__label']}>Вес:</span>
                        <span className={styles['detail-item__value']}>{detail.weight} кг</span>
                      </div>
                      <div className={styles['detail-item__row']}>
                        <span className={styles['detail-item__label']}>Размеры:</span>
                        <span className={styles['detail-item__value']}>{detail.dimensions} мм</span>
                      </div>
                      <div className={styles['detail-item__row']}>
                        <span className={styles['detail-item__label']}>Количество:</span>
                        <span className={styles['detail-item__value']}>{detail.quantity} шт</span>
                      </div>
                      <div className={styles['detail-item__row']}>
                        <span className={styles['detail-item__label']}>Позиция:</span>
                        <span className={styles['detail-item__value']}>{detail.position}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles['empty-state']}>
                <p>Детали не найдены</p>
                <p className={styles['empty-state__hint']}>
                  {searchTerm || filterType !== 'all' 
                    ? 'Попробуйте изменить параметры поиска или фильтры'
                    : 'В данной упаковке пока нет добавленных деталей'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
