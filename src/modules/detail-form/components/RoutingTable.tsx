import React from 'react';
import styles from '../styles.module.css';

const RoutingTable: React.FC = () => {
  const testOperations = [
    { operation: 'Распил', date: '2025-08-17', quantity: '1', address: 'А-1', operator: 'Иванов', status: 'завершено' },
    { operation: 'Кромкование', date: '2025-08-18', quantity: '1', address: 'Б-2', operator: 'Петров', status: 'завершено' },
    { operation: 'Сверление', date: '', quantity: '', address: '', operator: '', status: 'ожидание' },
    { operation: 'Сборка', date: '', quantity: '', address: '', operator: '', status: 'ожидание' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'завершено': return '#28a745';
      case 'в процессе': return '#ffc107';
      case 'ожидание': return '#6c757d';
      default: return '#6c757d';
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
              <th>Кол-во</th>
              <th>Адрес</th>
              <th>Оператор</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {testOperations.map((op, index) => (
              <tr key={index}>
                <td className={styles.operationCell}>{op.operation}</td>
                <td>{op.date}</td>
                <td>{op.quantity}</td>
                <td>{op.address}</td>
                <td>{op.operator}</td>
                <td>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(op.status) }}
                  >
                    {op.status}
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