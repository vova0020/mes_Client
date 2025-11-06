
import React, { useState, useEffect, useRef } from 'react';
import styles from './MasterDetailsTable.module.css';
import useDetails from '../../../hooks/masterPage/useDetailsMaster';
import PalletsSidebar from '../MasterPalletsSidebar/MasterPalletsSidebar';
import DetailForm from '../../../detail-form/DetailForm';
import { Detail } from '../../../api/masterPage/detailServiceMaster';

interface DetailsTableProps {
  selectedOrderId: number | null;
  onDataUpdate?: () => void;
}

// Интерфейс для фильтров
interface Filters {
  articleNumber: string[];
  packages: string[];
  name: string[];
  material: string[];
  size: string[];
  substage: string[];
}

const DetailsTable: React.FC<DetailsTableProps> = ({ selectedOrderId, onDataUpdate }) => {
  // Состояние для отслеживания активной детали
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать детали)
  const [showDetails, setShowDetails] = useState(false);
  
  // Состояние для фильтров
  const [filters, setFilters] = useState<Filters>({
    articleNumber: [],
    packages: [],
    name: [],
    material: [],
    size: [],
    substage: []
  });
  
  // Состояние для отслеживания открытого фильтра
  const [openFilter, setOpenFilter] = useState<keyof Filters | null>(null);
  
  // Состояние для боковой панели с поддонами
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarOpen2, setSidebarOpen2] = useState(false);
  const [selectedDetailForPallets, setSelectedDetailForPallets] = useState<number | null>(null);
  const [selectedInfoDetailForPallets, setSelectedInfoDetailForPallets] = useState([]);
  
  // Используем хук для получения данных о деталях
  const { details, loading, error, fetchDetails } = useDetails();
  
  // Ref для отслеживания предыдущего ID заказа
  const prevOrderIdRef = useRef<number | null>(null);
  
  // Ref для контейнера таблицы, используется для определения кликов за пределами sidebar
  const containerRef = useRef<HTMLDivElement>(null);

  // Загружаем детали при изменении выбранного заказа
  useEffect(() => {
    // Проверяем, действительно ли изменился ID заказа
    if (prevOrderIdRef.current === selectedOrderId) {
      return; // Если ID не изменился, не делаем ничего
    }

    // Сбрасываем активную деталь при смене заказа
    setActiveDetailId(null);
    
    // Сбрасываем фильтры при смене заказа
    setFilters({
      articleNumber: [],
      packages: [],
      name: [],
      material: [],
      size: [],
      substage: []
    });
    
    // Закрываем открытый фильтр
    setOpenFilter(null);
    
    // Если есть предыдущие детали, скрываем их для анимации
    if (prevOrderIdRef.current !== null && details.length > 0) {
      setShowDetails(false);
    }
    
    // МГНОВЕННО отправляем запрос на получение деталей - без задержки!
    fetchDetails(selectedOrderId);
    
    // Обновляем ref
    prevOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId, fetchDetails, details.length]);

  // Показываем детали с анимацией после загрузки
  useEffect(() => {
    if (!loading && details.length > 0) {
      // Небольшая задержка перед показом деталей для более заметной анимации
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (!loading && details.length === 0) {
      // Если деталей нет, сразу скрываем анимацию
      setShowDetails(false);
    }
  }, [loading, details]);

  // Синхронизация выделенной строки с состоянием боковой панели
  useEffect(() => {
    // Когда закрывается панель, снимаем выделение только если не открыта панель МЛ
    if (!sidebarOpen && !sidebarOpen2) {
      setActiveDetailId(null);
    } else if (sidebarOpen) {
      // Когда открывается панель, выделяем соответствующую строку
      setActiveDetailId(selectedDetailForPallets);
    }
  }, [sidebarOpen, sidebarOpen2, selectedDetailForPallets]);

  // Закрываем фильтр при клике вне его и при изменении размера окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilter && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };

    const handleResize = () => {
      setOpenFilter(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [openFilter]);

  // Получение уникальных значений для фильтров
  const getUniqueValues = (field: keyof Detail | 'packages') => {
    if (field === 'packages') {
      const packageCodes = details.flatMap(d => d.packages.map(p => p.packageCode));
      return Array.from(new Set(packageCodes));
    }
    if (field === 'substage') {
      const substageNames = details.map(d => d.substage?.substageName).filter(Boolean) as string[];
      return Array.from(new Set(substageNames));
    }
    const fieldValues = details.map(d => String((d as any)[field]));
    return Array.from(new Set(fieldValues));
  };

  // Функция фильтрации деталей
  const filteredDetails = details.filter(detail => {
    if (filters.articleNumber.length > 0 && !filters.articleNumber.includes(detail.articleNumber)) return false;
    if (filters.packages.length > 0 && !detail.packages.some(p => filters.packages.includes(p.packageCode))) return false;
    if (filters.name.length > 0 && !filters.name.includes(detail.name)) return false;
    if (filters.material.length > 0 && !filters.material.includes(detail.material)) return false;
    if (filters.size.length > 0 && !filters.size.includes(detail.size)) return false;
    if (filters.substage.length > 0 && (!detail.substage || !filters.substage.includes(detail.substage.substageName))) return false;
    return true;
  });

  // Обработчик изменения фильтра
  const handleFilterChange = (column: keyof Filters, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [column]: checked 
        ? [...prev[column], value]
        : prev[column].filter(v => v !== value)
    }));
  };

  // Компонент фильтра
  const FilterDropdown: React.FC<{
    column: keyof Filters;
    values: string[];
  }> = ({ column, values }) => {
    const arrowRef = useRef<HTMLSpanElement>(null);
    const isOpen = openFilter === column;
    
    const handleToggle = () => {
      if (openFilter === column) {
        setOpenFilter(null);
      } else {
        setOpenFilter(column);
      }
    };
    
    return (
      <div className={styles.filterContainer}>
        <span 
          ref={arrowRef}
          className={`${styles.filterArrow} ${filters[column].length > 0 ? styles.filterActive : ''} ${isOpen ? styles.filterOpen : ''}`}
          onClick={handleToggle}
        >
          ▼
        </span>
        
        {isOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterHeader}>
              <span>Фильтр</span>
              <button 
                className={styles.clearFilter}
                onClick={() => setFilters(prev => ({ ...prev, [column]: [] }))}
              >
                Очистить
              </button>
            </div>
            <div className={styles.filterOptions}>
              {values.map(value => (
                <label key={value} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={filters[column].includes(value)}
                    onChange={(e) => handleFilterChange(column, value, e.target.checked)}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (detailId: number) => {
    // Закрываем открытый фильтр
    setOpenFilter(null);
    
    // Если открыта боковая панель с поддонами, игнорируем все клики по строкам
    if (sidebarOpen) {
      return;
    }
    
    // Если нажали на уже выбранную строку, сбрасываем выбор
    if (activeDetailId === detailId) {
      setActiveDetailId(null);
    } else {
      // Иначе выбираем новую строку
      setActiveDetailId(detailId);
    }
  };

  // Обработчик клика по кнопке "Чертеж"
  const handleDrawingClick = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    console.log(`Открыть чертеж для детали ${detailId}`);
  };

  // Обработчик клика по кнопке-стрелке
  const handleArrowClick = (e: React.MouseEvent, detailId: number, detail: any) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    setSelectedDetailForPallets(detailId);
    setSelectedInfoDetailForPallets(detail);
    setSidebarOpen(true);
  };

  // Обработчик закрытия боковой панели
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    // Снимаем выделение только если не открыта панель МЛ
    if (!sidebarOpen2) {
      setActiveDetailId(null);
    }
  };
  // Обработчик закрытия боковой панели
  const handleCloseSidebar2 = () => {
    setSidebarOpen2(false);
    setSelectedPalletId(null);
  };

  // Состояние для выбранного поддона
  const [selectedPalletId, setSelectedPalletId] = useState<number | null>(null);

   // Обработчик кнопки МЛ (маршрутный лист)
  const handleOpenML = (palletId?: number) => {
    if (palletId) {
      setSelectedPalletId(palletId);
    }
    setSidebarOpen2(true);
  };

  // Отображаем сообщение о загрузке
  if (loading) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка деталей</h3>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      </div>
    );
  }

  // Отображаем сообщение об ошибке
  if (error) {
    console.error("Ошибка в компоненте DetailsTable:", error);
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className={styles.errorMessage}>
            <h3>Не удалось загрузить детали</h3>
            <p>Произошла ошибка при получении данных с сервера</p>
            <button onClick={() => fetchDetails(selectedOrderId)} className={styles.retryButton}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Если заказ не выбран, показываем соответствующее сообщение
  if (selectedOrderId === null) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Выберите заказ</h3>
            <p>Для просмотра деталей необходимо выбрать заказ из списка</p>
          </div>
        </div>
      </div>
    );
  }

  // Если выбран заказ, но нет деталей
  if (details.length === 0) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о деталях</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Нет доступных деталей</h3>
            <p>В данном заказе отсутствуют детали или они еще не были добавлены</p>
          </div>
        </div>
      </div>
    );
  }

  // Если есть детали для отображения
  return (
    <div className={styles.detailsContainer} ref={containerRef}>
      <h2 className={styles.title}>Информация о деталях</h2>

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <th>
                <div className={styles.headerWithFilter}>
                  <span>Артикул детали</span>
                  <FilterDropdown 
                    column="articleNumber" 
                    values={getUniqueValues('articleNumber')} 
                  />
                </div>
              </th>
              <th>
                <div className={styles.headerWithFilter}>
                  <span>Упаковки</span>
                  <FilterDropdown 
                    column="packages" 
                    values={getUniqueValues('packages')} 
                  />
                </div>
              </th>
              <th>
                <div className={styles.headerWithFilter}>
                  <span>Название</span>
                  <FilterDropdown 
                    column="name" 
                    values={getUniqueValues('name')} 
                  />
                </div>
              </th>
              <th>
                <div className={styles.headerWithFilter}>
                  <span>Материал</span>
                  <FilterDropdown 
                    column="material" 
                    values={getUniqueValues('material')} 
                  />
                </div>
              </th>
              <th>
                <div className={styles.headerWithFilter}>
                  <span>Размер</span>
                  <FilterDropdown 
                    column="size" 
                    values={getUniqueValues('size')} 
                  />
                </div>
              </th>
              <th>
                <div className={styles.headerWithFilter}>
                  <span>Подэтап</span>
                  <FilterDropdown 
                    column="substage" 
                    values={getUniqueValues('substage')} 
                  />
                </div>
              </th>
              <th>Тех. информация</th>
              <th>Общее кол-во</th>
              <th>Готово к обработке</th>
              <th>Распределено</th>
              <th>Выполнено</th>
              <th></th>
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {filteredDetails.sort((a, b) => a.id - b.id).map((detail, index) => (
              <tr
                key={detail.id}
                className={`
                  ${activeDetailId === detail.id ? styles.activeRow : ''}
                  ${styles.animatedRow}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(detail.id)}
              >
                <td>{detail.articleNumber}</td>
                <td>
                  <div className={styles.packagesContainer}>
                    {detail.packages.map((pkg, pkgIndex) => (
                      <div key={pkg.packageId} className={styles.packageItem}>
                        <span className={styles.packageCode}>{pkg.packageCode}</span>
                        <span className={styles.packageQuantity}>({pkg.quantity})</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td>{detail.name}</td>
                <td>{detail.material}</td>
                <td>{detail.size}</td>
                <td>{detail.substage?.substageName || '-'}</td>
                <td>
                  <button 
                    className={styles.drawingButton}
                    onClick={(e) => handleDrawingClick(e, detail.id)}
                  >
                    Чертеж
                  </button>
                </td>
                <td>{detail.totalQuantity}</td>
                <td>{detail.readyForProcessing}</td>
                <td>{detail.distributed}</td>
                <td>{detail.completed}</td>
                <td>
                  <button 
                    className={styles.arrowButton}
                    onClick={(e) => handleArrowClick(e, detail.id, detail)}
                  >
                    &#10095;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Боковая панель с поддонами */}
      <PalletsSidebar 
        handleOpenML={handleOpenML}
        detailId={selectedDetailForPallets} 
        detailInfo={selectedInfoDetailForPallets} 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar}
        onDataUpdate={onDataUpdate}
      />

      {/* Боковая панель маршрутный лист */}
          <DetailForm 
            isOpen={sidebarOpen2} 
            onClose={handleCloseSidebar2}
            palletId={selectedPalletId || undefined}
          />
    </div>
  );
};

export default DetailsTable;
