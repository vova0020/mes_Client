import React, { useState, useEffect, useRef } from 'react';
import styles from './DetailsTable.module.css';
import useDetails from '../../../hooks/useDetails';
import PalletsSidebar from '../PalletsSidebar/PalletsSidebar';

interface DetailsTableProps {
  selectedOrderId: number | null;
}

const DetailsTable: React.FC<DetailsTableProps> = ({ selectedOrderId }) => {
  // Состояние для отслеживания активной детали
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);
  
  // Состояние для анимации (показывать/скрывать детали)
  const [showDetails, setShowDetails] = useState(false);
  
  // Состояние для боковой панели с поддонами
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDetailForPallets, setSelectedDetailForPallets] = useState<number | null>(null);
  
  // Используем хук для получения данных о деталях
  const { details, loading, error, fetchDetails } = useDetails();
  
  // Ref для отслеживания предыдущего ID заказа
  const prevOrderIdRef = useRef<number | null>(null);
  
  // Ref для контейнера таблицы, используется для определения кликов за пределами sidebar
  const containerRef = useRef<HTMLDivElement>(null);

  // Загружаем детали при изменении выбранного заказа
  useEffect(() => {
    // Если меняется ID заказа, сначала скрываем детали с анимацией
    if (prevOrderIdRef.current !== selectedOrderId && !loading && details.length > 0) {
      setShowDetails(false);
      
      // Используем setTimeout для создания "задержки" при смене данных
      const timer = setTimeout(() => {
        fetchDetails(selectedOrderId);
        // Сбрасываем активную деталь при смене заказа
        setActiveDetailId(null);
      }, 300); // Задержка должна быть равна или меньше времени анимации исчезновения
      
      return () => clearTimeout(timer);
    } else {
      fetchDetails(selectedOrderId);
      // Сбрасываем активную деталь при смене заказа
      setActiveDetailId(null);
    }
    
    prevOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId, fetchDetails]);

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

  // Синхронизация выделенной строки с состоянием боковой панели
  useEffect(() => {
    // Когда закрывается панель, снимаем выделение
    if (!sidebarOpen) {
      setActiveDetailId(null);
    } else {
      // Когда открывается панель, выделяем соответствующую строку
      setActiveDetailId(selectedDetailForPallets);
    }
  }, [sidebarOpen, selectedDetailForPallets]);

  // Обработчик кликов за пре��елами боковой панели
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Проверяем, что sidebar открыт
      if (!sidebarOpen) return;
      
      // Получаем элемент sidebar через DOM
      const sidebar = document.querySelector(`.${styles.sidebar}`);
      
      // Проверяем, что клик был не внутри sidebar и не на кнопке-стрелке
      if (sidebar && 
          !sidebar.contains(event.target as Node) && 
          !(event.target as Element).closest(`.${styles.arrowButton}`)) {
        setSidebarOpen(false);
      }
    };

    // Добавляем слушатель событий
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Удаляем слушатель при размонтировании
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarOpen, styles.sidebar, styles.arrowButton]);

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

  // Обработчик клика по кнопке "Чертеж"
  const handleDrawingClick = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    console.log(`Открыть чертеж для детали ${detailId}`);
  };

  // Обработчик клика по кнопке-стрелке
  const handleArrowClick = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    setSelectedDetailForPallets(detailId);
    setSidebarOpen(true);
  };

  // Обработчик закрытия боковой панели
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
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
            <p>В данном заказе отсутс��вуют детали или они еще не были добавлены</p>
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
              <th>Артикул</th>
              <th>Название</th>
              <th>Материал</th>
              <th>Размер</th>
              <th>Тех. информация</th>
              <th>Общее кол-во</th>
              <th>Готово к обработке</th>
              <th>Распределено</th>
              <th>Выполнено</th>
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
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleRowClick(detail.id)}
              >
                <td>{detail.articleNumber}</td>
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
                    onClick={(e) => handleArrowClick(e, detail.id)}
                  >
                    &#10095; {/* Символ стрелки вправо */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Боковая панель с поддо��ами */}
      <PalletsSidebar 
        detailId={selectedDetailForPallets} 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
      />
    </div>
  );
};

export default DetailsTable;