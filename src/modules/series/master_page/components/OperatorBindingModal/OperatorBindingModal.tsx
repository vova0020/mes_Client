import React, { useState, useEffect } from 'react';
import styles from './OperatorBindingModal.module.css';

// Этапы производства (демонстрационные данные)
interface Stage {
  id: string;
  name: string;
}

// Станок
interface Machine {
  id: string;
  name: string;
  code: string;
  stage: string;
  active: boolean;
}

// Сотрудник (оператор)
interface Employee {
  id: number;
  name: string;
  machine: string | null;
  position: number | null;
  start: string | null;
  prior: number;
}

const defaultStages: Stage[] = [
  { id: 'edge', name: 'Кромкооблицовка' },
  { id: 'drill', name: 'Присадка' },
  { id: 'packing', name: 'Упаковка' },
];

const defaultMachines: Machine[] = [
  { id: 'm1', name: 'Кромка №1', code: 'P311', stage: 'edge', active: true },
  { id: 'm2', name: 'Кромка №2', code: 'P312', stage: 'edge', active: true },
  { id: 'm3', name: 'Piramida', code: 'P313', stage: 'edge', active: false },
  { id: 'm4', name: 'Двухсторонний IMAI ALCP0530', code: 'P314', stage: 'edge', active: false },
  { id: 'm5', name: 'SKIPPER №2', code: 'P411', stage: 'drill', active: true },
  { id: 'm6', name: 'Валерий 3000', code: 'P412', stage: 'drill', active: false },
  { id: 'm7', name: 'Упаковка готовой продукции', code: 'P511', stage: 'packing', active: true },
];

const defaultEmployees: Employee[] = [
  { id: 1, name: 'Иванов Иван', machine: 'm1', position: 1, start: '08:10', prior: 0 },
  { id: 2, name: 'Петров Сергей', machine: 'm1', position: 2, start: '08:15', prior: 0 },
  { id: 3, name: 'Сидоров Алексей', machine: 'm2', position: 1, start: '08:05', prior: 0 },
  { id: 4, name: 'Кузнецов Дмитрий', machine: 'm2', position: 2, start: '09:00', prior: 35 },
  { id: 5, name: 'Смирнов Андрей', machine: 'm5', position: 1, start: '07:55', prior: 0 },
  { id: 6, name: 'Орлов Максим', machine: 'm7', position: 1, start: '08:20', prior: 0 },
  { id: 7, name: 'Фёдоров Николай', machine: 'm7', position: 2, start: '08:35', prior: 0 },
  { id: 8, name: 'Зайцев Павел', machine: 'm7', position: 3, start: '09:10', prior: 0 },
  { id: 9, name: 'Белов Виктор', machine: 'm7', position: 4, start: '09:15', prior: 0 },
  { id: 10, name: 'Морозов Игорь', machine: 'm7', position: 5, start: '09:15', prior: 0 },
  { id: 11, name: 'Васильев Роман', machine: null, position: null, start: null, prior: 170 },
  { id: 12, name: 'Соколов Артём', machine: null, position: null, start: null, prior: 0 },
  { id: 13, name: 'Волков Денис', machine: null, position: null, start: null, prior: 215 },
  { id: 14, name: 'Новиков Егор', machine: null, position: null, start: null, prior: 0 },
  { id: 15, name: 'Попов Михаил', machine: null, position: null, start: null, prior: 80 },
  { id: 16, name: 'Лебедев Олег', machine: null, position: null, start: null, prior: 0 },
  { id: 17, name: 'Ковалёв Антон', machine: null, position: null, start: null, prior: 0 },
  { id: 18, name: 'Богданов Кирилл', machine: null, position: null, start: null, prior: 0 },
];

interface OperatorBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const nowMinutes = 14 * 60 + 40;

const mins = (t: string | null): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const formatMins = (m: number): string =>
  `${Math.floor(m / 60)} ч ${String(m % 60).padStart(2, '0')} мин`;

