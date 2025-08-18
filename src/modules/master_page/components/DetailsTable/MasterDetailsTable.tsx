
import React, { useState, useEffect, useRef } from 'react';
import styles from './DetailsTable.module.css';
import useDetails from '../../../hooks/masterPage/useDetailsMaster';
import PalletsSidebar from '../PalletsSidebar/MasterPalletsSidebar';
import DetailForm from '../../../detail-form/DetailForm';

interface DetailsTableProps {
  selectedOrderId: number | null;
  onDataUpdate?: () => void;
}

const DetailsTable: React.FC<DetailsTableProps> = ({ selectedOrderId, onDataUpdate }) => {
  // Состояние для отслеживания активной детали
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать детали)
  const [showDetails, setShowDetails] = useState(false);
  
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

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (detailId: number) => {
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
  };

   // Обработчик кнопки МЛ (маршрутный лист)
  const handleOpenML = () => {
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
              <th>Артикул детали</th>
              <th>Артикул упаковки</th>
              <th>Название</th>
              <th>Материал</th>
              <th>Размер</th>
              <th>Тех. информация</th>
              <th>Общее кол-во</th>
              <th>Готово к обработке</th>
              <th>Распределено</th>
              <th>Выполнено</th>
              <th></th>
            </tr>
          </thead>
          <tbody className={showDetails ? styles.showDetails : styles.hideDetails}>
            {details.sort((a, b) => a.id - b.id).map((detail, index) => (
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
                <td>тут будет артикул упаковки</td>
                <td>{detail.name}</td>
                <td>{detail.material}</td>
                <td>{detail.size}</td>
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
          />
    </div>
  );
};

export default DetailsTable;
