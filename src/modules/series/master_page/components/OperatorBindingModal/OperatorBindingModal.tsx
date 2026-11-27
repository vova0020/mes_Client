import React, { useState, useEffect, useCallback } from 'react';
import styles from './OperatorBindingModal.module.css';
import useOperatorBindingMaster from '../../../../hooks/masterPage/useOperatorBindingMaster';
import type {
  MasterSegment,
  MachineWithOperators,
  BoundOperator,
  OperatorInfo,
} from '../../../../api/masterPage/operatorBindingMasterService';

// ===== Вспомогательные функции =====

/** Форматирует ISO-дату в «ЧЧ:ММ» */
const formatBoundAt = (iso: string): string => {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '—';
  }
};

/** Статус станка → человекочитаемый текст */
const statusLabel = (s: string): string => {
  switch (s) {
    case 'ACTIVE':
      return 'Активен';
    case 'INACTIVE':
      return 'Неактивен';
    case 'MAINTENANCE':
      return 'Обслуживание';
    case 'BROKEN':
      return 'Сломан';
    default:
      return s;
  }
};

/** Статус станка → активен ли */
const isActive = (s: string): boolean => s === 'ACTIVE';

// ===== Компонент =====

interface OperatorBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OperatorBindingModal: React.FC<OperatorBindingModalProps> = ({ isOpen, onClose }) => {
  // --- Хук с API ---
  const {
    segments,
    segmentsLoading,
    segmentsError,
    loadSegments,
    machines,
    machinesLoading,
    machinesError,
    loadMachines,
    operators,
    operatorsLoading,
    loadOperators,
    handleBind,
    handleUnbind,
    handleChangeNumber,
    actionLoading,
  } = useOperatorBindingMaster();

  // --- Локальное состояние UI ---
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Суб-модалки
  const [subModalMode, setSubModalMode] = useState<'assign' | 'detach' | 'num' | null>(null);
  const [subModalMachineId, setSubModalMachineId] = useState<number | null>(null);
  const [subModalOperatorId, setSubModalOperatorId] = useState<number | null>(null);
  const [subModalSearch, setSubModalSearch] = useState('');
  const [newPosition, setNewPosition] = useState('');

  // Тост
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // ===== Инициализация при открытии =====
  useEffect(() => {
    if (isOpen) {
      // Сброс состояния
      setExpanded({});
      setSubModalMode(null);
      setSubModalMachineId(null);
      setSubModalOperatorId(null);
      setSubModalSearch('');
      setNewPosition('');
      setToast(null);

      // Загружаем участки
      loadSegments();
    }
  }, [isOpen, loadSegments]);

  // При загрузке участков — выбираем первый или из localStorage
  useEffect(() => {
    if (segments.length === 0) return;

    // Пытаемся взять участок из localStorage
    let stageFromStorage: number | null = null;
    try {
      const raw = localStorage.getItem('selectedStage');
      if (raw) {
        const parsed = JSON.parse(raw);
        stageFromStorage = parsed?.id || null;
      }
    } catch {
      // ignore
    }

    // Если участок из localStorage есть в списке — выбираем его, иначе первый
    if (stageFromStorage && segments.some((s) => s.stageId === stageFromStorage)) {
      setSelectedStageId(stageFromStorage);
    } else {
      setSelectedStageId(segments[0].stageId);
    }
  }, [segments]);

  // При смене участка — загружаем станки
  useEffect(() => {
    if (selectedStageId !== null) {
      loadMachines(selectedStageId);
    }
  }, [selectedStageId, loadMachines]);

