import React, { useState } from 'react';
import styles from './DetailsTable.module.css';

interface Detail {
  id: number;
  articleNumber: string;
  name: string;
  material: string;
  size: string;
  totalQuantity: number;
  readyForProcessing: number;
  completed: number;
}

const DetailsTable: React.FC = () => {
  // Состояние для отслеживания активной детали
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null);

  // Пример данных для таблицы деталей
  const details: Detail[] = [
    {
      id: 1,
      articleNumber: 'A-123-45',
      name: 'Вал приводнойрииииииииииииииии иииииииииииииииииииииииии иииииииииииииииииииииииии иииииииииииииииииии',
      material: 'Сталь 45 Сталь 45 Сталь 45 Сталь 45',
      size: '50x200 мм',
      totalQuantity: 10,
      readyForProcessing: 8,
      completed: 5,
    },
    {
      id: 2,
      articleNumber: 'B-456-78',
      name: 'Шестерня коническая',
      material: 'Сталь 40Х',
      size: '80x30 мм',
      totalQuantity: 15,
      readyForProcessing: 15,
      completed: 10,
    },
    {
      id: 3,
      articleNumber: 'C-789-01',
      name: 'Втулка направляющая',
      material: 'Бронза БрАЖ9-4',
      size: '40x60 мм',
      totalQuantity: 20,
      readyForProcessing: 20,
      completed: 20,
    },
    {
      id: 4,
      articleNumber: 'D-012-34',
      name: 'Фланец соединительный',
      material: 'Сталь 20',
      size: '120x15 мм',
      totalQuantity: 8,
      readyForProcessing: 5,
      completed: 3,
    },
    {
      id: 5,
      articleNumber: 'E-345-67',
      name: 'Крышка подшипника',
      material: 'Чугун СЧ20',
      size: '100x25 мм',
      totalQuantity: 12,
      readyForProcessing: 12,
      completed: 6,
    },
    {
      id: 6,
      articleNumber: 'F-678-90',
      name: 'Корпус редуктора',
      material: 'Алюминий Д16Т',
      size: '250x150x100 мм',
      totalQuantity: 5,
      readyForProcessing: 3,
      completed: 1,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
    {
      id: 7,
      articleNumber: 'G-901-23',
      name: 'Вал-шестерня',
      material: 'Сталь 40ХН',
      size: '30x150 мм',
      totalQuantity: 18,
      readyForProcessing: 12,
      completed: 8,
    },
  ];

  // Обработчик клика по строке таблицы с возможностью сброса выбора
  const handleRowClick = (detailId: number) => {
    // Если нажали на уже выбранную строку, сбрасываем выбор
    if (activeDetailId === detailId) {
      setActiveDetailId(null);
    } else {
      // Иначе выбираем новую строку
      setActiveDetailId(detailId);
    }
    
    // Здесь можно добавить дополнительную логику при выборе/отмене выбора детали
  };

  // Обработчик клика по кнопке "Чертеж"
  const handleDrawingClick = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события, чтобы не срабатывал клик по строке
    // Здесь логика для открытия чертежа
    console.log(`Открыть чертеж для детали ${detailId}`);
  };

  // Обработчик клика по кнопке-стрелке
  const handleArrowClick = (e: React.MouseEvent, detailId: number) => {
    e.stopPropagation(); // Предотвращаем всплытие события, чтобы не срабатывал клик по строке
    // Здесь логика для действия по стрелке (например, переход к детальной информации)
    console.log(`Действие по стрелке для детали ${detailId}`);
  };

  return (
    <div className={styles.detailsContainer}>
      <h2 className={styles.title}>Информация о деталях</h2>

      <div className={styles.tableContainer}>
        {details.length > 0 ? (
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
                <th>Выполнено</th>
                <th></th> {/* Колонка для кнопки-стрелки */}
              </tr>
            </thead>
            <tbody>
              {details.map((detail) => (
                <tr
                  key={detail.id}
                  className={activeDetailId === detail.id ? styles.activeRow : ''}
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
        ) : (
          <div className={styles.emptyMessage}>Нет доступных деталей</div>
        )}
      </div>
    </div>
  );
};

export default DetailsTable;