import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button/Button";
import cls from "./Homepage.module.css";

const STORAGE_KEY = "shift_data";

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export function Homepage() {
  const saved = loadFromStorage();

  const [startTime, setStartTime] = useState(
    saved?.finalStats ? null : (saved?.startTime ?? null),
  );
  const [totalCases, setTotalCases] = useState(saved?.totalCases ?? 0);
  const [totalBreakMs, setTotalBreakMs] = useState(saved?.totalBreakMs ?? 0);
  const [pauseTime, setPauseTime] = useState(saved?.pauseTime ?? null);
  const [totalCasesPerHour, setTotalCasesPerHour] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [orderInput, setOrderInput] = useState("");
  const [finalStats, setFinalStats] = useState(saved?.finalStats ?? null);
  const [orderHistory, setOrderHistory] = useState(saved?.orderHistory ?? []);

  const [editStartOpen, setEditStartOpen] = useState(false);
  const [editBreakOpen, setEditBreakOpen] = useState(false);
  const [editStartInput, setEditStartInput] = useState("");
  const [editBreakInput, setEditBreakInput] = useState("");
  const [editHistoryIndex, setEditHistoryIndex] = useState(null);
  const [editHistoryInput, setEditHistoryInput] = useState("");

  const intervalRef = useRef(null);
  const startTimeRef = useRef(startTime);
  const totalCasesRef = useRef(totalCases);
  const totalBreakMsRef = useRef(totalBreakMs);
  const pauseTimeRef = useRef(pauseTime);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  useEffect(() => {
    totalCasesRef.current = totalCases;
  }, [totalCases]);
  useEffect(() => {
    totalBreakMsRef.current = totalBreakMs;
  }, [totalBreakMs]);
  useEffect(() => {
    pauseTimeRef.current = pauseTime;
  }, [pauseTime]);

  useEffect(() => {
    if (!startTime) return;
    saveToStorage({
      startTime,
      totalCases,
      totalBreakMs,
      pauseTime,
      finalStats,
      orderHistory,
    });
  }, [
    startTime,
    totalCases,
    totalBreakMs,
    pauseTime,
    finalStats,
    orderHistory,
  ]);

  useEffect(() => {
    if (!startTime) return;

    intervalRef.current = setInterval(() => {
      const start = startTimeRef.current;
      if (!start) return;
      if (pauseTimeRef.current) return;

      const workingTimeMs = Date.now() - start - totalBreakMsRef.current;
      if (workingTimeMs < 1000) return;

      const workingTimeHours = workingTimeMs / (1000 * 60 * 60);
      setTotalCasesPerHour(
        Math.round(totalCasesRef.current / workingTimeHours),
      );
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  const startShiftHandler = () => {
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;
    setFinalStats(null);
    setOrderHistory([]);
  };

  const openPopup = () => {
    setOrderInput("");
    setShowPopup(true);
  };

  const confirmOrder = () => {
    const count = parseInt(orderInput, 10);
    if (!isNaN(count) && count > 0) {
      setTotalCases((prev) => prev + count);
      setOrderHistory((prev) => [...prev, { time: Date.now(), count }]);
    }
    setShowPopup(false);
  };

  const pauseHandler = () => {
    if (pauseTime) {
      const breakDuration = Date.now() - pauseTime;
      setTotalBreakMs((prev) => prev + breakDuration);
      totalBreakMsRef.current += breakDuration;
      setPauseTime(null);
    } else {
      setPauseTime(Date.now());
    }
  };

  const finishShiftHandler = () => {
    if (startTime) {
      const workingTimeMs = Date.now() - startTime - totalBreakMsRef.current;
      const workingTimeHours = workingTimeMs / (1000 * 60 * 60);
      const finalPickRate =
        workingTimeHours > 0
          ? Math.round(totalCasesRef.current / workingTimeHours)
          : 0;

      const stats = {
        pickRate: finalPickRate,
        totalCases: totalCasesRef.current,
        startTime,
        workingTimeMs,
      };

      setFinalStats(stats);
      saveToStorage({ finalStats: stats });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setStartTime(null);
      startTimeRef.current = null;
      setPauseTime(null);
      pauseTimeRef.current = null;
      return;
    }

    clearStorage();
    setFinalStats(null);
    setTotalCases(0);
    setTotalCasesPerHour(0);
    setTotalBreakMs(0);
    setOrderHistory([]);
    totalCasesRef.current = 0;
    totalBreakMsRef.current = 0;
  };

  const openEditStart = () => {
    if (!startTime) return;
    const d = new Date(startTime);
    const pad = (n) => String(n).padStart(2, "0");
    setEditStartInput(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
    setEditStartOpen(true);
  };

  const confirmEditStart = () => {
    const ts = new Date(editStartInput).getTime();
    if (!isNaN(ts) && ts < Date.now()) {
      setStartTime(ts);
      startTimeRef.current = ts;
    }
    setEditStartOpen(false);
  };

  const openEditBreak = () => {
    const totalMinutes = Math.floor(totalBreakMs / 1000 / 60);
    setEditBreakInput(String(totalMinutes));
    setEditBreakOpen(true);
  };

  const confirmEditBreak = () => {
    const minutes = parseInt(editBreakInput, 10);
    if (!isNaN(minutes) && minutes >= 0) {
      const ms = minutes * 60 * 1000;
      setTotalBreakMs(ms);
      totalBreakMsRef.current = ms;
    }
    setEditBreakOpen(false);
  };

  const openEditHistory = (i) => {
    setEditHistoryIndex(i);
    setEditHistoryInput(String(orderHistory[i].count));
  };

  const confirmEditHistory = () => {
    const count = parseInt(editHistoryInput, 10);
    if (!isNaN(count) && count > 0) {
      const oldCount = orderHistory[editHistoryIndex].count;
      const diff = count - oldCount;
      setOrderHistory((prev) =>
        prev.map((entry, i) =>
          i === editHistoryIndex ? { ...entry, count } : entry,
        ),
      );
      setTotalCases((prev) => prev + diff);
    }
    setEditHistoryIndex(null);
  };

  const deleteHistoryEntry = (i) => {
    const entry = orderHistory[i];
    setTotalCases((prev) => prev - entry.count);
    setOrderHistory((prev) => prev.filter((_, idx) => idx !== i));
  };

  const formatBreakTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}м ${seconds}с`;
  };

  const formatWorkingTime = (ms) => {
    const totalMinutes = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
  };

  if (finalStats) {
    return (
      <div className={cls.finalScreen}>
        <h2 className={cls.finalTitle}>Shift complete</h2>
        <div className={cls.finalPickrate}>{finalStats.pickRate}</div>
        <strong className={cls.strong}>Final Pick Rate / hour</strong>
        <div className={cls.finalInfo}>
          <p>Total cases: {finalStats.totalCases}</p>
          <p>Working time: {formatWorkingTime(finalStats.workingTimeMs)}</p>
          <p>
            Start time: {new Date(finalStats.startTime).toLocaleString("ru-RU")}
          </p>
        </div>
        <Button type={"red"} onClick={finishShiftHandler}>
          Clear & New Shift
        </Button>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className={cls.pickrate}>
          {totalCasesPerHour > 0 ? totalCasesPerHour : "—"}
        </div>
        <strong className={cls.strong}>Current Pick Rate</strong>
      </div>

      <div>
        {startTime && !pauseTime && (
          <div className={cls.addorder}>
            <Button type={"blue"} onClick={openPopup}>
              Add order
            </Button>
          </div>
        )}

        <div className={cls.btnGroup}>
          {!startTime && (
            <Button type={"red"} onClick={startShiftHandler}>
              Start
            </Button>
          )}
          {startTime && !pauseTime && (
            <>
              <Button type={"carrot"} onClick={pauseHandler}>
                Pause
              </Button>
              <Button type={"green"} onClick={finishShiftHandler}>
                Finish
              </Button>
            </>
          )}
          {startTime && pauseTime && (
            <Button type={"carrot"} onClick={pauseHandler}>
              Resume
            </Button>
          )}
        </div>

        {startTime && (
          <div className={cls.info}>
            <p>
              Start time: {new Date(startTime).toLocaleString("ru-RU")}
              <button className={cls.editBtn} onClick={openEditStart}>
                ✏️
              </button>
            </p>
            <p>Total cases: {totalCases}</p>
            <p>
              Total breaks time: {formatBreakTime(totalBreakMs)}
              <button className={cls.editBtn} onClick={openEditBreak}>
                ✏️
              </button>
            </p>
          </div>
        )}

        {orderHistory.length > 0 && (
          <div className={cls.history}>
            <h4 className={cls.historyTitle}>Order history</h4>
            <table className={cls.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Cases</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map((entry, i) => (
                  <tr key={i}>
                    <td>{new Date(entry.time).toLocaleTimeString("ru-RU")}</td>
                    <td>+{entry.count}</td>
                    <td className={cls.tableActions}>
                      <button
                        className={cls.editBtn}
                        onClick={() => openEditHistory(i)}
                      >
                        ✏️
                      </button>
                      <button
                        className={cls.editBtn}
                        onClick={() => deleteHistoryEntry(i)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popup: добавление кейсов */}
      {showPopup && (
        <div className={cls.overlay} onClick={() => setShowPopup(false)}>
          <div className={cls.popup} onClick={(e) => e.stopPropagation()}>
            <h3 className={cls.popupTitle}>Add cases</h3>
            <input
              className={cls.popupInput}
              type="number"
              min="1"
              placeholder="Enter number of cases"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmOrder()}
              autoFocus
            />
            <div className={cls.popupButtons}>
              <Button type={"blue"} onClick={confirmOrder}>
                Confirm
              </Button>
              <Button type={"red"} onClick={() => setShowPopup(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Popup: редактирование времени старта */}
      {editStartOpen && (
        <div className={cls.overlay} onClick={() => setEditStartOpen(false)}>
          <div className={cls.popup} onClick={(e) => e.stopPropagation()}>
            <h3 className={cls.popupTitle}>Edit start time</h3>
            <input
              className={cls.popupInput}
              type="datetime-local"
              value={editStartInput}
              onChange={(e) => setEditStartInput(e.target.value)}
              autoFocus
            />
            <div className={cls.popupButtons}>
              <Button type={"blue"} onClick={confirmEditStart}>
                Save
              </Button>
              <Button type={"red"} onClick={() => setEditStartOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Popup: редактирование времени паузы */}
      {editBreakOpen && (
        <div className={cls.overlay} onClick={() => setEditBreakOpen(false)}>
          <div className={cls.popup} onClick={(e) => e.stopPropagation()}>
            <h3 className={cls.popupTitle}>Edit break time (minutes)</h3>
            <input
              className={cls.popupInput}
              type="number"
              min="0"
              value={editBreakInput}
              onChange={(e) => setEditBreakInput(e.target.value)}
              autoFocus
            />
            <div className={cls.popupButtons}>
              <Button type={"blue"} onClick={confirmEditBreak}>
                Save
              </Button>
              <Button type={"red"} onClick={() => setEditBreakOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Popup: редактирование записи в истории */}
      {editHistoryIndex !== null && (
        <div className={cls.overlay} onClick={() => setEditHistoryIndex(null)}>
          <div className={cls.popup} onClick={(e) => e.stopPropagation()}>
            <h3 className={cls.popupTitle}>Edit cases</h3>
            <input
              className={cls.popupInput}
              type="number"
              min="1"
              value={editHistoryInput}
              onChange={(e) => setEditHistoryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmEditHistory()}
              autoFocus
            />
            <div className={cls.popupButtons}>
              <Button type={"blue"} onClick={confirmEditHistory}>
                Save
              </Button>
              <Button type={"red"} onClick={() => setEditHistoryIndex(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
