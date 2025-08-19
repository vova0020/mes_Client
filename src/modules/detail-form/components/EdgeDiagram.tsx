import React from 'react';

interface EdgeDiagramProps {
  width?: number;
  height?: number;
  edgingNameL1?: string | null;
  edgingNameW1?: string | null;
}

const EdgeDiagram: React.FC<EdgeDiagramProps> = ({
  width,
  height,
  edgingNameL1,
  edgingNameW1
}) => {
  // Используем реальные размеры с сервера или значения по умолчанию
  const dimensions = { 
    width: width || 0, 
    height: height || 0 
  };

  // Определяем ориентацию прямоугольника
  const isVertical = dimensions.height > dimensions.width;
  const isSquare = Math.abs(dimensions.height - dimensions.width) < Math.min(dimensions.width, dimensions.height) * 0.2;

  // Базовые размеры для отображения
  const baseSize = 200;
  const aspectRatio = dimensions.width / dimensions.height;

  let displayWidth, displayHeight;
  if (isVertical) {
    displayHeight = baseSize;
    displayWidth = baseSize * aspectRatio;
  } else {
    displayWidth = baseSize;
    displayHeight = baseSize / aspectRatio;
  }

  return (
    <div className="diagram-wrapper">


      {/* Диаграмма */}
      <div className="diagram-container">
        {/* Левая сторона */}
        <div className="left-side">
          <div className="edge-label vertical-text">
            {edgingNameW1 || 'Кромка W1'}
          </div>
          <div className="dimension-label vertical-text dimension-left">
          </div>
          <div className="arrow-left">►</div>
        </div>

        {/* Центральная часть */}
        <div className="center-section">
          {/* Верхнее обозначение */}
          <div className="top-label">
            <div className="edge-text">{edgingNameL1 || 'Кромка L1'}</div>
            <div className="triangle-down"></div>
          </div>

          {/* Основной прямоугольник */}
          <div
            className="main-rectangle"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`
            }}
          >
            <div className="width-label">{dimensions.width} мм</div>
            <div className="height-label-inside">{dimensions.height} мм</div>
          </div>

          {/* Нижнее обозначение */}
          <div className="bottom-label">
            <div className="triangle-up"></div>
            <div className="edge-text">{edgingNameL1 || 'Кромка L1'}</div>
          </div>
        </div>

        {/* Правая сторона */}
        <div className="right-side">
          <div className="arrow-right">◄</div>
          <div className="dimension-label vertical-text dimension-right">
          </div>
          <div className="edge-label vertical-text">
            {edgingNameW1 || 'Кромка W1'}
          </div>
        </div>
      </div>



      <style>{`
       .diagram-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;              /* расстояние между колонками (уменьшите при необходимости) */
          background: white;
          min-height: 250px;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }





        .left-side, .right-side {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;       /* было 100px — уменьшили */
          // padding: 0 4px;        /* внутренние отступы, можно 0 */
        }

        .left-side {
          flex-direction: row;
        }

        .right-side {
          flex-direction: row;
        }

        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-size: 10px;
          color: #333;
          margin: 0 8px;
          text-align: center;
          line-height: 1.1;
          max-width: 60px;
          word-break: break-word;
        }

        .dimension-left, .dimension-right {
          font-weight: bold;
          font-size: 11px;
          margin: 0 5px;
          color: #000;
        }

        .arrow-left, .arrow-right {
          font-size: 14px;
          color: #333;
          margin: 0 3px;
        }

        .center-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          // margin: 0 15px;
        }

        .top-label, .bottom-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 5px 0;
        }

        .edge-text {
          font-size: 10px;
          color: #333;
          margin: 3px 0;
          text-align: center;
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .triangle-down {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #333;
          margin: 3px 0;
        }

        .triangle-up {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 8px solid #333;
          margin: 3px 0;
        }

        .main-rectangle {
          background-color: #d0d0d0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: stretch;
          border: 2px solid #999;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          min-width: 120px;
          min-height: 80px;
          padding: 8px;
        }

        .width-label {
          font-size: 12px;
          font-weight: bold;
          color: #333;
          text-align: center;
          align-self: center;
        }

        .height-label-inside {
          font-size: 12px;
          font-weight: bold;
          color: #333;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          align-self: flex-start;
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
        }

        @media (max-width: 768px) {
          .diagram-container {
            padding: 20px 10px;
            overflow-x: auto;
          }
          
          .vertical-text {
            font-size: 9px;
            margin: 0 8px;
          }
          
          .edge-text {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
};

export default EdgeDiagram;