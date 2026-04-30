import React from 'react';
import styles from './PalletsSidebar.module.css';

interface Part {
  id: number;
  articleNumber: string;
  name: string;
  quantity: number;
  material: string;
  size: string;
  substage: string;
  readyForProcessing: number;
  completed: number;
  status: string;
}

interface Pallet {
  id: number;
  palletNumber: string;
  materials: string;
  address: string;
  status: string;
  machine: string;
  parts: Part[];
}

interface PalletsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pallet: Pallet | null;
  onStartWork: (partId: number) => void;
  onCompleteWork: (partId: number) => void;
}

const PalletsSidebar: React.FC<PalletsSidebarProps> = ({ isOpen, onClose, pallet, onStartWork, onCompleteWork }) => {
  console.log('PalletsSidebar render:', { isOpen, pallet, partsCount: pallet?.parts?.length });
  
  if (!pallet) {
    console.log('No pallet provided to sidebar');
    return null;
  }

  const handleDrawingClick = (partId: number) => {
    console.log(`Открыть чертеж для детали ${partId}`);
  };

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'готово к обработке':
        return styles.statusPassedPreviousStage;
      case 'в работе':
        return styles.statusInProgress;
      case 'завершено':
        return styles.statusCompleted;
      default:
        return '';
    }
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.headerTop}>
          <h2>Детали поддона</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.detailInfo}>
          <div className={styles.detailProperty}>
            <span className={styles.propertyLabel}>Номер поддона:</span>
            <span className={styles.propertyValue}>{pallet.palletNumber}</span>
          </div>
          <div className={styles.detailProperty}>
            <span className={styles.propertyLabel}>Адрес:</span>
            <span className={styles.propertyValue}>{pallet.address}</span>
          </div>
          <div className={styles.detailProperty}>
            <span className={styles.propertyLabel}>Статус:</span>
            <span className={styles.propertyValue}>{pallet.status}</span>
          </div>
        </div>
      </div>

      <div className={styles.sidebarContent}>
        {!pallet.parts || pallet.parts.length === 0 ? (
          <div className={styles.stateContainer}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyMessage}>
              <h3>Нет деталей в поддоне</h3>
              <p>Поддон пуст или детали еще не добавлены</p>
              <p style={{color: 'red'}}>Debug: parts = {JSON.stringify(pallet.parts)}</p>
            </div>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableScrollContainer}>
              <table className={styles.palletsTable}>
                <thead>
                  <tr>
                    <th>Артикул детали</th>
                    <th>Название детали</th>
                    <th>Материал</th>
                    <th>Размер</th>
                    <th>Подэтап</th>
                    <th>Тех инфо</th>
                    <th>Количество по заказу</th>
                    <th>Готово к обработке</th>
                    <th>Выполнено</th>
                    <th>Статус детали</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pallet.parts.map((part, index) => (
                    <tr
                      key={part.id}
                      className={styles.animatedRow}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td>{part.articleNumber}</td>
                      <td>{part.name}</td>
                      <td>{part.material}</td>
                      <td>{part.size}</td>
                      <td>{part.substage}</td>
                      <td>
                        <button 
                          className={styles.drawingButton}
                          onClick={() => handleDrawingClick(part.id)}
                        >
                          Чертеж
                        </button>
                      </td>
                      <td>{part.quantity}</td>
                      <td>{part.readyForProcessing}</td>
                      <td>{part.completed}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(part.status)}`}>
                          {part.status}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        {part.status === 'Готово к обработке' && (
                          <button 
                            className={`${styles.actionButton} ${styles.inProgressButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartWork(part.id);
                            }}
                          >
                            Взять
                          </button>
                        )}
                        {part.status === 'В работе' && (
                          <button 
                            className={`${styles.actionButton} ${styles.completedButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompleteWork(part.id);
                            }}
                          >
                            Завершить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PalletsSidebar;
