import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import EdgeDiagram from './components/EdgeDiagram';
import RoutingTable from './components/RoutingTable';
import styles from './styles.module.css';

interface PalletsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DetailForm: React.FC<PalletsSidebarProps> = ({ isOpen, onClose }) => {
  // Ref для боковой панели
  const sidebarRef = useRef<HTMLDivElement>(null);
  // Добавляем обработчик кликов вне боковой панели
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Проверяем, что sidebar открыт и что клик был не внутри него
      if (isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Добавляем обработчик только если панель открыта
    if (isOpen) {
      // Используем setTimeout, чтобы не сработало закрытие сразу после открытия
      setTimeout(() => {
        document.addEventListener('mousedown', handleOutsideClick);
      }, 100);
    }

    // Удаляем обработчик при закрытии панели или размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);



  const [isPrintMode, setIsPrintMode] = useState(false);






  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  if (isPrintMode) {
    return (
      <div className={styles.printVersion}>
        <Header />
        <div className={styles.content}>
          <div className={styles.left}>
            <EdgeDiagram />
            <div className={styles.planSection}>
              <label>Паз:</label>
              <input type="text" className={styles.underlineInput} />
            </div>
          </div>
          <div className={styles.right}>
            <RoutingTable />
          </div>
        </div>
        <div>
          <button className={styles.openButton}>Открыть чертеж</button>
          <div className={styles.orderInfo}>
            <label>Название и номер заказа</label>
            <input type="text" className={styles.underlineInputWide} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
     ref={sidebarRef}
    className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
    >
      <div className={styles.modernForm}>
        <div className={styles.toolbar}>
          {/* <button className={styles.printBtn} onClick={handlePrint}>
            🖨️ Печатать
          </button> */}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Маршрутный лист детали</h2>
          </div>

          <div className={styles.topSection}>
            <div className={styles.infoFields}>
              <div className={styles.field}>
                <label>Артикул:</label>
                <span className={styles.fieldValue}>МДФ-001-2024</span>
              </div>
              <div className={styles.field}>
                <label>Подраздел №:</label>
                <span className={styles.fieldValue}>П-15</span>
              </div>
              <div className={styles.field}>
                <label>Дата:</label>
                <span className={styles.fieldValue}>15.01.2024</span>
              </div>
              <div className={styles.field}>
                <label>Количество:</label>
                <span className={styles.fieldValue}>5 шт</span>
              </div>
              <div className={styles.field}>
                <label>Материал:</label>
                <span className={styles.fieldValue}>МДФ 18мм</span>
              </div>
            </div>
            <div className={styles.qrSection}>
              <div className={styles.symbols}>
                ПФ/<br />ПФ СВ
              </div>
              <span className={styles.arrow}>←</span>
              <div className={styles.qr}>QR</div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Название детали:</label>
            <span className={styles.fieldValue}>Боковина шкафа левая</span>
          </div>

          <div className={styles.sizeSection}>
            <div className={styles.sizeField}>
              <label>Размер по раскрою:</label>
              <div className={styles.grayBox}>2500x1210</div>
            </div>
            <div className={styles.sizeField}>
              <label>Размер готовой детали:</label>
              <div className={styles.grayBox}>2480x1200</div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.leftColumn}>
              <div className={styles.cardHeader}>
                <h3>Схема детали</h3>
              </div>
              <EdgeDiagram />
              <div className={styles.inputGroup}>
                <label>Паз:</label>
                <span className={styles.fieldValue}>L1: 2мм, L2: 0.4мм</span>
              </div>
            </div>

            <div className={styles.rightColumn}>
              <RoutingTable />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Название и номер заказа:</label>
            <span className={styles.fieldValue}>Кухня "Модерн" - Заказ №2024-0156</span>
          </div>
          <button className={styles.modernBtn}>Открыть чертеж</button>
        </div>
      </div>
    </div>

  );
};

export default DetailForm;