import React, { useState, useEffect, useRef } from 'react';
import styles from './DetailsTable.module.css';

interface PackageDetail {
  id: number;
  priority: number;
  orderId: string;
  articleNumber: string;
  name: string;
  totalQuantity: number;
  readyForPacking: number;
  completed: number;
  inProgress: boolean;
  completed_at?: string;
}

interface DetailsTableProps {
  selectedLineId: number | null;
}

const DetailsTable: React.FC<DetailsTableProps> = ({ selectedLineId }) => {
  // Состояние для отслеживания активной детали
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать детали)
  const [showDetails, setShowDetails] = useState(false);
  
  // Состояние для модального окна схемы укладки
  const [isSchemeOpen, setIsSchemeOpen] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  
  // Отслеживание загрузки и ошибок
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Дефолтные данные деталей для комплектации
  const defaultDetails: PackageDetail[] = [
    {
      id: 1,
      priority: 1,
      orderId: "ORD-2023-1568",
      articleNumber: "PKG-M001",
      name: "Коробка для стола 'Стандарт'",
      totalQuantity: 12,
      readyForPacking: 12,
      completed: 8,
      inProgress: true,
      completed_at: undefined
    },
    {
      id: 2,
      priority: 2,
      orderId: "ORD-2023-1570",
      articleNumber: "PKG-M002",
      name: "Коробка для стула 'Комфорт'",
      totalQuantity: 24,
      readyForPacking: 20,
      completed: 16,
      inProgress: false,
      completed_at: undefined
    },
    {
      id: 3,
      priority: 3,
      orderId: "ORD-2023-1572",
      articleNumber: "PKG-M003",
      name: "Упаковка для шкафа 'Классик'",
      totalQuantity: 4,
      readyForPacking: 4,
      completed: 4,
      inProgress: false,
      completed_at: "2023-11-15 14:30"
    },
    {
      id: 4,
      priority: 1,
      orderId: "ORD-2023-1575",
      articleNumber: "PKG-M004",
      name: "Упаковка для комода 'Модерн'",
      totalQuantity: 6,
      readyForPacking: 6,
      completed: 2,
      inProgress: true,
      completed_at: undefined
    },
    {
      id: 5,
      priority: 1,
      orderId: "ORD-2023-1580",
      articleNumber: "PKG-M005",
      name: "Коробка для кровати 'Люкс'",
      totalQuantity: 8,
      readyForPacking: 6,
      completed: 0,
      inProgress: false,
      completed_at: undefined
    }
  ];

  // Состояние для хранения данных деталей
  const [details, setDetails] = useState<PackageDetail[]>([]);
  
  // Ref для отслеживания предыдущего ID линии
  const prevLineIdRef = useRef<number | null>(null);
  
  // Ref для контейнера таблицы
  const containerRef = useRef<HTMLDivElement>(null);

  // Загружаем детали при изменении выбранной линии
  useEffect(() => {
    // Устанавливаем состояние загрузки
    setLoading(true);
    
    // Если меняется ID линии, сначала скрываем детали с анимацией
    if (prevLineIdRef.current !== selectedLineId) {
      setShowDetails(false);
      
      // Используем setTimeout для создания "задержки" при смене данных
      const timer = setTimeout(() => {
        // В реальном приложении тут был бы запрос к API
        // Для демонстрации используем дефолтные данные
        setDetails(selectedLineId ? defaultDetails : []);
        setLoading(false);
        
        // Сбрасываем активную деталь при смене линии
        setActiveDetailId(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Если линия не менялась, просто обновляем данные
      setDetails(selectedLineId ? defaultDetails : []);
      setLoading(false);
      setActiveDetailId(null);
    }
    
    prevLineIdRef.current = selectedLineId;
  }, [selectedLineId]);

  // Показываем детали с анимацией после загрузки
  useEffect(() => {
    if (!loading && details.length > 0) {
      // Небольшая задержка перед показом деталей для более заметной анимации
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, details]);

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (detailId: number) => {
    // Если нажали на уже выбранную строку, сбрасываем выбор
    if (activeDetailId === detailId) {
      setActiveDetailId(null);
    } else {
      // Иначе выбираем новую строку
      setActiveDetailId(detailId);
    }
  };

  // Обработчик клика по кнопке "Схема укладки"
  const handleSchemeClick = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    setSelectedSchemeId(detailId);
    setIsSchemeOpen(true);
  };

  // Обработчик закрытия модального окна схемы укладки
  const handleCloseScheme = () => {
    setIsSchemeOpen(false);
    setSelectedSchemeId(null);
  };

  // Обработчик кнопки "Начать"
  const handleStartProcess = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    // Обновляем состояние детали
    setDetails(prevDetails => prevDetails.map(detail => 
      detail.id === detailId 
        ? { ...detail, inProgress: true } 
        : detail
    ));
  };

  // Обработчик кнопки "Завершить"
  const handleCompleteProcess = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    // Обновляем состояние детали
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    setDetails(prevDetails => prevDetails.map(detail => 
      detail.id === detailId 
        ? { 
            ...detail, 
            inProgress: false, 
            completed: detail.totalQuantity, 
            completed_at: formattedDate 
          } 
        : detail
    ));
  };

  // Отображаем сообщение о загрузке
  if (loading) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о комплектации</h2>
        <div className={styles.stateContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMessage}>
            <h3>Загрузка данных</h3>
            <p>Пожалуйста, подождите...</p>
          </div>
        </div>
      </div>
    );
  }

  // Отображаем сообщение об ошибке
  if (error) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о комплектации</h2>
        <div className={styles.stateContainer}>
          <div className={styles.errorIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className={styles.errorMessage}>
            <h3>Не удалось загрузить данные</h3>
            <p>Произошла ошибка при получении информации о комплектации</p>
            <button className={styles.retryButton}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Если линия не выбрана, показываем соответствующее сообщение
  if (selectedLineId === null) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о комплектации</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Выберите линию комплектации</h3>
            <p>Для просмотра деталей необходимо выбрать линию из списка слева</p>
          </div>
        </div>
      </div>
    );
  }

  // Если выбрана линия, но нет деталей
  if (details.length === 0) {
    return (
      <div className={styles.detailsContainer}>
        <h2 className={styles.title}>Информация о комплектации</h2>
        <div className={styles.stateContainer}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.emptyMessage}>
            <h3>Нет заданий для комплектации</h3>
            <p>В выбранной линии отсутствуют задания на комплектацию</p>
          </div>
        </div>
      </div>
    );
  }

  // Если есть детали для отображения
  return (
    <div className={styles.detailsContainer} ref={containerRef}>
      <h2 className={styles.title}>Информация о комплектации</h2>

      <div className={styles.tableContainer}>
        <table className={styles.detailsTable}>
          <thead>
            <tr>
              <th>Приоритет</th>
              <th>Заказ</th>
              <th>Артикул упаковки</th>
              <th>Название упаковки</th>
              <th>Тех. информация</th>
              <th>Общее кол-во</th>
              <th>Готово к упаковке</th>
              <th>Скомплектовано</th>
              <th>Действия</th>
                   <th></th> {/* Колонка для кнопки-стрелки */}
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {details.map((detail, index) => (
              <tr
                key={detail.id}
                className={`
                  ${activeDetailId === detail.id ? styles.activeRow : ''}
                  ${styles.animatedRow}
                  ${detail.completed_at ? styles.completedRow : ''}
                  ${detail.inProgress ? styles.inProgressRow : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(detail.id)}
              >
                <td className={styles.priorityCell}>
                  <span className={`${styles.priorityBadge} ${styles[`priority${detail.priority}`]}`}>
                    {detail.priority}
                  </span>
                </td>
                <td>{detail.orderId}</td>
                <td>{detail.articleNumber}</td>
                <td>{detail.name}</td>
                <td>
                  <button 
                    className={styles.schemeButton}
                    onClick={(e) => handleSchemeClick(e, detail.id)}
                  >
                    Схема укладки
                  </button>
                </td>
                <td>{detail.totalQuantity}</td>
                <td>{detail.readyForPacking}</td>
                <td>{detail.completed}</td>
                <td className={styles.actionsCell}>
                  <button 
                    className={`${styles.actionButton} ${styles.startButton}`}
                    title="Отправить на мониторы"
                  >
                    Начать
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.completeButton}`}
               
                    title="Перевести задачу в работу"
                  >
                   Завершить
                  </button>
                </td>
                <td>
                  <button 
                    className={styles.arrowButton}
        
                  >
                    &#10095; {/* Символ стрелки вправо */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Модальное окно для схемы укладки */}
      {isSchemeOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseScheme}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Схема укладки</h3>
              <button className={styles.closeButton} onClick={handleCloseScheme}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.schemePlaceholder}>
                <img 
                  src={`/images/packing_scheme_${selectedSchemeId}.png`} 
                  alt="Схема укладки" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default_scheme.png';
                  }}
                />
                <p>Схема укладки для артикула {details.find(d => d.id === selectedSchemeId)?.articleNumber}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsTable;