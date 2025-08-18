import React, { useState } from 'react';

interface EdgeDiagramProps {
  width?: number;
  height?: number;
  l1EdgeType?: string;
  W2EdgeType?: string;
}

const EdgeDiagram: React.FC<EdgeDiagramProps> = ({
  width = 2500,
  height = 1210,
  l1EdgeType = 'L1',
  W2EdgeType = 'W2'
}) => {
  const [dimensions, setDimensions] = useState({ width, height });
  const [edgeTypes, setEdgeTypes] = useState({ l1: l1EdgeType, W2: W2EdgeType });

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
      {/* Панель управления */}
      {/* <div className="controls">
        <div className="control-group">
          <label>Ширина (мм):</label>
          <input 
            type="number" 
            value={dimensions.width}
            onChange={(e) => setDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
            className="size-input"
          />
        </div>
        <div className="control-group">
          <label>Высота (мм):</label>
          <input 
            type="number" 
            value={dimensions.height}
            onChange={(e) => setDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
            className="size-input"
          />
        </div>
        <div className="control-group">
          <label>Тип кромки L1:</label>
          <input 
            type="text" 
            value={edgeTypes.l1}
            onChange={(e) => setEdgeTypes(prev => ({ ...prev, l1: e.target.value }))}
            className="edge-input"
          />
        </div>
        <div className="control-group">
          <label>Тип кромки L2:</label>
          <input 
            type="text" 
            value={edgeTypes.l2}
            onChange={(e) => setEdgeTypes(prev => ({ ...prev, l2: e.target.value }))}
            className="edge-input"
          />
        </div>
      </div> */}

      {/* Информация об ориентации */}
      {/* <div className="orientation-info">
        <span>Ориентация: </span>
        <strong>
          {isSquare ? 'Квадрат' : isVertical ? 'Вертикальная' : 'Горизонтальная'}
        </strong>
        <span> (соотношение {aspectRatio.toFixed(2)}:1)</span>
      </div> */}

      {/* Диаграмма */}
      <div className="diagram-container">
        {/* Левая сторона */}
        <div className="left-side">
          <div className="edge-label vertical-text">
            Обозначение облицовки кромки1 [{edgeTypes.W2}]
          </div>
          <div className="dimension-label vertical-text dimension-left">
            {/* {dimensions.height} мм */}
          </div>
          <div className="arrow-left">►</div>
        </div>

        {/* Центральная часть */}
        <div className="center-section">
          {/* Верхнее обозначение */}
          <div className="top-label">
            <div className="edge-text">Обозначение облицовки кромки2 [{edgeTypes.l1}]</div>
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
            <div className="edge-text">Обозначение облицовки 3 [{edgeTypes.l1}]</div>
          </div>
        </div>

        {/* Правая сторона */}
        <div className="right-side">
          <div className="arrow-right">◄</div>
          <div className="dimension-label vertical-text dimension-right">
            {/* {dimensions.height} мм */}
          </div>
          <div className="edge-label vertical-text">
            Обозначение облицовки кромки4 [{edgeTypes.W2}]
          </div>
        </div>
      </div>

      {/* Предустановленные размеры */}
      <div className="presets">
        <h3>Примеры размеров:</h3>
        <button onClick={() => setDimensions({ width: 2500, height: 1210 })}>
          Горизонтальный: 2500×1210 мм
        </button>
        <button onClick={() => setDimensions({ width: 805, height: 1500 })}>
          Вертикальный: 805×1500 мм
        </button>
        <button onClick={() => setDimensions({ width: 1000, height: 1000 })}>
          Квадрат: 1000×1000 мм
        </button>
        <button onClick={() => setDimensions({ width: 450, height: 805 })}>
          Вертикальный: 450×805 мм
        </button>
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

        .controls {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .control-group label {
          font-size: 12px;
          font-weight: bold;
          color: #333;
        }

        .size-input, .edge-input {
          padding: 5px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 80px;
          font-size: 14px;
        }

        .edge-input {
          width: 60px;
        }

        .orientation-info {
          margin-bottom: 20px;
          padding: 10px;
          background: #e8f4f8;
          border-radius: 4px;
          font-size: 14px;
          text-align: center;
        }

        .diagram-container {
          display: flex;
          align-items: center;
          justify-content: center;
          // padding: 40px 20px;
          background: white;
          min-height: 350px;
          border: 1px solid #ddd;
          border-radius: 8px;
          // margin-bottom: 20px;
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

        .presets {
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .presets h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #333;
        }

        .presets button {
          margin-right: 10px;
          margin-bottom: 8px;
          padding: 8px 12px;
          background: #e0e0e0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
        }

        .presets button:hover {
          background: #d0d0d0;
        }

        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
            gap: 10px;
          }
          
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