const currentDuration = (e: Employee): number =>
  e.machine ? Math.max(0, nowMinutes - mins(e.start)) : 0;

const dayDuration = (e: Employee): number => e.prior + currentDuration(e);

const formatTime = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const OperatorBindingModal: React.FC<OperatorBindingModalProps> = ({ isOpen, onClose }) => {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    defaultEmployees.map((e) => ({ ...e }))
  );
  const [masterStage, setMasterStage] = useState<string>('edge');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [subModalMode, setSubModalMode] = useState<'assign' | 'detach' | 'num' | null>(null);
  const [subModalMachine, setSubModalMachine] = useState<string | null>(null);
  const [subModalEmployee, setSubModalEmployee] = useState<number | null>(null);
  const [subModalSearch, setSubModalSearch] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Сброс состояния при открытии
  useEffect(() => {
    if (isOpen) {
      setEmployees(defaultEmployees.map((e) => ({ ...e })));
      setMasterStage('edge');
      setExpanded({});
      setSubModalMode(null);
      setSubModalMachine(null);
      setSubModalEmployee(null);
      setSubModalSearch('');
      setNewPosition('');
      setToast(null);
    }
  }, [isOpen]);

  // Автоскрытие тоста
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2700);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!isOpen) return null;

  const machineById = (id: string | null): Machine | undefined =>
    id ? defaultMachines.find((m) => m.id === id) : undefined;

  const employeeById = (id: number): Employee | undefined =>
    employees.find((e) => e.id === id);

  const currentMachines = defaultMachines.filter((m) => m.stage === masterStage);
  const countAssigned = employees.filter(
    (e) => e.machine && currentMachines.some((m) => m.id === e.machine)
  ).length;

  const firstFree = (machineId: string): number => {
    const used = new Set(
      employees.filter((e) => e.machine === machineId).map((e) => e.position)
    );
    let n = 1;
    while (used.has(n)) n++;
    return n;
  };

  const showToast = (msg: string) => {
    setToast(msg);
  };

  const assignSelected = () => {
    if (!subModalEmployee || !subModalMachine) return;
    setEmployees((prev) => {
      const next = prev.map((e) => ({ ...e }));
      const emp = next.find((e) => e.id === subModalEmployee);
      if (!emp) return prev;
      // Если уже привязан — сохраняем время
      if (emp.machine) {
        emp.prior += currentDuration(emp);
      }
      const newNumber = firstFree(subModalMachine);
      emp.machine = subModalMachine;
      emp.position = newNumber;
      emp.start = formatTime(nowMinutes);
      return next;
    });
    showToast('Оператор назначен на рабочее место');
    closeSubModal();
  };

  const confirmDetach = () => {
    if (!subModalEmployee) return;
    setEmployees((prev) => {
      const next = prev.map((e) => ({ ...e }));
      const emp = next.find((e) => e.id === subModalEmployee);
      if (!emp) return prev;
      emp.prior += currentDuration(emp);
      emp.machine = null;
      emp.position = null;
      emp.start = null;
      return next;
    });
    showToast('Привязка завершена');
    closeSubModal();
  };

  const confirmNumber = () => {
    if (!subModalEmployee) return;
    const next = parseInt(newPosition, 10);
    if (isNaN(next) || next <= 0) return;
    setEmployees((prev) => {
      const updated = prev.map((e) => ({ ...e }));
      const emp = updated.find((e) => e.id === subModalEmployee);
      if (!emp) return prev;
      const occupant = updated.find(
        (x) => x.machine === emp.machine && x.position === next && x.id !== emp.id
      );
      if (occupant) occupant.position = emp.position;
      emp.position = next;
      return updated;
    });
    showToast('Номер оператора изменён');
    closeSubModal();
  };

  const closeSubModal = () => {
    setSubModalMode(null);
    setSubModalEmployee(null);
    setSubModalMachine(null);
    setSubModalSearch('');
    setNewPosition('');
  };

  const openAssign = (machineId: string) => {
    setSubModalMode('assign');
    setSubModalMachine(machineId);
    setSubModalEmployee(null);
    setSubModalSearch('');
  };

  const openDetach = (id: number) => {
    setSubModalMode('detach');
    setSubModalEmployee(id);
  };

  const openChangeNum = (id: number) => {
    setSubModalMode('num');
    setSubModalEmployee(id);
    const e = employeeById(id);
    setNewPosition(e?.position ? String(e.position) : '');
  };

  // ===== Рендер карточки станка =====
  const renderStationCard = (m: Machine) => {
    const ops = employees
      .filter((e) => e.machine === m.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    const maxShown = expanded[m.id] ? ops.length : Math.min(3, ops.length);
    const shown = ops.slice(0, maxShown);

    return (
      <div key={m.id} className={`${styles.station} ${!m.active ? styles.stationInactive : ''}`}>
        <div className={`${styles.stationTop} ${!m.active ? styles.stationTopInactive : ''}`}>
          <div>
            <div className={styles.stationName}>{m.name}</div>
            <div className={styles.stationSubline}>
              <span className={styles.stationCode}>
                Код: <strong>{m.code}</strong>
              </span>
              <small>Операторов: {ops.length}</small>
            </div>
          </div>
          <span className={`${styles.tag} ${m.active ? styles.tagOn : styles.tagOff}`}>
            {m.active ? 'Активен' : 'Неактивен'}
          </span>
        </div>
        <div className={styles.stationBody}>
          {shown.map((e) => (
            <div key={e.id} className={styles.opLine}>
              <button
                className={styles.numPill}
                title="Изменить номер"
                onClick={() => openChangeNum(e.id)}
              >
                № {e.position} ▾
              </button>
              <span className={styles.opName}>{e.name}</span>
              <span className={styles.opTime}>с {e.start}</span>
              <button
                className={`${styles.iconBtn} ${styles.iconBtnDel}`}
                title="Открепить"
                onClick={() => openDetach(e.id)}
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
              onClick={() => setExpanded((p) => ({ ...p, [m.id]: !p[m.id] }))}
            >
              {expanded[m.id] ? 'Свернуть' : `Показать ещё ${ops.length - 3} операторов`} ▾
            </button>
          )}
          <div className={styles.addRow}>
            <span className={styles.addRowHint}>Номера назначаются по свободным позициям</span>
            <button className={styles.assignBtn} onClick={() => openAssign(m.id)}>
              ＋ Назначить оператора
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Рендер суб-модалки назначения =====
  const renderAssignSubModal = () => {
    if (subModalMode !== 'assign' || !subModalMachine) return null;
    const m = machineById(subModalMachine);
    const current = subModalEmployee ? employeeById(subModalEmployee) : undefined;
    const prev = current ? machineById(current.machine) : undefined;
    const filtered = employees
      .filter(
        (e) =>
          e.name.toLowerCase().includes(subModalSearch.toLowerCase()) &&
          e.machine !== subModalMachine
      )
      .sort(
        (a, b) =>
          Number(Boolean(a.machine)) - Number(Boolean(b.machine)) ||
          a.name.localeCompare(b.name, 'ru')
      );

    return (
      <div className={styles.subModalOverlay} onClick={closeSubModal}>
        <div className={styles.subModalBox} onClick={(e) => e.stopPropagation()}>
          <div className={styles.subModalHeader}>
            <span>
              Назначить оператора · {m?.name}
              <span className={styles.subModalCode}>Код: {m?.code}</span>
            </span>
            <button className={styles.subModalClose} onClick={closeSubModal}>
              ✕
            </button>
          </div>
          <div className={styles.subModalBody}>
            <p className={styles.muted}>Все учётные записи с глобальной ролью «Оператор»</p>
            <div className={styles.searchBox}>
              <span>⌕</span>
              <input
                value={subModalSearch}
                placeholder="Поиск по ФИО..."
                onChange={(e) => setSubModalSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.resultList}>
              {filtered.map((e) => {
                const mm = machineById(e.machine);
                return (
                  <div
                    key={e.id}
                    className={`${styles.person} ${subModalEmployee === e.id ? styles.personActive : ''}`}
                    onClick={() => setSubModalEmployee(e.id)}
                  >
                    <div>
                      <b>{e.name}</b>
                      <small>{mm ? `Привязан: ${mm.name}` : 'Не привязан'}</small>
                    </div>
                    <span className={`${styles.tag} ${mm ? styles.tagOff : styles.tagOn}`}>
                      {mm ? 'Перевод' : 'Свободен'}
                    </span>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className={styles.emptyList}>Совпадений не найдено</div>
              )}
            </div>
            {current && prev && (
              <div className={styles.warning}>
                <b>Оператор уже привязан:</b> {prev.name} (
                {defaultStages.find((s) => s.id === prev.stage)?.name}).
                <br />
                После подтверждения прежняя привязка завершится, начнётся новая на станке «
                {m?.name}».
              </div>
            )}
          </div>
          <div className={styles.subModalFooter}>
            <button className={styles.btnGray} onClick={closeSubModal}>
              Отмена
            </button>
            <button
              className={styles.btnPrimary}
              disabled={!subModalEmployee}
              onClick={assignSelected}
            >
              {prev ? 'Перевести' : 'Назначить'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Рендер суб-модалки открепления =====
  const renderDetachSubModal = () => {
    if (subModalMode !== 'detach' || !subModalEmployee) return null;
    const e = employeeById(subModalEmployee);
    if (!e) return null;
    const m = e.machine ? machineById(e.machine) : undefined;
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
            <b>{e.name}</b>
            <p>Рабочее место: {m?.name}</p>
            <p className={styles.muted}>
              Текущая авторизация будет завершена. Остальные операторы сохранят свои номера.
            </p>
          </div>
          <div className={styles.subModalFooter}>
            <button className={styles.btnGray} onClick={closeSubModal}>
              Отмена
            </button>
            <button className={styles.btnRed} onClick={confirmDetach}>
              Открепить
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Рендер суб-модалки изменения номера =====
  const renderNumSubModal = () => {
    if (subModalMode !== 'num' || !subModalEmployee) return null;
    const e = employeeById(subModalEmployee);
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
              Новый номер для <b>{e?.name}</b>:
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
            <button className={styles.btnPrimary} onClick={confirmNumber}>
              Сохранить
            </button>
          </div>
        </div>
      </div>
    );
  };

  const stage = defaultStages.find((s) => s.id === masterStage);

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
              <span className={styles.stageSelectorLabel}>Этап:</span>
              <select value={masterStage} onChange={(e) => setMasterStage(e.target.value)}>
                {defaultStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.stageSummary}>
              <div className={styles.miniStat}>
                <b>{currentMachines.length}</b> рабочих мест
              </div>
              <div className={styles.miniStat}>
                <b>{countAssigned}</b> назначено
              </div>
            </div>
          </div>

          {/* Контент — карточки станков */}
          <div className={styles.content}>
            <div className={styles.overline}>
              РАБОЧИЕ МЕСТА ЭТАПА «{stage?.name.toUpperCase()}»
            </div>
            <div className={styles.stations}>
              {currentMachines.map((m) => renderStationCard(m))}
            </div>
            <div className={styles.foothelp}>
              Назначение выполняется по одному сотруднику и начинает отсчёт времени авторизации
              сразу. Данные автоматически синхронизируются с личным кабинетом оператора и монитором
              персонала. <strong>Коды станков в макете демонстрационные</strong>; в реальной системе
              отображается код рабочего места из его настроек.
            </div>
          </div>
        </div>
      </div>

      {/* Суб-модалки */}
      {renderAssignSubModal()}
      {renderDetachSubModal()}
      {renderNumSubModal()}

      {/* Тост-уведомление */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
};

export default OperatorBindingModal;