  // Автоскрытие тоста
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ===== Показать тост =====
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
  }, []);

  // ===== Закрыть суб-модалку =====
  const closeSubModal = useCallback(() => {
    setSubModalMode(null);
    setSubModalOperatorId(null);
    setSubModalMachineId(null);
    setSubModalSearch('');
    setNewPosition('');
  }, []);

  // ===== Открыть суб-модалку назначения =====
  const openAssign = useCallback(
    (machineId: number) => {
      setSubModalMode('assign');
      setSubModalMachineId(machineId);
      setSubModalOperatorId(null);
      setSubModalSearch('');
      // Загружаем список операторов
      loadOperators();
    },
    [loadOperators]
  );

  // ===== Открыть суб-модалку открепления =====
  const openDetach = useCallback((operatorId: number, machineId: number) => {
    setSubModalMode('detach');
    setSubModalOperatorId(operatorId);
    setSubModalMachineId(machineId);
  }, []);

  // ===== Открыть суб-модалку смены номера =====
  const openChangeNum = useCallback((operatorId: number, machineId: number, currentNumber: number) => {
    setSubModalMode('num');
    setSubModalOperatorId(operatorId);
    setSubModalMachineId(machineId);
    setNewPosition(String(currentNumber));
  }, []);

  // ===== Назначить оператора =====
  const assignSelected = useCallback(async () => {
    if (!subModalOperatorId || !subModalMachineId) return;
    const result = await handleBind(subModalOperatorId, subModalMachineId);
    if (result.success) {
      showToast(result.message || 'Оператор назначен на рабочее место');
    } else {
      showToast(result.message || 'Ошибка при назначении', 'error');
    }
    closeSubModal();
  }, [subModalOperatorId, subModalMachineId, handleBind, showToast, closeSubModal]);

  // ===== Открепить оператора =====
  const confirmDetach = useCallback(async () => {
    if (!subModalOperatorId || !subModalMachineId) return;
    const result = await handleUnbind(subModalOperatorId, subModalMachineId);
    if (result.success) {
      showToast(result.message || 'Оператор откреплён');
    } else {
      showToast(result.message || 'Ошибка при откреплении', 'error');
    }
    closeSubModal();
  }, [subModalOperatorId, subModalMachineId, handleUnbind, showToast, closeSubModal]);

  // ===== Сменить номер =====
  const confirmNumber = useCallback(async () => {
    if (!subModalOperatorId || !subModalMachineId) return;
    const num = parseInt(newPosition, 10);
    if (isNaN(num) || num <= 0) return;
    const result = await handleChangeNumber(subModalOperatorId, subModalMachineId, num);
    if (result.success) {
      showToast(result.message || 'Номер оператора изменён');
    } else {
      showToast(result.message || 'Ошибка при смене номера', 'error');
    }
    closeSubModal();
  }, [subModalOperatorId, subModalMachineId, newPosition, handleChangeNumber, showToast, closeSubModal]);

  // ===== Ранний выход =====
  if (!isOpen) return null;

  // ===== Подсчёт назначенных =====
  const countAssigned = machines.reduce((sum, m) => sum + m.operatorsCount, 0);

  // Текущий участок
  const currentSegment = segments.find((s) => s.stageId === selectedStageId);

  // ===== Найти оператора в списке привязанных к станку =====
  const findBoundOperator = (machineId: number, operatorId: number): BoundOperator | undefined => {
    const machine = machines.find((m) => m.machineId === machineId);
    return machine?.operators.find((op) => op.userId === operatorId);
  };

  // ===== Найти станок по ID =====
  const findMachine = (machineId: number): MachineWithOperators | undefined =>
    machines.find((m) => m.machineId === machineId);

  // ===== Рендер карточки станка =====
  const renderStationCard = (m: MachineWithOperators) => {
    const ops = [...m.operators].sort((a, b) => a.operatorNumber - b.operatorNumber);
    const maxShown = expanded[m.machineId] ? ops.length : Math.min(3, ops.length);
    const shown = ops.slice(0, maxShown);
    const active = isActive(m.status);

    return (
      <div
        key={m.machineId}
        className={`${styles.station} ${!active ? styles.stationInactive : ''}`}
      >
        <div className={`${styles.stationTop} ${!active ? styles.stationTopInactive : ''}`}>
          <div>
            <div className={styles.stationName}>{m.machineName}</div>
            <div className={styles.stationSubline}>
              {m.machineCode && (
                <span className={styles.stationCode}>
                  Код: <strong>{m.machineCode}</strong>
                </span>
              )}
              <small>Операторов: {m.operatorsCount}</small>
            </div>
          </div>
          <span className={`${styles.tag} ${active ? styles.tagOn : styles.tagOff}`}>
            {statusLabel(m.status)}
          </span>
        </div>
        <div className={styles.stationBody}>
          {shown.map((op) => (
            <div key={op.userId} className={styles.opLine}>
              <button
                className={styles.numPill}
                title="Изменить номер"
                onClick={() => openChangeNum(op.userId, m.machineId, op.operatorNumber)}
              >
                № {op.operatorNumber} ▾
              </button>
              <span className={styles.opName}>
                {op.lastName} {op.firstName}
              </span>
              {op.position && <span className={styles.opPosition}>{op.position}</span>}
              <span className={styles.opTime}>с {formatBoundAt(op.boundAt)}</span>
              <button
                className={`${styles.iconBtn} ${styles.iconBtnDel}`}
                title="Открепить"
                onClick={() => openDetach(op.userId, m.machineId)}
              >
                ✕
              </button>
            </div>
          ))}
          {ops.length === 0 && (
            <div className={styles.subtleEmpty}>К станку никто не привязан</div>
          )}
          {ops.length > 3 && (
            <button
              className={styles.expandBtn}
              onClick={() =>
                setExpanded((p) => ({ ...p, [m.machineId]: !p[m.machineId] }))
              }
            >
              {expanded[m.machineId]
                ? 'Свернуть'
                : `Показать ещё ${ops.length - 3} операторов`}{' '}
              ▾
            </button>
          )}
          <div className={styles.addRow}>
            <span className={styles.addRowHint}>
              Номера назначаются по свободным позициям
            </span>
            <button
              className={styles.assignBtn}
              onClick={() => openAssign(m.machineId)}
              disabled={actionLoading}
            >
              ＋ Назначить оператора
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Рендер суб-модалки назначения =====
  const renderAssignSubModal = () => {
    if (subModalMode !== 'assign' || subModalMachineId === null) return null;
    const m = findMachine(subModalMachineId);
    const selectedOp = subModalOperatorId
      ? operators.find((o) => o.userId === subModalOperatorId)
      : undefined;
    const prevMachine = selectedOp?.currentBinding
      ? selectedOp.currentBinding.machineName
      : undefined;

    // Фильтруем операторов: исключаем уже привязанных к этому станку
    const filtered = operators
      .filter(
        (o) =>
          `${o.lastName} ${o.firstName}`
            .toLowerCase()
            .includes(subModalSearch.toLowerCase()) &&
          !(o.currentBinding && o.currentBinding.machineId === subModalMachineId)
      )
      .sort(
        (a, b) =>
          Number(Boolean(a.isBound)) - Number(Boolean(b.isBound)) ||
          `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'ru')
      );

    return (
      <div className={styles.subModalOverlay} onClick={closeSubModal}>
        <div className={styles.subModalBox} onClick={(e) => e.stopPropagation()}>
          <div className={styles.subModalHeader}>
            <span>
              Назначить оператора · {m?.machineName}
              {m?.machineCode && (
                <span className={styles.subModalCode}>Код: {m.machineCode}</span>
              )}
            </span>
            <button className={styles.subModalClose} onClick={closeSubModal}>
              ✕
            </button>
          </div>
          <div className={styles.subModalBody}>
            <p className={styles.muted}>
              Все учётные записи с глобальной ролью «Оператор»
            </p>
            <div className={styles.searchBox}>
              <span>⌕</span>
              <input
                value={subModalSearch}
                placeholder="Поиск по ФИО..."
                onChange={(e) => setSubModalSearch(e.target.value)}
                autoFocus
              />
            </div>
            {operatorsLoading ? (
              <div className={styles.emptyList}>Загрузка операторов...</div>
            ) : (
              <div className={styles.resultList}>
                {filtered.map((o) => {
                  const fullName = `${o.lastName} ${o.firstName}`;
                  return (
                    <div
                      key={o.userId}
                      className={`${styles.person} ${
                        subModalOperatorId === o.userId ? styles.personActive : ''
                      }`}
                      onClick={() => setSubModalOperatorId(o.userId)}
                    >
                      <div>
                        <b>{fullName}</b>
                        {o.position && (
                          <small style={{ display: 'block', color: '#888' }}>
                            {o.position}
                          </small>
                        )}
                        <small>
                          {o.isBound && o.currentBinding
                            ? `Привязан: ${o.currentBinding.machineName}`
                            : 'Не привязан'}
                        </small>
                      </div>
                      <span
                        className={`${styles.tag} ${
                          o.isBound ? styles.tagOff : styles.tagOn
                        }`}
                      >
                        {o.isBound ? 'Перевод' : 'Свободен'}
                      </span>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className={styles.emptyList}>Совпадений не найдено</div>
                )}
              </div>
            )}
            {selectedOp && prevMachine && (
              <div className={styles.warning}>
                <b>Оператор уже привязан:</b> {prevMachine}.
                <br />
                После подтверждения прежняя привязка завершится, начнётся новая на станке «
                {m?.machineName}».
              </div>
            )}
          </div>
          <div className={styles.subModalFooter}>
            <button className={styles.btnGray} onClick={closeSubModal}>
              Отмена
            </button>
            <button
              className={styles.btnPrimary}
              disabled={!subModalOperatorId || actionLoading}
              onClick={assignSelected}
            >
              {actionLoading
                ? 'Назначение...'
                : prevMachine
                ? 'Перевести'
                : 'Назначить'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Рендер суб-модалки открепления =====
  const renderDetachSubModal = () => {
    if (subModalMode !== 'detach' || subModalOperatorId === null || subModalMachineId === null)
      return null;

    const op = findBoundOperator(subModalMachineId, subModalOperatorId);
    const m = findMachine(subModalMachineId);

    if (!op) return null;

    return (
      <div className={styles.subModalOverlay} onClick={closeSubModal}>
        <div className={styles.subModalBox} onClick={(ev) => ev.stopPropagation()}>
          <div className={styles.subModalHeader}>
            <span>Открепить оператора</span>
            <button className={styles.subModalClose} onClick={closeSubModal}>
              ✕
            </button>
          </div>
          <div className={styles.subModalBody}>
            <b>
              {op.lastName} {op.firstName}
            </b>
            {op.position && <p style={{ color: '#888', margin: '4px 0' }}>{op.position}</p>}
            <p>Рабочее место: {m?.machineName}</p>
            <p className={styles.muted}>
              Текущая авторизация будет завершена. Остальные операторы сохранят свои номера.
            </p>
          </div>
          <div className={styles.subModalFooter}>
            <button className={styles.btnGray} onClick={closeSubModal}>
              Отмена
            </button>
            <button
              className={styles.btnRed}
              onClick={confirmDetach}
              disabled={actionLoading}
            >
              {actionLoading ? 'Открепление...' : 'Открепить'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Рендер суб-модалки изменения номера =====
  const renderNumSubModal = () => {
    if (subModalMode !== 'num' || subModalOperatorId === null || subModalMachineId === null)
      return null;

    const op = findBoundOperator(subModalMachineId, subModalOperatorId);

    return (
      <div className={styles.subModalOverlay} onClick={closeSubModal}>
        <div className={styles.subModalBox} onClick={(ev) => ev.stopPropagation()}>
          <div className={styles.subModalHeader}>
            <span>Изменить номер оператора</span>
            <button className={styles.subModalClose} onClick={closeSubModal}>
              ✕
            </button>
          </div>
          <div className={styles.subModalBody}>
            <p>
              Новый номер для{' '}
              <b>
                {op ? `${op.lastName} ${op.firstName}` : 'оператора'}
              </b>
              :
            </p>
            <input
              className={styles.numInput}
              value={newPosition}
              placeholder="Введите номер"
              onChange={(ev) => setNewPosition(ev.target.value)}
              autoFocus
              type="number"
              min="1"
            />
          </div>
          <div className={styles.subModalFooter}>
            <button className={styles.btnGray} onClick={closeSubModal}>
              Отмена
            </button>
            <button
              className={styles.btnPrimary}
              onClick={confirmNumber}
              disabled={actionLoading}
            >
              {actionLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Основной backdrop модального окна */}
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
          {/* Заголовок модального окна */}
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderLeft}>
              <span className={styles.modalHeaderIcon}>♧</span>
              <div>
                <div className={styles.modalTitle}>Распределение операторов</div>
                <div className={styles.modalSubtitle}>
                  Назначение, перевод и открепление сотрудников от рабочих мест
                </div>
              </div>
            </div>
            <button className={styles.modalCloseBtn} onClick={onClose} title="Закрыть">
              ✕
            </button>
          </div>

          {/* Панель управления */}
          <div className={styles.controlBar}>
            <label className={styles.stageSelector}>
              <span className={styles.stageSelectorLabel}>Участок:</span>
              {segmentsLoading ? (
                <span style={{ fontSize: 13, color: '#888' }}>Загрузка...</span>
              ) : segmentsError ? (
                <span style={{ fontSize: 13, color: '#e74c3c' }}>{segmentsError}</span>
              ) : (
                <select
                  value={selectedStageId ?? ''}
                  onChange={(e) => setSelectedStageId(Number(e.target.value))}
                >
                  {segments.map((s) => (
                    <option key={s.stageId} value={s.stageId}>
                      {s.stageName}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <div className={styles.stageSummary}>
              <div className={styles.miniStat}>
                <b>{machines.length}</b> рабочих мест
              </div>
              <div className={styles.miniStat}>
                <b>{countAssigned}</b> назначено
              </div>
            </div>
          </div>

          {/* Контент — карточки станков */}
          <div className={styles.content}>
            <div className={styles.overline}>
              РАБОЧИЕ МЕСТА УЧАСТКА «{currentSegment?.stageName?.toUpperCase() || '...'}»
            </div>

            {machinesLoading ? (
              <div className={styles.foothelp} style={{ textAlign: 'center', padding: '40px 0' }}>
                Загрузка станков...
              </div>
            ) : machinesError ? (
              <div
                className={styles.foothelp}
                style={{ textAlign: 'center', padding: '40px 0', color: '#e74c3c' }}
              >
                {machinesError}
              </div>
            ) : machines.length === 0 ? (
              <div className={styles.foothelp} style={{ textAlign: 'center', padding: '40px 0' }}>
                На этом участке нет станков
              </div>
            ) : (
              <div className={styles.stations}>
                {machines.map((m) => renderStationCard(m))}
              </div>
            )}

            <div className={styles.foothelp}>
              Назначение выполняется по одному сотруднику и начинает отсчёт времени авторизации
              сразу. Данные автоматически синхронизируются с личным кабинетом оператора и монитором
              персонала.
            </div>
          </div>
        </div>
      </div>

      {/* Суб-модалки */}
      {renderAssignSubModal()}
      {renderDetachSubModal()}
      {renderNumSubModal()}

      {/* Тост-уведомление */}
      {toast && (
        <div
          className={styles.toast}
          style={toastType === 'error' ? { background: '#e74c3c' } : undefined}
        >
          {toast}
        </div>
      )}
    </>
  );
};

export default OperatorBindingModal;
