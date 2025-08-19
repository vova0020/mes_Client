import React from 'react';
import { RouteStage } from '../../api/routeListApi/routeListApi';
import styles from '../styles.module.css';

interface RoutingTableProps {
  routeStages: RouteStage[];
}

const RoutingTable: React.FC<RoutingTableProps> = ({ routeStages }) => {


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#28a745';
      case 'IN_PROGRESS': return '#ffc107';
      case 'PENDING': return '#17a2b8';
      case 'NOT_PROCESSED': return '#6c757d';
      case 'AWAITING_PACKAGING': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Завершено';
      case 'IN_PROGRESS': return 'В процессе';
      case 'PENDING': return 'Ожидает';
      case 'NOT_PROCESSED': return 'Не обработано';
      case 'AWAITING_PACKAGING': return 'Ожидает упаковки';
      default: return status;
    }
  };

  return (
    <div className={styles.routingSection}>
      <div className={styles.cardHeader}>
        <h3>Маршрутная таблица</h3>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.modernTable}>
          <thead>
            <tr>
              <th>Операции</th>
              <th>Дата</th>
              <th>Оператор</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {routeStages.map((stage, index) => (
              <tr key={index}>
                <td className={styles.operationCell}>{stage.stageName}</td>
                <td>{stage.completedAt ? new Date(stage.completedAt).toLocaleDateString() : '-'}</td>
                <td>-</td>
                <td>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(stage.status) }}
                  >
                    {getStatusText(stage.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoutingTable;